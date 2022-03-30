import { usePubSub, STATUS } from "hooks/usePubSub";
import { useRouter } from "next/router";
import { Group, Text, ActionIcon, Tooltip, Box, Paper } from "@mantine/core";
import {
  BsClipboard,
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
        <Group>
          <Paper shadow="xs" p="xs" withBorder>
            <Text size="lg">
              <span className="font-bold">{`Room ID: `}</span>
              {roomId}
            </Text>
          </Paper>

          <Tooltip label="Click to copy URL">
            <Button
              leftIcon={<BsClipboard />}
              color="dark"
              variant="filled"
              onClick={() => clipboard.copy(window.location.href)}
            >
              Copy URL
            </Button>
          </Tooltip>
        </Group>
      </Group>
      <Button
        onClick={() => router.push("/")}
        leftIcon={<BsArrowLeft />}
        className="w-fit"
      >{`Back`}</Button>
    </Group>
  );
};
