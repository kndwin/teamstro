import { Layout, Text } from "components";
import { useRouter } from "next/router";

import { usePubSub, STATUS } from "hooks/usePubSub.js";
import { Group } from "@mantine/core";
import { Cards, Button } from "components";

export default function Room() {
  const router = useRouter();
  const { id } = router.query;
  const { status } = usePubSub();

  return (
    <Layout>
      <Text>
        <span className="font-bold">{`Room ID: `}</span>
        {id}
      </Text>
      <Text>
        <span className="font-bold">{`Connection: `}</span>
        {status === STATUS.CONNECTED && `✅`}
        {status === STATUS.CONNECTING && `🔄`}
        {status === STATUS.DISCONNECTED && `❌`}
      </Text>
      <Button
        onClick={() => router.push("/")}
        className="w-fit"
      >{`Back`}</Button>
      <Cards roomId={id} />
    </Layout>
  );
}
