import { useEffect } from "react";
import { usePubSub, STATUS } from "hooks/usePubSub";
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

import { Button } from "components";

export const Header = ({ roomId }) => {
  const { status } = usePubSub();
  const clipboard = useClipboard({ timeout: 500 });
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <Group position="apart" my="lg" align="baseline">
      <Group>
        <Paper shadow="xs" p="xs" withBorder>
          <Group>
            <Text size="lg">
              <span className="font-bold">{`Connection: `}</span>
            </Text>
            {status === STATUS.CONNECTED && <BsCheckSquareFill />}
            {status === STATUS.CONNECTING && <BsArrowClockwise />}
            {status === STATUS.DISCONNECTED && <BsXLg />}
          </Group>
        </Paper>
        <Tooltip label="Click to copy URL" position="right">
          <Paper
            onClick={() => clipboard.copy(window.location.href)}
            shadow="xs"
            p="xs"
            withBorder
            className="cursor-pointer"
          >
            <Text size="lg">
              <span className="font-bold">{`Room ID: `}</span>
              {roomId}
            </Text>
          </Paper>
        </Tooltip>
      </Group>
      <Group>
        <BsSunFill />
        <Switch
          checked={colorScheme === "dark"}
          onChange={() => toggleColorScheme()}
          classNames="cursor-pointer"
          size="lg"
          color="dark"
        />
        <BsMoonFill />
        <Button
          onClick={() => router.push("/")}
          leftIcon={<BsArrowLeft />}
          className="w-fit"
        >{`Back`}</Button>
      </Group>
    </Group>
  );
};
