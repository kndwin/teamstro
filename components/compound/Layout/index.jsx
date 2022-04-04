import clsx from "clsx";
import { useMantineColorScheme, Box } from "@mantine/core";
import Head from "next/head";

const defaultSeo = {
  title: "Teamtro",
  description: "Retrospectives for teams",
};
export function Layout({ children, seo = defaultSeo, className, tw }) {
  const activeStyle = clsx("flex flex-col", className, tw);
  const { colorScheme } = useMantineColorScheme();

  return (
    <Box
      className={clsx(
        "w-full h-full min-h-screen min-w-screen",
        colorScheme === "dark" ? "bg-neutral-800" : "bg-neutral-100",
				"overflow-hidden"
      )}
    >
      <Head>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={activeStyle}>{children}</main>
    </Box>
  );
}
