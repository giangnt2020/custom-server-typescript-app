import React from "react";
import withoutAuth from "../hocs/withoutAuth";
import Link from "next/link";

export default withoutAuth(function Login() {
  // const { setAuthenticated } = useAuth();
  return (
    <>
      <h3>Login</h3>
      <ul>
        <li>
          <Link href="/oauth2/login" as="/oauth2/login">
            <button>Login with Kabucom Account</button>
          </Link>
        </li>
        <p />
        <li>
          <Link href="#" as="#">
            <button>Guest</button>
          </Link>
        </li>
        <p />

        <li>
          <Link href="#" as="#">
            <button>Login with Google</button>
          </Link>
        </li>
        <p />

        <li>
          <Link href="#" as="#">
            <button>Login with Apple</button>
          </Link>
        </li>
      </ul>
    </>
  );
});
