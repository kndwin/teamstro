import {
  Popover as MPopover,
  useMantineColorScheme,
  ActionIcon,
  Box,
  Paper,
} from "@mantine/core";
import { useState } from "react";
import { FiMoreHorizontal, FiMove } from "react-icons/fi";

export function Popover({
  children,
  classNames,
  trigger,
  open,
  setOpen,
  ...props
}) {
  const [showEditPopper, setShowEditPopper] = useState(false);
  const { colorScheme } = useMantineColorScheme();

  const popoverState = {
    onClose: Boolean(setOpen)
      ? () => setOpen(false)
      : () => setShowEditPopper(false),
    onOpen: Boolean(setOpen)
      ? () => setOpen(true)
      : () => setShowEditPopper(true),
    open: Boolean(open) ? open : showEditPopper,
  };

  const DefaultIcon = () =>
    trigger ? (
      <Box onClick={popoverState.onOpen}>{trigger}</Box>
    ) : (
      <ActionIcon
        onClick={popoverState.onOpen}
        width={24}
        size="xl"
        color="dark"
      >
        <FiMoreHorizontal
          className={
            colorScheme === "dark" ? "text-neutral-200" : "text-neutral-900"
          }
          size={24}
        />
      </ActionIcon>
    );

  return (
    <MPopover
      position="bottom"
      placement="end"
      width="100%"
      radius="md"
      target={<DefaultIcon />}
      opened={popoverState.open}
      onClose={popoverState.onClose}
      classNames={{
        popover: colorScheme === "dark" ? "bg-neutral-900" : "bg-neutral-100",
        ...classNames,
      }}
      {...props}
    >
      <Paper
        className={colorScheme === "dark" ? "bg-neutral-900" : "bg-neutral-100"}
      >
        {children}
      </Paper>
    </MPopover>
  );
}
