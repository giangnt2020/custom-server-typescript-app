import next from "next";
import * as http from 'http';
import express from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import session from "express-session";
import * as oauth2 from "./libs/oauth2";
import * as google from "./libs/google";
import { CLIENT_INFO } from "./configs/config";
import connectDynamodb from "connect-dynamodb";

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
    region: process.env.AWS_REGION
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

const handleOnProxyRequest = (proxyReq: http.ClientRequest, req: express.Request, res: express.Response) => {
  // add custom header to request
  proxyReq.setHeader("accept", "*/*");
  proxyReq.setHeader("x-api-key", CLIENT_INFO.apiKey);
  if (req.session!.token) {
    proxyReq.setHeader("authorization", `Bearer ${req.session!.token["access_token"]}`);
  } else {
    res.status(401).json({ message: MESSAGES.error404 })
  }
}


const customProxies: ICustomProxy[] = [
  {
    context: "/api/kabucom",
    options: {
      target: "https://prod.rest.api.kabu.co.jp/v1",
      pathRewrite: async (path, req) => {
        const expires = new Date(req.session!.access_token_expires);
        const current = new Date();
        const cookiesExpires = new Date(req.session!.cookie.expires.toString());
        if (current < cookiesExpires && current >= expires && req.session!.token["refresh_token"]) {
          try {
            const getNewAccessToken = await oauth2.refreshToken(req.session!.token["refresh_token"])
            if (getNewAccessToken.data && getNewAccessToken.data["expires_in"]) {
              req.session!.token["access_token"] = getNewAccessToken.data["access_token"]
              req.session!.token["expires_in"] = getNewAccessToken.data["expires_in"]
              req.session!.access_token_expires = new Date(Date.now() + getNewAccessToken.data["expires_in"] * 1000)
            }
          } catch (err) {
            throw new Error(JSON.stringify(req.session!.cookie.expires));
          }
        }
        return path.replace('/api/kabucom', '');
      },
      changeOrigin: true,
      onProxyReq: handleOnProxyRequest,
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
  },
  {
    context: "/api/google",
    options: {
      target: "https://www.googleapis.com",
      pathRewrite: async (path, req) => {
        const expires = new Date(req.session!.access_token_expires);
        const current = new Date();
        const cookiesExpires = new Date(req.session!.cookie.expires.toString());
        if (current < cookiesExpires && current >= expires && req.session!.token["refresh_token"]) {
          try {
            const getNewAccessToken = await google.refreshToken(req.session!.token["refresh_token"])
            if (getNewAccessToken.data && getNewAccessToken.data["expires_in"]) {
              req.session!.token["access_token"] = getNewAccessToken.data["access_token"]
              req.session!.token["expires_in"] = getNewAccessToken.data["expires_in"]
              req.session!.access_token_expires = new Date(Date.now() + getNewAccessToken.data["expires_in"] * 1000)
            }
          } catch (err) {
            throw new Error(JSON.stringify(req.session!.cookie.expires));
          }
        }
        return path.replace('/api/google', '');
      },
      changeOrigin: true,
      onProxyReq: handleOnProxyRequest,
      logLevel: "debug"
    }
  },
]

const sessionOptions: session.SessionOptions = {
  secret: 'supper_power_secret',
  store,
  proxy: true,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: !dev,
    httpOnly: !dev,
    maxAge: SESSION_MAX_AGE
  },
}

app.prepare()
  .then(() => {
    // Set up session
    server.use(session(sessionOptions))
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
        res.clearCookie('authenticated');
        setTimeout(() => res.status(200).end(), 1000);
      })
    })

    server.get("/oauth2/login", (_req, res) => {
      res.redirect(oauth2.getAuthenticationURI());
    });

    server.get("/oauth2/callback", (req, res) => {
      const code = req.query.code ? req.query.code.toString() : ""
      try {
        const getToken = oauth2.getTokenFromCode(code)
        getToken.then((result) => {
          const hour = SESSION_MAX_AGE
          req.session!.cookie.expires = new Date(Date.now() + hour)
          req.session!.cookie.maxAge = hour
          req.session!.domain = "kabucom"
          req.session!.token = result.data
          req.session!.access_token_expires = new Date(Date.now() + result.data["expires_in"] * 1000)
          req.session?.save((err) => {
            if (!err) {
              res.cookie("authenticated", "1")
              res.redirect("/kabucom")
            } else {
              res.status(400).json({ message: err })
            }
          })
        })
          .catch((err) => {
            const message = err.response ? err.response.data.error_description || err.response.message : err.message
            res.status(400).json({ message })
          });
      } catch (err) {
        res.status(500).json({ message: err.message })
      }
    });

    server.get("/api/login/guest", (req, res) => {
      try {
        const getToken = oauth2.getTokenByClientCredential();
        getToken.then((result) => {
          const hour = SESSION_MAX_AGE
          req.session!.cookie.expires = new Date(Date.now() + hour)
          req.session!.cookie.maxAge = hour
          req.session!.domain = "kabucom"
          req.session!.token = result.data
          req.session!.access_token_expires = new Date(Date.now() + result.data["expires_in"] * 1000)
          req.session?.save((err) => {
            if (!err) {
              res.cookie("authenticated", "0")
              res.redirect("/kabucom")
            } else {
              res.status(400).json({ message: err })
            }
          })
        })
          .catch((err) => {
            const message = err.response ? err.response.data.error_description || err.response.message : err.message
            res.status(400).json({ message })
          });
      } catch (err) {
        res.status(500).json({ message: err.message })
      }
    });

    server.get("/api/login/google", (_req, res) => {
      res.redirect(google.googleLoginUrl);
    });

    server.get("/oauth2/callback/google", async (req, res) => {
      const code = req.query.code ? req.query.code.toString() : ""
      try {
        const result = await google.getAccessTokenFromCode(code)
        const hour = SESSION_MAX_AGE
        req.session!.cookie.expires = new Date(Date.now() + hour)
        req.session!.cookie.maxAge = hour
        req.session!.domain = "google"
        req.session!.token = result.data
        req.session!.access_token_expires = new Date(Date.now() + result.data["expires_in"] * 1000)
        req.session?.save((err) => {
          if (!err) {
            res.cookie("authenticated", "2")
            res.redirect("/googleapis")
          } else {
            res.status(400).json({ message: err })
          }
        })
      } catch (err) {
        res.status(500).json({ message: err.message })
      }
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
