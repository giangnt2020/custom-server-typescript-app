"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthenticationURI = exports.getTokenURI = exports.generateChallengeCode = exports.generateState = exports.sha256 = exports.base64URLEncode = void 0;
const config_1 = require("../configs/config");
const crypto_1 = __importDefault(require("crypto"));
exports.base64URLEncode = (str) => {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};
exports.sha256 = (buffer) => {
    return crypto_1.default.createHash('sha256').update(buffer).digest();
};
exports.generateState = () => {
    return crypto_1.default.randomBytes(20).toString("hex");
};
exports.generateChallengeCode = (codeVerifier) => { return exports.base64URLEncode(exports.sha256(codeVerifier)); };
exports.getTokenURI = () => {
    const { tokenHost, tokenPath } = config_1.CLIENT_INFO;
    return `${tokenHost}${tokenPath}`;
};
exports.getAuthenticationURI = () => {
    const { clientId, authorizeHost, authorizePath, callbackUrl, scope } = config_1.CLIENT_INFO;
    const state = exports.generateState();
    return `${authorizeHost}${authorizePath}?client_id=${clientId}&scope=${scope}&code_challenge=${exports.generateChallengeCode(config_1.verifierCode)}&redirect_uri=${callbackUrl}&code_challenge_method=S256&state=${state}&response_type=code&prompt=login`;
};
//# sourceMappingURL=oauth2.js.map