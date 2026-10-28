import { serverFetch } from "@/server/actions/server-auth";
import { FC } from "react";

interface pageProps {}

const page = async ({}) => {
  serverFetch("");
  return <div>page</div>;
};

export default page;
