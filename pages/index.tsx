import Link from "next/link";

interface API {
  name: string;
  endpoint: string;
}

const kabucom = "/api/kabucom";

const apiList: API[] = [
  {
    name: "OAuth 2.0 Login (Kabucom)",
    endpoint: "/oauth2/login",
  },
  {
    name: "Log out",
    endpoint: "/logout",
  },
  {
    name: "/chart-leg/index",
    endpoint: `${kabucom}/chart-leg/index?ticket=101@T&legtype=1M&count=10`,
  },
  {
    name: "/symbol/stock",
    endpoint: `${kabucom}/symbol/stock?symbol=1301&limitFlag=true`,
  },
  {
    name: "/symbol/fund",
    endpoint: `${kabucom}/symbol/fund?FundCode=0431198B`,
  },
  {
    name: "/symbol/future",
    endpoint: `${kabucom}/symbol/future?securityType=101&symbol=160060018&count=50&limitFlag=true`,
  },
  {
    name: "/symbol/option",
    endpoint: `${kabucom}/symbol/option`,
  },
  {
    name: "/symbol/index",
    endpoint: `${kabucom}/symbol/index`,
  },
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

export default function Home() {
  return (
    <ul>
      {apiList.map((api) => {
        return CustomLink(api);
      })}
    </ul>
  );
}
