import { useState, useEffect } from "react";
import clsx from "clsx";
import { STATUS } from "hooks/usePubSub";
import { useRouter } from "next/router";
import {
  Group,
  Text,
  Switch,
  Tooltip,
  Paper,
  Badge,
  useMantineColorScheme,
} from "@mantine/core";
import {
  BsSunFill,
  BsMoonFill,
  BsArrowLeft,
  BsArrowClockwise,
  BsCheckSquareFill,
  BsXLg,
} from "react-icons/bs";
import { useClipboard } from "@mantine/hooks";

import { COLORS } from "styles/colors";
import { useBreakpoint, usePubSub } from "hooks";
import { Button } from "components";

export const Header = ({ roomId }) => {
  const router = useRouter();
  const { sm } = useBreakpoint();

  return (
    <Group position="apart" my="lg" align="baseline" px="lg">
      {sm ? (
        <>
          <Group>
            <Connection />
            <RoomId roomId={roomId} />
          </Group>
          <Group>
            <DarkModeSwitch />
          </Group>
        </>
      ) : (
        <>
          <Connection />
          <DarkModeSwitch />
        </>
      )}
    </Group>
  );
};

const DarkModeSwitch = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  return (
    <Group spacing="xs">
      <BsSunFill
        className={
          colorScheme === "dark" ? "text-neutral-200" : "text-neutral-900"
        }
      />
      <Switch
        checked={colorScheme === "dark"}
        onChange={() => toggleColorScheme()}
        className="cursor-pointer"
        size="lg"
        color="dark"
        classNames={{
          input: clsx(
            colorScheme === "dark" ? "bg-neutral-900" : "bg-neutral-200",
            "cursor-pointer"
          ),
          root: "cursor-pointer",
        }}
        styles={{
          input: {
            "&:checked": {
              backgroundColor: "rgb(23 23 23)",
            },
            "&:checked::before": {
              borderColor: "rgb(23 23 23)",
            },
          },
        }}
      />
      <BsMoonFill
        className={
          colorScheme === "dark" ? "text-neutral-200" : "text-neutral-900"
        }
      />
    </Group>
  );
};

const RoomId = ({ roomId }) => {
  const clipboard = useClipboard({ timeout: 500 });
  const { colorScheme } = useMantineColorScheme();
  const [clicked, setClicked] = useState(false);
  const handleClick = () => {
    setClicked(true);
    setInterval(() => {
      setClicked(false);
    }, 1000);
    clipboard.copy(window.location.href);
  };

  return (
    <Tooltip opened={clicked} label="Copied" position="right">
      <Group>
        <Button onClick={() => handleClick()}>
          <Text>{roomId}</Text>
        </Button>
        {!clicked && (
          <Text
            className={
              colorScheme === "dark" ? "text-neutral-200" : "text-neutral-900"
            }
          >{`Click to copy URL`}</Text>
        )}
      </Group>
    </Tooltip>
  );
};

const Connection = () => {
  const { colorScheme } = useMantineColorScheme();
  const [tooltip, setTooltip] = useState(false);
  const { status } = usePubSub();
  useEffect(() => {
    setTimeout(() => {
      if (status === STATUS.CONNECTING) {
        setTooltip(true);
      }
    }, 5_000);
  }, []);
  useEffect(() => {
    if (tooltip) {
      setTimeout(() => {
        setTooltip(false);
      }, 10_000);
    }
  }, [tooltip]);
  const statusObj = {
    [STATUS.CONNECTED]: {
      icon: <BsCheckSquareFill />,
      color: COLORS.green.rgb,
      mantineColor: "green",
      text: "Connected",
    },
    [STATUS.CONNECTING]: {
      icon: BsXLg,
      color: COLORS.yellow.rgb,
      mantineColor: "yellow",
      text: "Not ready",
    },
    [STATUS.DISCONNECTED]: {
      icon: <BsXLg />,
      color: COLORS.rose.rgb,
      mantineColor: "red",
      text: "Disconnected",
    },
  };

  return (
    <Tooltip
      opened={tooltip}
      position="bottom"
      placement="end"
      withArrow
      gutter={15}
      width={170}
      wrapLines
      label={
        status === STATUS.CONNECTING &&
        `If "Not ready" for too long, please refresh the browser`
      }
    >
      <Badge
        className={clsx("text-neutral-900")}
        size="xl"
        variant="dot"
        color={statusObj[status].mantineColor}
      >
        <Text
          className={
            colorScheme === "dark" ? "text-neutral-200" : "text-neutral-900"
          }
        >
          {statusObj[status].text}
        </Text>
      </Badge>
    </Tooltip>
  );
};
