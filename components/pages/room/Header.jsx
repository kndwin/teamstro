import { useState } from "react";
import clsx from "clsx";
import { STATUS } from "hooks/usePubSub";
import { useRouter } from "next/router";
import {
  Group,
  Text,
  Switch,
  Tooltip,
  Paper,
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
            <Connection size="full" />
            <RoomId roomId={roomId} />
          </Group>
          <Group>
            <DarkModeSwitch />
            <Button
              onClick={() => router.push("/")}
              leftIcon={<BsArrowLeft />}
              className="w-fit"
            >{`Back`}</Button>
          </Group>
        </>
      ) : (
        <>
          <Connection size="sm" />
          <Button
            onClick={() => router.push("/")}
            leftIcon={<BsArrowLeft />}
            className="w-fit"
          >{`Back`}</Button>
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

const Connection = ({ size = "full" }) => {
  const { status } = usePubSub();
  const statusObj = {
    [STATUS.CONNECTED]: {
      icon: <BsCheckSquareFill />,
      color: COLORS.green.rgb,
      text: "Connected",
    },
    [STATUS.CONNECTING]: {
      icon: BsXLg,
      color: COLORS.yellow.rgb,
      text: "Not ready",
    },
    [STATUS.DISCONNECTED]: {
      icon: <BsXLg />,
      color: COLORS.rose.rgb,
      text: "Disconnected",
    },
  };

  return (
    <>
      {size === "full" && (
        <Tooltip
          opened={status === STATUS.CONNECTING}
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
          <Paper
            style={{ backgroundColor: statusObj[status].color }}
            className={clsx("text-neutral-900")}
            shadow="xs"
            p="xs"
            withBorder
          >
            <Group>
              <Text size="md" weight="bold">
                {statusObj[status].text}
              </Text>
            </Group>
          </Paper>
        </Tooltip>
      )}
      {size === "sm" && (
        <Paper
          style={{ backgroundColor: statusObj[status].color }}
          className={clsx("text-neutral-900")}
          shadow="xs"
          p="xs"
          withBorder
        >
          {statusObj[status].icon}
        </Paper>
      )}
    </>
  );
};
