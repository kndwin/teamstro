import clsx from "clsx";
import {
  Title as MTitle,
  Text as MText,
  useMantineColorScheme,
} from "@mantine/core";

const variants = {
  gradient: {
    pink: "text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-blue-500",
  },
  fontSize: {
    h1: "text-7xl",
    h2: "text-6xl",
    h3: "text-5xl",
    h4: "text-4xl",
    h5: "text-3xl",
    h6: "text-2xl",
    p: "text-base",
  },
};

export function Text({
  children,
  as = "p",
  gradient = "",
  disableColorScheme = false,
  tw,
  className,
  ...props
}) {
  const { colorScheme } = useMantineColorScheme();
  const activeStyle = clsx(
    variants.gradient[gradient],
    variants.fontSize[as],
    !disableColorScheme && colorScheme === "dark"
      ? "text-neutral-200"
      : "text-neutral-900",
    tw,
    className
  );

  if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(as)) {
    return (
      <MTitle as={as} className={activeStyle} {...props}>
        {children}
      </MTitle>
    );
  } else {
    return (
      <MText className={activeStyle} {...props}>
        {children}
      </MText>
    );
  }
}
