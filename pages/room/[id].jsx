import { useState, useEffect, createContext, useContext } from "react";
import { Layout } from "components";
import { useRouter } from "next/router";
import { BsPause, BsPlay, BsStop } from "react-icons/bs";
import { format } from "date-fns";

import { usePubSub, STATUS } from "hooks/usePubSub";
import {
  useTimerInSeconds,
  EVENTS as TIMER_EVENTS,
} from "hooks/useTimerInSeconds";
import { Group, Text, NumberInput, ActionIcon, Tooltip } from "@mantine/core";
import { Cards, Button } from "components";

const RoomContext = createContext();

export default function Room() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <Layout>
      <Header roomId={id} />
      <Timer roomId={id} />
      <Cards roomId={id} />
    </Layout>
  );
}

const Header = ({ roomId }) => {
  const { status } = usePubSub();
  const router = useRouter();
  return (
    <Group position="apart" my="lg">
      <Group direction="column">
        <Text size="lg">
          <span className="font-bold">{`Room ID: `}</span>
          {roomId}
        </Text>
        <Text size="lg">
          <span className="font-bold">{`Connection: `}</span>
          {status === STATUS.CONNECTED && `✅`}
          {status === STATUS.CONNECTING && `🔄`}
          {status === STATUS.DISCONNECTED && `❌`}
        </Text>
      </Group>
      <Button
        onClick={() => router.push("/")}
        className="w-fit"
      >{`Back`}</Button>
    </Group>
  );
};

const MODE = {
  EDIT: "edit",
  VIEW: "view",
};
const Timer = ({ roomId }) => {
  const {
    seconds,
    setSeconds,
    play,
    pause,
    stop,
    state,
    handleSubscriptionUpdate: handleTimerSubscriptionUpdate,
    event,
    setEvent,
  } = useTimerInSeconds();

  const { status, publish, subscribe, history } = usePubSub();

  const [secondsToSet, setSecondsToSet] = useState(seconds % 60);
  const [minutesToSet, setMinutesToSet] = useState(Math.floor(seconds / 60));
  const getSeconds = ({ seconds, minutes }) => minutes * 60 + seconds;
  const [mode, setMode] = useState(MODE.VIEW);

  const roomEventSubscription = () => {
    subscribe(`room:${roomId}`, (event) => {
      if (TIMER_EVENTS.includes(event.name)) {
        handleTimerSubscriptionUpdate(event.data);
      }
    });
  };

  useEffect(() => {
    if (status === STATUS.CONNECTED) {
      roomEventSubscription();
      history(`room:${roomId}`, (err, messagePage) => {
        const event = messagePage.items[0];
        if (TIMER_EVENTS.includes(event.name)) {
          handleTimerSubscriptionUpdate(event.data);
        }
      });
    }
  }, [status]);

  useEffect(() => {
    console.log({ event, roomId });
    if (event?.state === "ready" && Boolean(roomId)) {
      publish(`room:${roomId}`, event);
      setEvent({ state: "idle" });
    }
  }, [event?.state, roomId]);

  return (
    <Group position="center" direction="column" my="lg">
      {mode === MODE.EDIT && (
        <Group position="center">
          <Button
            color="red"
            onClick={() => setMode(MODE.VIEW)}
          >{`Cancel`}</Button>
          <NumberInput
            value={minutesToSet}
            onChange={(minutes) => setMinutesToSet(minutes)}
            max={59}
            min={0}
            step={1}
            classNames={{
              wrapper: "w-24",
              input: "w-24 text-center",
              unstyledVariant: "text-7xl font-bold  h-fit w-fit",
            }}
            variant="unstyled"
            weight="bold"
          />
          <Text className="text-4xl font-bold">{`m`}</Text>
          <NumberInput
            value={secondsToSet}
            onChange={(second) => setSecondsToSet(second)}
            max={59}
            min={0}
            step={1}
            classNames={{
              wrapper: "w-24",
              input: "w-24 text-center",
              unstyledVariant: "text-7xl font-bold  h-fit w-fit",
            }}
            variant="unstyled"
            weight="bold"
          />
          <Text className="text-4xl font-bold">{`s`}</Text>
          <Button
            onClick={() => {
              setSeconds(
                getSeconds({ seconds: secondsToSet, minutes: minutesToSet })
              );
              setMode(MODE.VIEW);
            }}
          >{`Set`}</Button>
        </Group>
      )}
      {mode === MODE.VIEW && (
        <Tooltip label="Click to set timer">
          <Text
            className="cursor-pointer text-7xl"
            weight="bold"
            onClick={() => setMode(MODE.EDIT)}
          >
            {format(seconds * 1000, "mm:ss")}
          </Text>
        </Tooltip>
      )}
      <Group>
        <Tooltip label="Play">
          <ActionIcon variant="filled" color="dark" onClick={() => play()}>
            <BsPlay />
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Pause">
          <ActionIcon variant="filled" color="dark" onClick={() => pause()}>
            <BsPause />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Stop (clears timer)">
          <ActionIcon variant="filled" color="dark" onClick={() => stop()}>
            <BsStop />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  );
};
