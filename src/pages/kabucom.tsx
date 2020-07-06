import Layout from "../components/Layout";
import withAuth from "../hocs/withAuth";
import Link from "next/link";

interface API {
  name: string;
  endpoint: string;
}

const kabucom = "/api/kabucom";

const apiList1: API[] = [
  {
    name: "[master] /symbol/stock",
    endpoint: `${kabucom}/symbol/stock?symbol=1301&limitFlag=true`,
  },
  {
    name: "[master] /symbol/fund",
    endpoint: `${kabucom}/symbol/fund?FundCode=0431198B`,
  },
  // {
  //   name: "[master] /symbol/future",
  //   endpoint: `${kabucom}/symbol/future?securityType=101&symbol=160060018&count=50&limitFlag=true`,
  // },
  // {
  //   name: "[master] /symbol/option",
  //   endpoint: `${kabucom}/symbol/option`,
  // },
  // {
  //   name: "[master] /symbol/index",
  //   endpoint: `${kabucom}/symbol/index`,
  // },
  {
    name: "[market] /chart-leg/index",
    endpoint: `${kabucom}/chart-leg/index?ticket=101@T&legtype=1M&count=10`,
  },
  {
    name: "[market] /chart-leg/stock?ticket=3306@T&legType=1m",
    endpoint: `${kabucom}/chart-leg/stock?ticket=3306@T&legType=1m`,
  },
];

const apiList2: API[] = [
  {
    name: "[account] /execution-list/stock",
    endpoint: `${kabucom}/execution-list/stock?systemDayFrom=20190101&systemDayTo=20200706`,
  },
  {
    name: "[account] /position-list/stock",
    endpoint: `${kabucom}/position-list/stock?symbol=1301&accountType=1`,
  },
  {
    name: "[account] /order-list/stock",
    endpoint: `${kabucom}/order-list/stock?systemDayFrom=20190101&systemDayTo=20200706`,
  },
  {
    name: "[account] /order-list/future",
    endpoint: `${kabucom}/order-list/future?systemDayFrom=20190101&systemDayTo=20200706`,
  },
  // {
  //   name: "[wallet] /wallet/cash",
  //   endpoint: `${kabucom}/wallet/cash?symbol=3306&exchange=T`,
  // },
  // {
  //   name: "[wallet] /wallet/margin",
  //   endpoint: `${kabucom}/wallet/margin?symbol=3306&exchange=T`,
  // },
];

const CustomLink = (api: API) => {
  return (
    <li key={api.endpoint} style={{ marginTop: "20px" }}>
      <Link href={api.endpoint} as={api.endpoint}>
        <a>{api.name}</a>
      </Link>
    </li>
  );
};

export default withAuth(function KabucomAPI() {
  return (
    <Layout>
      <h3>Client credential grant</h3>
      <p>master: Acquires the brand master information</p>
      <p>market: Acquires the market price information</p>
      {/* <p>system:	Get data with system privileges</p>
      <p>streaming_marketdata:	Market price information streaming</p> */}
      <ul>
        {apiList1.map((api) => {
          return CustomLink(api);
        })}
      </ul>
      <hr />
      <h3>Authorization code grant</h3>
      <p>account: Refer to your account information</p>
      {/* <p>wallet Refers to the customer's possible amount</p> */}
      <ul>
        {apiList2.map((api) => {
          return CustomLink(api);
        })}
      </ul>
    </Layout>
  );
});
