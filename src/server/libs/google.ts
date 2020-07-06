import qs from "qs";
import { GOOGLE_CLIENT_INFO } from "../configs/config"
import axios from 'axios';

const stringifiedParams = qs.stringify({
  client_id: GOOGLE_CLIENT_INFO.clientId,
  redirect_uri: GOOGLE_CLIENT_INFO.redirectUri,
  scope: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ].join(' '), // space seperated string
  response_type: 'code',
  access_type: 'offline',
  prompt: 'consent',
});

export const googleLoginUrl = `https://accounts.google.com/o/oauth2/v2/auth?${stringifiedParams}`;

export async function getAccessTokenFromCode(code: string) {
  const result = await axios({
    url: `https://oauth2.googleapis.com/token`,
    method: 'post',
    data: {
      client_id: GOOGLE_CLIENT_INFO.clientId,
      client_secret: GOOGLE_CLIENT_INFO.clientSecret,
      redirect_uri: GOOGLE_CLIENT_INFO.redirectUri,
      grant_type: 'authorization_code',
      code,
    },
  });
  return result;
};