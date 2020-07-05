"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const next_1 = __importDefault(require("next"));
const express_1 = __importDefault(require("express"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const express_session_1 = __importDefault(require("express-session"));
const config = __importStar(require("./configs/config"));
const oauth2 = __importStar(require("./libs/oauth2"));
const axios_1 = __importDefault(require("axios"));
const qs_1 = __importDefault(require("qs"));
const config_1 = require("./configs/config");
const connect_dynamodb_1 = __importDefault(require("connect-dynamodb"));
// import { useAuth } from '../providers/Auth';
const SESSION_MAX_AGE = process.env.SESSION_MAX_AGE ? parseInt(process.env.SESSION_MAX_AGE) : 12 * 60 * 60 * 1000; // = 12 hours = 43200 seconds
const server = express_1.default();
const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next_1.default({ dev });
const handle = app.getRequestHandler();
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
};
const DynamoDBStore = connect_dynamodb_1.default(express_session_1.default);
const store = new DynamoDBStore(dynamodbOptions);
const MESSAGES = {
    error404: "The request has not been applied because it lacks valid authentication credentials for the target resource."
};
const getTokenKabucom = (req, res) => {
    const data = qs_1.default.stringify({
        grant_type: config.CLIENT_INFO.grantType,
        code: req.query.code,
        redirect_uri: config.CLIENT_INFO.callbackUrl,
        code_verifier: config.verifierCode,
        client_id: config.CLIENT_INFO.clientId
    });
    axios_1.default({
        method: 'post',
        url: oauth2.getTokenURI(),
        data,
        headers: {
            'Authorization': "Basic " + Buffer.from(`${config.CLIENT_INFO.clientId}:${config.CLIENT_INFO.clientSecret}`).toString("base64"),
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).then(result => {
        const hour = SESSION_MAX_AGE;
        req.session.cookie.expires = new Date(Date.now() + hour);
        req.session.cookie.maxAge = hour;
        req.session.domain = "kabucom";
        req.session.token = result.data;
        req.session.access_token_expires = new Date(Date.now() + result.data["expires_in"] * 1000);
        res.cookie("session", "1");
        res.redirect("/");
    }).catch((err) => {
        const message = err.response ? err.response.data.error_description || err.response.message : err.message;
        res.status(400).json({ message });
    });
};
const refreshToken = async (token) => {
    const data = qs_1.default.stringify({
        grant_type: 'refresh_token',
        refresh_token: token
    });
    let res = await axios_1.default({
        method: 'post',
        url: oauth2.getTokenURI(),
        data,
        headers: {
            'Authorization': "Basic " + Buffer.from(`${config.CLIENT_INFO.clientId}:${config.CLIENT_INFO.clientSecret}`).toString("base64"),
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    return res;
};
const customProxies = [
    {
        context: "/api/kabucom",
        options: {
            target: "https://prod.rest.api.kabu.co.jp/v1",
            pathRewrite: async (path, req) => {
                const expires = new Date(req.session.access_token_expires);
                const current = new Date();
                if (current >= expires && req.session.token["refresh_token"]) {
                    const getNewAccessToken = await refreshToken(req.session.token["refresh_token"]);
                    if (getNewAccessToken.data && getNewAccessToken.data["expires_in"]) {
                        req.session.token["access_token"] = getNewAccessToken.data["access_token"];
                        req.session.token["expires_in"] = getNewAccessToken.data["expires_in"];
                        req.session.access_token_expires = new Date(Date.now() + getNewAccessToken.data["expires_in"] * 1000);
                    }
                }
                return path.replace('/api/kabucom', '');
            },
            changeOrigin: true,
            onProxyReq: (proxyReq, req, res) => {
                // add custom header to request
                proxyReq.setHeader("accept", "*/*");
                proxyReq.setHeader("x-api-key", config_1.CLIENT_INFO.apiKey);
                if (req.session.token) {
                    proxyReq.setHeader("authorization", `Bearer ${req.session.token["access_token"]}`);
                }
                else {
                    res.status(401).json({ message: MESSAGES.error404 });
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
];
app.prepare()
    .then(() => {
    // Set up session
    server.use(express_session_1.default({
        secret: 'supper_power_secret',
        store,
        proxy: true,
        cookie: {
            secure: !dev,
            httpOnly: !dev,
            maxAge: SESSION_MAX_AGE
        },
    }));
    // Set up the proxy.
    if (customProxies) {
        customProxies.forEach((proxy) => {
            server.use(proxy.context, http_proxy_middleware_1.createProxyMiddleware(proxy.options));
        });
    }
    // just for debug 
    server.get('/session', (req, res, _next) => {
        res.send(` sessionId: ${req.sessionID}, session: ${JSON.stringify(req.session)}`);
    });
    server.get('/api/logout', (req, res, _next) => {
        req.session.destroy(() => {
            res.clearCookie('connect.sid', {});
            res.clearCookie('session');
            res.status(200).end();
        });
    });
    server.get("/oauth2/login", (_req, res) => {
        res.redirect(oauth2.getAuthenticationURI());
    });
    server.get("/oauth2/callback", (req, res) => {
        getTokenKabucom(req, res);
    });
    // Default catch-all handler to allow Next.js to handle all other routes
    server.all('*', (req, res) => handle(req, res));
    server.listen(port, (err) => {
        if (err) {
            throw err;
        }
        console.log(`> Ready on port ${port} [${process.env.NODE_ENV}]`);
    });
})
    .catch((err) => {
    console.log('An error occurred, unable to start the server');
    console.log(err);
});
//# sourceMappingURL=index.js.map