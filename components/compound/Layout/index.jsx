import clsx from 'clsx'
import { Container } from "@mantine/core";
import Head from "next/head";

const defaultSeo = {
	title: "Teamtro",
	description: "Retrospectives for teams",
}
export function Layout({ children, seo = defaultSeo, className, tw }) {

	const activeStyle = clsx("flex flex-col", className, tw)

  return (
    <Container>
      <Head>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
			<main className={activeStyle}>
				{children}
			</main>
    </Container>
  );
}
