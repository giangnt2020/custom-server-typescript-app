import React, { ReactNode, ReactElement } from "react";

type AuthContext = {
  userType: number;
  setUserType: React.Dispatch<React.SetStateAction<number>>;
  isAuthenticated: boolean;
  setAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
};

const AuthContext = React.createContext<AuthContext>({
  userType: -1,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setUserType: () => {},
  isAuthenticated: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setAuthenticated: () => {},
});

/**
 * The initial value of `isAuthenticated` comes from the `authenticated`
 * prop which gets set by _app. We store that value in state and ignore
 * the prop from then on. The value can be changed by calling the
 * `setAuthenticated()` method in the context.
 */
export const AuthProvider = ({
  children,
  userType,
  authenticated,
}: {
  children: ReactNode;
  userType: number;
  authenticated: boolean;
}): ReactElement => {
  const [isAuthenticated, setAuthenticated] = React.useState<boolean>(
    authenticated
  );
  const [nUserType, setUserType] = React.useState<number>(userType);
  return (
    <AuthContext.Provider
      value={{
        userType: nUserType,
        setUserType,
        isAuthenticated,
        setAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContext {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useIsAuthenticated(): boolean {
  const context = useAuth();
  return context.isAuthenticated;
}

export function useUserType(): number {
  const context = useAuth();
  return context.userType;
}
