import React, { ReactElement } from 'react';
import App, { AppInitialProps } from 'next/app';
import cookie from 'cookie';
import { CookieMessage } from '../@types/index';
import { AuthProvider } from '../providers/Auth';

type AppProps = {
  userType: number;
  authenticated: boolean;
};

class MyApp extends App<AppProps> {
  render(): ReactElement {
    const { Component, pageProps, userType, authenticated } = this.props;
    return (
      <AuthProvider userType={userType} authenticated={authenticated}>
        <Component {...pageProps} />
      </AuthProvider>
    );
  }
}

MyApp.getInitialProps = async (
  appContext
): Promise<AppInitialProps & AppProps> => {
  let authenticated = false;
  let userType = -1;
  const request = appContext.ctx.req as CookieMessage;
  if (request) {
    request.cookies = cookie.parse(request.headers.cookie || '');
    authenticated = !!request.cookies.authenticated;
    userType = !!request.cookies.authenticated ? parseInt(request.cookies.authenticated, 10) : -1;
  }

  // Call the page's `getInitialProps` and fill `appProps.pageProps`
  const appProps = await App.getInitialProps(appContext);

  return { ...appProps, userType, authenticated };
};

export default MyApp;
