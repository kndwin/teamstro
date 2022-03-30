import create from "zustand";
import * as Ably from "ably";
import { nanoid } from "nanoid";

export const client = new Ably.Realtime({
  key: process.env.NEXT_PUBLIC_ABLY_API_KEY,
  clientId: nanoid(),
});

export const STATUS = {
  CONNECTED: "connected",
  CONNECTING: "connecting",
  DISCONNECTED: "disconnected",
};

export const TYPE = {
  LEADER: "leader",
  FOLLOWER: "follower",
};

const useStore = create((set) => ({
  type: null,
  setType: (type) => set((state) => ({ ...state, type })),
  status: STATUS.DISCONNECTED,
  setStatus: (status) => set((state) => ({ ...state, status })),
  channelsSubscribed: [],
  setChannelsSubscribed: (channels) =>
    set((state) => ({ ...state, channelsSubscribed: channels })),
}));

export function usePubSub() {
  const {
    status,
    setStatus,
    channelsSubscribed,
    setChannelsSubscribed,
    type,
    setType,
  } = useStore();

  const publish = (channelName, message) => {
    client.channels.get(channelName).publish(message);
  };

  const subscribe = (channelName, callback) => {
    setChannelsSubscribed((prevChannels) => [
      ...new Set(...prevChannels, channelName),
    ]);
    const channel = client.channels.get(channelName);
    channel.presence.get((err, presences) => {
      const isLeaderElected = Boolean(
        presences?.find(({ data: { isLeader } }) => isLeader == true)
      );
      channel.presence.enter(client.clientId);
      channel.presence.update({ isLeader: !isLeaderElected });
      setType(isLeaderElected ? TYPE.FOLLOWER : TYPE.FOLLOWER);
    });
    channel.subscribe(callback);
  };

  const connect = () => {
    setStatus(STATUS.CONNECTING);
    client.connection.on("connected", () => {
      setStatus(STATUS.CONNECTED);
    });
  };

  const disconnect = () => {
		console.log({ channelsSubscribed })
    channelsSubscribed?.forEach((channelName) => {
      const channel = client.channels.get(channelName);
      channel.leave(client.clientId);
      channel.unsubscribe();
    });
    client.connection.close();
    setStatus(STATUS.DISCONNECTED);
  };

  const history = (channelName, callback) => {
    return client.channels.get(channelName).history(callback);
  };

  const presence = (channelName, callback) => {
    const channel = client.channels.get(channelName);
    return channel.presence.get(callback);
  };

  return {
    publish,
    subscribe,
    status,
    connect,
    disconnect,
    history,
    presence,
    type,
  };
}
