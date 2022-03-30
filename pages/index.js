import { Layout, Text } from "components";
import { useTranslations } from "next-intl";
import { useRouter } from "next/router";
import { RiDoorLine } from "react-icons/ri";
import { nanoid } from "nanoid";
import { Button } from "@mantine/core";

export default function Home() {
  const t = useTranslations("Index");
  const router = useRouter();

  const handleCreateRoom = () => {
    const roomId = nanoid();
    router.replace(`/room/${roomId}`);
  };

  return (
    <Layout>
      <Text tw="mx-auto w-fit mt-12" as="h1">
        {t("title")}
      </Text>
      <Text tw="mx-auto w-fit">{t("description")}</Text>
      <Button
        color="dark"
        className="mx-auto mt-12 w-fit"
        onClick={() => handleCreateRoom()}
        leftIcon={<RiDoorLine />}
      >
        {t("create-room")}
      </Button>
    </Layout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      messages: require(`locale/${locale}.json`),
    },
  };
}
