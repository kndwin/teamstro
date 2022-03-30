import clsx from "clsx";
import { Button as MButton } from "@mantine/core";

export function Button({ tw, className, children, color = "dark", ...props }) {
  const activeStyle = clsx(tw, className);

  return (
    <MButton className={activeStyle} color={color} {...props}>
      {children}
    </MButton>
  );
}
