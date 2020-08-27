import { CLIENT_INFO, verifierCode } from "../configs/config"
import crypto from "crypto"
import qs from "qs";
import axios, { AxiosPromise } from 'axios';

export const base64URLEncode = (str: any) => {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

export const sha256 = (buffer: any) => {
    return crypto.createHash('sha256').update(buffer).digest();
}

export const generateChallengeCode = (codeVerifier: any) => { return base64URLEncode(sha256(codeVerifier)); }

export const generateState = () => {
    return crypto.randomBytes(20).toString("hex");
}

export const getTokenURI = () => {
    const { tokenHost, tokenPath } = CLIENT_INFO
    return `${tokenHost}${tokenPath}`
}

export const getAuthenticationURI = () => {
    const { clientId, authorizeHost, authorizePath, callbackUrl, scope } = CLIENT_INFO
    const authParams = qs.stringify({
        client_id: clientId,
        scope,
        code_challenge: generateChallengeCode(verifierCode),
        code_challenge_method: "S256",
        redirect_uri: callbackUrl,
        state: generateState(),
        response_type: "code",
        prompt: "login"
    })
    return `${authorizeHost}${authorizePath}?${authParams}`
}

export const getTokenFromCode = (code: string): AxiosPromise<any> => {
    const data = qs.stringify({
        grant_type: CLIENT_INFO.grantType,
        code: code,
        redirect_uri: CLIENT_INFO.callbackUrl,
        code_verifier: verifierCode,
        client_id: CLIENT_INFO.clientId
    })
    return axios({
        method: 'post',
        url: getTokenURI(),
        data,
        headers: {
            'Authorization': "Basic " + Buffer.from(`${CLIENT_INFO.clientId}:${CLIENT_INFO.clientSecret}`).toString("base64"),
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
}

export const getTokenByClientCredential = (): AxiosPromise<any> => {
    const data = qs.stringify({
        'grant_type': 'client_credentials',
        'scope': 'kabu.com_api_v1:master kabu.com_api_v1:market'
    });

    return axios({
        method: 'post',
        url: getTokenURI(),
        headers: {
            'Authorization': "Basic " + Buffer.from(`${CLIENT_INFO.clientId}:${CLIENT_INFO.clientSecret}`).toString("base64"),
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data
    })
};

export const refreshToken = (token: string): AxiosPromise<any> => {
    const data = qs.stringify({
      grant_type: 'refresh_token',
      refresh_token: token
    });
    return axios({
      method: 'post',
      url: getTokenURI(),
      data,
      headers: {
        'Authorization': "Basic " + Buffer.from(`${CLIENT_INFO.clientId}:${CLIENT_INFO.clientSecret}`).toString("base64"),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  }