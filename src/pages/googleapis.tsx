import Layout from "../components/Layout";
import withAuth from "../hocs/withAuth";
import Link from "next/link";

export default withAuth(function Profile() {
  return (
    <Layout>
      <h3>Google APIs</h3>
      <Link href="/oauth2/v2/userinfo">
        <a>"/oauth2/v2/userinfo"</a>
      </Link>
    </Layout>
  );
});