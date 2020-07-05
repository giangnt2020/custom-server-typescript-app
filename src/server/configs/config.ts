import {config as configDotenv} from 'dotenv'
import {resolve} from 'path'

switch(process.env.NODE_ENV) {
  case "development":
    console.log("Environment is 'development'")
    configDotenv({
      path: resolve(__dirname, ".../../.env.development")
    })
    break
  case "test":
    configDotenv({
      path: resolve(__dirname, "../../.env.test")
    })
    break
  // Add 'staging' and 'production' cases here as well!
  case "production":
    configDotenv({
      path: resolve(__dirname, "../../.env")
    })
    break
  default:
    throw new Error(`'NODE_ENV' ${process.env.NODE_ENV} is not handled!`)
}

export const CLIENT_INFO = {
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
}

export const verifierCode = "YXWneoMBai5jnxLmEwibHnOH49wQYv1sGw_DSJ9plvI"