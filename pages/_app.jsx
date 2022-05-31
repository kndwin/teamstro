import "styles/global.css";
import { useEffect, useState } from "react";
import { NextIntlProvider } from "next-intl";
import { usePubSub } from "hooks";
import { MantineProvider, ColorSchemeProvider } from "@mantine/core";

function MyApp({ Component, pageProps }) {
  const { connect, disconnect } = usePubSub();
  const [colorScheme, setColorScheme] = useState("light");
  const toggleColorScheme = (color) => {
    setColorScheme(color || colorScheme === "light" ? "dark" : "light");
  };

  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);

  return (
    <ColorSchemeProvider
      colorScheme={colorScheme}
      toggleColorScheme={toggleColorScheme}
    >
      <MantineProvider theme={{ colorScheme }}>
        <NextIntlProvider messages={pageProps.messages}>
          <Component {...pageProps} />
        </NextIntlProvider>
      </MantineProvider>
    </ColorSchemeProvider>
  );
}

export default MyApp;
