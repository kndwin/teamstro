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
  const { status } = usePubSub();
  const clipboard = useClipboard({ timeout: 500 });
  const { colorScheme } = useMantineColorScheme();
  const { sm } = useBreakpoint();

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
    <Group position="apart" my="lg" align="baseline" px="lg">
      {sm ? (
        <>
          <Group>
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
                  <Text size="lg" weight="bold">
                    {statusObj[status].text}
                  </Text>
                </Group>
              </Paper>
            </Tooltip>
            <Tooltip label="Click to copy URL" position="right">
              <Paper
                onClick={() => clipboard.copy(window.location.href)}
                shadow="xs"
                p="xs"
                withBorder
                className={clsx(
                  colorScheme === "dark"
                    ? "text-neutral-100"
                    : "text-neutral-900",
                  "cursor-pointer"
                )}
              >
                <Text size="lg">
                  <span className="font-bold">{`Room ID: `}</span>
                  {roomId}
                </Text>
              </Paper>
            </Tooltip>
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
          <Paper
            style={{ backgroundColor: statusObj[status].color }}
            className={clsx("text-neutral-900")}
            shadow="xs"
            p="xs"
            withBorder
          >
            {statusObj[status].icon}
          </Paper>
          <Tooltip label="Click to copy URL" position="right">
            <Paper
              onClick={() => clipboard.copy(window.location.href)}
              shadow="xs"
              withBorder
              className="cursor-pointer"
              p="xs"
            >
              <Text size="sm">{roomId}</Text>
            </Paper>
          </Tooltip>
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
