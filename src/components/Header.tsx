import Link from "next/link";
import { useUserType, useIsAuthenticated } from "../providers/Auth";

export default function Header() {
  const isAuthenticated = useIsAuthenticated();
  const userType = useUserType();
  return (
    <header>
      <Link href="/">
        <a>Home</a>
      </Link>{" "}
      |{" "}
      {isAuthenticated ? (
        <>
          {(userType === 0 || userType === 1) && (
            <>
              <Link href="/kabucom">
                <a>Kabucom APIs</a>
              </Link>{" "}
              |{" "}
            </>
          )}
          {userType === 2 && (
            <>
              <Link href="/googleapis">
                <a>Google APIs</a>
              </Link>{" "}
              |{" "}
            </>
          )}
          <Link href="/logout">
            <a>Logout</a>
          </Link>
        </>
      ) : (
        <Link href="/login">
          <a>Login</a>
        </Link>
      )}
      <hr />
    </header>
  );
}
