import { FC, Suspense } from "react";
import { cookies } from "next/headers";
import ClientChild from "./_comp/client-child";

interface pageProps {}

const Child = async function () {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("name");
  return (
    <>
      <p>child</p>
      <ClientChild cookie={cookie} />
    </>
  );
};

const page = async ({}: pageProps) => {
  return (
    <div>
      <Suspense fallback={<p>Loading...</p>}>
        <Child />
      </Suspense>
    </div>
  );
};

export default page;
