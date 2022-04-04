import clsx from "clsx";
import { useState, useEffect } from "react";
import { BsPause, BsPlay, BsStop } from "react-icons/bs";
import { format } from "date-fns";

import { STATUS } from "hooks/usePubSub";
import { EVENTS as TIMER_EVENTS } from "hooks/useTimerInSeconds";
import { useBrowserNotification, useTimerInSeconds, usePubSub } from "hooks";
import {
  Group,
  Text,
  NumberInput,
  ActionIcon,
  Tooltip,
  useMantineColorScheme,
} from "@mantine/core";
import { Button, Confetti } from "components";

const MODE = {
  EDIT: "edit",
  VIEW: "view",
};

export const Timer = ({ roomId }) => {
  const {
    seconds,
    setSeconds,
    play,
    pause,
    stop,
    handleSubscriptionUpdate: handleTimerSubscriptionUpdate,
    event,
    setEvent,
    isCountingComplete,
    setIsCountingComplete,
  } = useTimerInSeconds();

  const { permission, setNotification } = useBrowserNotification();

  const { colorScheme } = useMantineColorScheme();

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
    if (event?.state === "ready" && Boolean(roomId)) {
      publish(`room:${roomId}`, event);
      setEvent({ state: "idle" });
    }
  }, [event?.state, roomId]);

  useEffect(() => {
    if (mode === MODE.EDIT) {
      setSecondsToSet(seconds % 60);
      setMinutesToSet(Math.floor(seconds / 60));
    }
  }, [mode]);

  useEffect(() => {
    if (isCountingComplete && permission === "granted") {
      setNotification({
        title: "Teamstro countdown complete!",
        body: "The timer countdown has completed",
      });
    }
  }, [isCountingComplete]);

  return (
    <>
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
                input: clsx(
                  "w-24 text-center",
                  colorScheme === "dark" ? "text-white" : "text-black"
                ),
                unstyledVariant: "text-7xl font-bold  h-fit w-fit",
              }}
              variant="unstyled"
              weight="bold"
            />
            <Text
              className={clsx(
                "text-4xl font-bold",
                colorScheme === "dark" ? "text-white" : "text-black"
              )}
            >{`m`}</Text>
            <NumberInput
              value={secondsToSet}
              onChange={(second) => setSecondsToSet(second)}
              max={59}
              min={0}
              step={1}
              classNames={{
                wrapper: "w-24",
                input: clsx(
                  "w-24 text-center",
                  colorScheme === "dark" ? "text-white" : "text-black"
                ),
                unstyledVariant: "text-7xl font-bold  h-fit w-fit",
              }}
              variant="unstyled"
              weight="bold"
            />
            <Text
              className={clsx(
                "text-4xl font-bold",
                colorScheme === "dark" ? "text-white" : "text-black"
              )}
            >{`s`}</Text>
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
              className={clsx(
                "cursor-pointer text-7xl",
                colorScheme === "dark" ? "text-white" : "text-black"
              )}
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
      {isCountingComplete && (
        <Confetti onConfettiComplete={() => setIsCountingComplete(false)} />
      )}
    </>
  );
};
