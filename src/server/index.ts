import next from "next";
import express from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import session from "express-session";
import * as config from "./configs/config";
import * as oauth2 from "./libs/oauth2";
import axios from "axios";
import qs from "qs";
import { CLIENT_INFO } from "./configs/config";
import connectDynamodb from "connect-dynamodb";
// import { useAuth } from '../providers/Auth';

const SESSION_MAX_AGE = process.env.SESSION_MAX_AGE ? parseInt(process.env.SESSION_MAX_AGE) : 12 * 60 * 60 * 1000 // = 12 hours = 43200 seconds

const server = express()
const port = parseInt(process.env.PORT || '3000', 10)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

const dynamodbOptions = {
  // Optional DynamoDB table name, defaults to 'sessions'
  table: 'custom-server-sessions',

  // Optional JSON object of AWS credentials and configuration
  AWSConfigJSON: {
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
      region: 'ap-northeast-1'
  },

  // Optional ProvisionedThroughput params, defaults to 5
  readCapacityUnits: 10,
  writeCapacityUnits: 10
}
const DynamoDBStore = connectDynamodb(session);
const store = new DynamoDBStore(dynamodbOptions);

interface ICustomProxy {
  context: string,
  options: Options
}
const MESSAGES = {
  error404: "The request has not been applied because it lacks valid authentication credentials for the target resource."
}

const getTokenKabucom = (req: any, res: any) => {
  const data = qs.stringify({
    grant_type: config.CLIENT_INFO.grantType,
    code: req.query.code,
    redirect_uri: config.CLIENT_INFO.callbackUrl,
    code_verifier: config.verifierCode,
    client_id: config.CLIENT_INFO.clientId
  })
  axios({
    method: 'post',
    url: oauth2.getTokenURI(),
    data,
    headers: {
      'Authorization': "Basic " + Buffer.from(`${config.CLIENT_INFO.clientId}:${config.CLIENT_INFO.clientSecret}`).toString("base64"),
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).then(result => {
    const hour = SESSION_MAX_AGE
    req.session!.cookie.expires = new Date(Date.now() + hour)
    req.session!.cookie.maxAge = hour
    req.session!.domain = "kabucom"
    req.session!.token = result.data
    req.session!.access_token_expires = new Date(Date.now() + result.data["expires_in"] * 1000)
    res.cookie("session", "1")
    res.redirect("/")
  }).catch((err) => {
    const message = err.response ? err.response.data.error_description || err.response.message : err.message
    res.status(400).json({ message })
  });
}

const refreshToken = async (token: string): Promise<any> => {
  const data = qs.stringify({
    grant_type: 'refresh_token',
    refresh_token: token
  });
  let res = await axios({
    method: 'post',
    url: oauth2.getTokenURI(),
    data,
    headers: {
      'Authorization': "Basic " + Buffer.from(`${config.CLIENT_INFO.clientId}:${config.CLIENT_INFO.clientSecret}`).toString("base64"),
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
  return res;
}

const customProxies: ICustomProxy[] = [
  {
    context: "/api/kabucom",
    options: {
      target: "https://prod.rest.api.kabu.co.jp/v1",
      pathRewrite: async (path, req) => {
        const expires = new Date(req.session!.access_token_expires);
        const current = new Date();
        if (current >= expires && req.session!.token["refresh_token"]) {
          const getNewAccessToken = await refreshToken(req.session!.token["refresh_token"])
          if (getNewAccessToken.data && getNewAccessToken.data["expires_in"]) {
            req.session!.token["access_token"] = getNewAccessToken.data["access_token"]
            req.session!.token["expires_in"] = getNewAccessToken.data["expires_in"]
            req.session!.access_token_expires = new Date(Date.now() + getNewAccessToken.data["expires_in"] * 1000)
          }
        }
        return path.replace('/api/kabucom', '');
      },
      changeOrigin: true,
      onProxyReq: (proxyReq, req, res) => {
        // add custom header to request
        proxyReq.setHeader("accept", "*/*");
        proxyReq.setHeader("x-api-key", CLIENT_INFO.apiKey);
        if (req.session!.token) {
          proxyReq.setHeader("authorization", `Bearer ${req.session!.token["access_token"]}`);
        } else {
          res.status(401).json({ message: MESSAGES.error404 })
        }
      },
      logLevel: "debug"
    }
  },
  {
    context: "/api/social",
    options: {
      target: "https://5ef41258ac6d1e00168c9b5a.mockapi.io/api/v2",
      pathRewrite: {
        "^/api/social": "/"
      },
      changeOrigin: true
    }
  }
]

app.prepare()
  .then(() => {
    // Set up session
    server.use(
      session({
        secret: 'supper_power_secret',
        store,
        proxy: true,
        cookie: {
          secure: !dev,
          httpOnly: !dev,
          maxAge: SESSION_MAX_AGE
        },
      })
    )
    // Set up the proxy.
    if (customProxies) {
      customProxies.forEach((proxy) => {
        server.use(proxy.context, createProxyMiddleware(proxy.options))
      })
    }

    // just for debug 
    server.get('/session', (req, res, _next) => {
      res.send(
        ` sessionId: ${req.sessionID}, session: ${JSON.stringify(req.session)}`
      )
    })

    server.get('/api/logout', (req, res, _next) => {
      req.session!.destroy(() => {
        res.clearCookie('connect.sid', {});
        res.clearCookie('session');
        res.status(200).end();
      })
    })

    server.get("/oauth2/login", (_req, res) => {
      res.redirect(oauth2.getAuthenticationURI());
    });

    server.get("/oauth2/callback", (req, res) => {
      getTokenKabucom(req, res);
    });

    // Default catch-all handler to allow Next.js to handle all other routes
    server.all('*', (req, res) => handle(req, res))

    server.listen(port, (err) => {
      if (err) {
        throw err
      }
      console.log(`> Ready on port ${port} [${process.env.NODE_ENV}]`)
    })
  })
  .catch((err) => {
    console.log('An error occurred, unable to start the server')
    console.log(err)
  })
