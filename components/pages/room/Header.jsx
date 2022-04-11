import { useState, useEffect, createContext, useContext } from "react";
import clsx from "clsx";
import { STATUS } from "hooks/usePubSub";
import {
  Group,
  Text,
  Switch,
  Tooltip,
  Badge,
  useMantineColorScheme,
  ActionIcon,
  AvatarsGroup,
  Avatar,
} from "@mantine/core";
import {
  BsSunFill,
  BsMoonFill,
  BsCheckSquareFill,
  BsXLg,
  BsThreeDots,
  BsPeople,
} from "react-icons/bs";
import { useClipboard } from "@mantine/hooks";

import { COLORS } from "styles/colors";
import { usePubSub } from "hooks";
import { client } from "hooks/usePubSub";
import { Button, Popover } from "components";

const HeaderContext = createContext();

export const Header = ({ roomId }) => {
  return (
    <HeaderContext.Provider value={{ roomId }}>
      <Group position="apart" my="lg" align="baseline" px="lg">
        <Group>
          <Connection />
          <Options />
          <Avatars />
        </Group>
        <DarkModeSwitch />
      </Group>
    </HeaderContext.Provider>
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

const Options = () => {
  return (
    <Popover
      trigger={
        <ActionIcon variant="outline" color="gray" radius="xl">
          <BsThreeDots />
        </ActionIcon>
      }
    >
      <HeaderPopover />
    </Popover>
  );
};

const Avatars = () => {
  const { usersInChannel } = usePubSub();
  return (
    <Group>
      <Text>{client?.options?.clientId}</Text>
      <AvatarsGroup limit={1} total={usersInChannel?.length}>
        {usersInChannel?.length === 0 ? (
          <Avatar key={0} size="sm" radius="xl" />
        ) : (
          usersInChannel?.map(({ clientId }, index) => (
            <Avatar key={clientId} size="sm" radius="xl" />
          ))
        )}
      </AvatarsGroup>
    </Group>
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
  }, [status]);

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

const HeaderPopover = () => {
  return (
    <Group>
      <RoomId />
    </Group>
  );
};

const RoomId = () => {
  const { roomId } = useContext(HeaderContext);
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
      <Group direction="column">
        <Text
          className={
            colorScheme === "dark" ? "text-neutral-200" : "text-neutral-900"
          }
        >{`Click to copy URL`}</Text>
        <Button
          className={
            colorScheme === "dark" ? "bg-neutral-900" : "bg-neutral-800"
          }
          onClick={() => handleClick()}
        >
          <Text>{roomId}</Text>
        </Button>
      </Group>
    </Tooltip>
  );
};
