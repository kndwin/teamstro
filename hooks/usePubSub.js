import create from "zustand";
import { useEffect, useState } from "react";
import * as Ably from "ably";

export const client = new Ably.Realtime(
  "X7YUvw.JnUFfw:fuT085pEFQ2SH6OJWztf_40-3ImfJQ54a2vVwb3GaAA"
);

export const STATUS = {
  CONNECTED: "connected",
  CONNECTING: "connecting",
  DISCONNECTED: "disconnected",
};

const useStore = create((set) => ({
  status: STATUS.DISCONNECTED,
  setStatus: (status) => set((state) => ({ ...state, status })),
  channelsSubscribed: [],
  setChannelsSubscribed: (channels) =>
    set((state) => ({ ...state, channelsSubscribed: channels })),
}));

export function usePubSub() {
  const { status, setStatus, channelsSubscribed, setChannelsSubscribed } =
    useStore();

  const publish = (channelName, message) => {
    client.channels.get(channelName).publish(message);
  };

  const subscribe = (channelName, callback) => {
    setChannelsSubscribed((prevChannels) => [
      ...new Set(...prevChannels, channelName),
    ]);
    const channel = client.channels.get(channelName);
    channel.subscribe(callback);
  };

  const connect = () => {
    setStatus(STATUS.CONNECTING);
    client.connection.on("connected", () => {
      setStatus(STATUS.CONNECTED);
    });
  };

  const disconnect = () => {
    channelsSubscribed.forEach((channel) => {
      client.channels.get(channel).unsubscribe();
    });
    client.connection.close();
    setStatus(STATUS.DISCONNECTED);
  };

  return { publish, subscribe, status, connect, disconnect };
}
