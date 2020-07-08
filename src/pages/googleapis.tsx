import React from "react";
import Layout from "../components/Layout";
import withAuth from "../hocs/withAuth";

function GoogleApis({
  initialData,
}: {
  initialData: any;
}) {
  const [data, setData] = React.useState(initialData);

  const fetchData = () => {
    fetch("/api/google/oauth2/v2/userinfo")
    .then(async (res) => {
      const newData = await res.json();
      setData(newData)
    })
    .catch((err)=> {
      // alert(err);
      console.log(err)
    })
  };

  const handleClick = (event: any) => {
    event.preventDefault();
    setData("loading...")
    fetchData();
  };
  return (
    <Layout>
      <h3>Google APIs</h3>
      <ul>
        <li>
          <button onClick={handleClick}>GET /oauth2/v2/userinfo </button>
          <br/>
          <hr/>
          <textarea rows={20} style={{ width:"80%" }} value={JSON.stringify(data, null, 2)} readOnly></textarea>
        </li>
      </ul>
    </Layout>
  );
};

GoogleApis.getInitialProps = async () => {  
  return { initialData: {} };
};

export default withAuth(GoogleApis);
