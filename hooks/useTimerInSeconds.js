import create from "zustand";
import { useState, useEffect } from "react";
import { format } from "date-fns";

const defaultTimerInSeconds = 300;

export const STATE = {
  PAUSED: "paused",
  PLAY: "play",
  STOPPED: "stopped",
};

export const EVENTS = ["play_timer", "pause_timer", "stop_timer"];

const useStore = create((set) => ({
  seconds: defaultTimerInSeconds,
  setSeconds: (seconds) => set((state) => ({ ...state, seconds })),
  state: STATE.PAUSED,
  setState: (state) => set((storeState) => ({ ...storeState, state })),
  event: null,
  setEvent: (event) => set((state) => ({ ...state, event })),
}));

export const useTimerInSeconds = () => {
  const { seconds, state, setSeconds, setState, event, setEvent } = useStore();

  const play = () => {
    setState(STATE.PLAY);
    setEvent({
      state: "ready",
      name: "play_timer",
      data: {
        seconds,
        state: STATE.PLAY,
      },
    });
  };

  const pause = () => {
    setState(STATE.PAUSED);
    setEvent({
      state: "ready",
      name: "pause_timer",
      data: {
        seconds,
        state: STATE.PAUSED,
      },
    });
  };

  const stop = () => {
    setSeconds(0);
    setState(STATE.STOPPED);
    setEvent({
      state: "ready",
      name: "stop_timer",
      data: {
        seconds: 0,
        state: STATE.STOPPED,
      },
    });
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (![STATE.PAUSED, STATE.STOPPED].includes(state) && seconds > 0) {
        setSeconds(seconds - 1);
      }
    }, 1000);
    return () => clearInterval(intervalId);
  });

  const handleSubscriptionUpdate = ({ state, seconds }) => {
    if (Boolean(seconds)) {
      setSeconds(seconds);
    }
    if (state === STATE.STOPPED) {
      setSeconds(0);
    }
    setState(state);
  };

  return {
    seconds,
    setSeconds,
    state,
    play,
    pause,
    stop,
    handleSubscriptionUpdate,
    event,
    setEvent,
  };
};
