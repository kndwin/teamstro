import { Layout } from "components";
import { useRouter } from "next/router";

import { Cards, Timer, Header } from "components/pages/room";

export default function Room() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <Layout>
      <Header roomId={id} />
      <Timer roomId={id} />
      <Cards roomId={id} />
    </Layout>
  );
}
