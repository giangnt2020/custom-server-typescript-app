import Layout from "../components/Layout";
import withAuth from "../hocs/withAuth";

export default withAuth(function Profile() {
  return (
    <Layout>
      <h3>Profile</h3>
    </Layout>
  );
});