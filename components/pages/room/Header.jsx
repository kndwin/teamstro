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
  BsClipboard,
} from "react-icons/bs";
import { useClipboard } from "@mantine/hooks";

import { COLORS } from "styles/colors";
import { useCards, usePubSub } from "hooks";
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
    <Group direction="column">
      <CopyRoomId />
      <CopyTableToClipboard />
    </Group>
  );
};

const CopyRoomId = () => {
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
      <Button
        leftIcon={<BsClipboard />}
        className={colorScheme === "dark" ? "bg-neutral-900" : "bg-neutral-800"}
        onClick={() => handleClick()}
      >
        {`Copy URL`}
      </Button>
    </Tooltip>
  );
};

const CopyTableToClipboard = () => {
  const { items } = useCards();
  const table = `<table></table>`;
  const headerValues = Object.entries(items).map(
    ([key, value]) => value.metadata.label
  );

  const bodyValues = Object.entries(items).map(([key, value]) =>
    value.data.map(({ payload }) => payload.description)
  );
  const max = Math.max(...bodyValues.map((row) => row.length));
  const fillWithZero = bodyValues.map((row) =>
    row.concat(Array(max - (row.length - 1)).fill(""))
  );
  const transpose = (m) => m[0].map((x, i) => m.map((x) => x[i]));
  const transposedBody = transpose(fillWithZero).filter((row) =>
    row.some(Boolean)
  );

  const htmlTable =
    "<table>" +
    "<thead><tr>" +
    headerValues.map((header) => `<th align="left">${header}</th>`).join("") +
    "</tr></thead>" +
    "<tbody>" +
    transposedBody
      .map((row) => `<tr>${row.map((col) => `<th>${col}</th>`).join("")}</tr>`)
      .join("") +
    "</tbody>" +
    "</table>";

  console.log({
    items,
    max,
    bodyValues,
    transposedBody,
    htmlTable,
  });

  const clipboard = useClipboard({ timeout: 500 });
  const { colorScheme } = useMantineColorScheme();
  const [clicked, setClicked] = useState(false);
  const handleClick = () => {
    setClicked(true);
    setInterval(() => {
      setClicked(false);
    }, 1000);
    clipboard.copy(htmlTable);
  };

  return (
    <Tooltip opened={clicked} label="Copied" position="right">
      <Button
        onClick={() => handleClick()}
        leftIcon={<BsClipboard />}
        className={colorScheme === "dark" ? "bg-neutral-900" : "bg-neutral-800"}
      >
        {`Copy as table`}
      </Button>
    </Tooltip>
  );
};
