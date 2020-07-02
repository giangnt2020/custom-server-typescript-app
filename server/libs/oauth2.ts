import { CLIENT_INFO, verifierCode } from "../configs/config"
import crypto from "crypto"

export const base64URLEncode = (str: any) => {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
export const sha256 = (buffer: any) => {
    return crypto.createHash('sha256').update(buffer).digest();
}

export const generateState = () => {
    return crypto.randomBytes(20).toString("hex");
}


export const generateChallengeCode = (codeVerifier: any) => { return base64URLEncode(sha256(codeVerifier)); }

export const getTokenURI = () => {
    const { tokenHost, tokenPath } = CLIENT_INFO
    return `${tokenHost}${tokenPath}`
}

export const getAuthenticationURI = () => {
    const { clientId, authorizeHost, authorizePath, callbackUrl, scope } = CLIENT_INFO
    const state = generateState()
    return `${authorizeHost}${authorizePath}?client_id=${clientId}&scope=${scope}&code_challenge=${generateChallengeCode(verifierCode)}&redirect_uri=${callbackUrl}&code_challenge_method=S256&state=${state}&response_type=code&prompt=login`
}