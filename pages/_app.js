import "styles/global.css";
import { useEffect } from "react";
import { NextIntlProvider } from "next-intl";
import {usePubSub} from "hooks";

function MyApp({ Component, pageProps }) {

	const { connect, disconnect } = usePubSub()

	useEffect(() => {
		connect()
		return () => disconnect()
	}, [])

  return (
    <NextIntlProvider messages={pageProps.messages}>
      <Component {...pageProps} />
    </NextIntlProvider>
  );
}

export default MyApp;
