"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifierCode = exports.CLIENT_INFO = void 0;
const dotenv_1 = require("dotenv");
const path_1 = require("path");
switch (process.env.NODE_ENV) {
    case "development":
        console.log("Environment is 'development'");
        dotenv_1.config({
            path: path_1.resolve(__dirname, ".../../.env.development")
        });
        break;
    case "test":
        dotenv_1.config({
            path: path_1.resolve(__dirname, "../../.env.test")
        });
        break;
    // Add 'staging' and 'production' cases here as well!
    case "production":
        dotenv_1.config({
            path: path_1.resolve(__dirname, "../../.env")
        });
        break;
    default:
        throw new Error(`'NODE_ENV' ${process.env.NODE_ENV} is not handled!`);
}
exports.CLIENT_INFO = {
    clientId: "iK4qVn-DSkG7hnh_-iWgyw",
    clientSecret: "T7e6FwJXyvchgm71RgXVIDpi45l8llbrldM_ONg_g9FKjOfpLJ39zyC89oBqh6YGWtZlx_TLOMilE1AHOjSv8Q",
    apiKey: "QiTtEaYkly3TWlGE3QYmF7CTnKLKKkIG9MB1HVvS",
    callbackUrl: "https://omron-app.kabu.co.jp/callback",
    authorizeHost: "https://prodacc-login-ma.kabu.co.jp",
    authorizePath: "/authorize",
    tokenHost: "https://prodacc-login-oidc.kabu.co.jp",
    tokenPath: "/oauth2/token",
    scope: "kabu.com_api_v1:account kabu.com_api_v1:master kabu.com_api_v1:market offline_access",
    grantType: "authorization_code",
};
exports.verifierCode = "YXWneoMBai5jnxLmEwibHnOH49wQYv1sGw_DSJ9plvI";
//# sourceMappingURL=config.js.map