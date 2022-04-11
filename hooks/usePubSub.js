import create from "zustand";
import * as Ably from "ably";
import { nanoid } from "nanoid";

export const clientId = nanoid()

export const client = new Ably.Realtime({
  key: process.env.NEXT_PUBLIC_ABLY_API_KEY,
  clientId,
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

export const useStore = create((set) => ({
  status: STATUS.DISCONNECTED,
  setStatus: (status) => set((state) => ({ ...state, status })),
  channelsSubscribed: [],
  setChannelsSubscribed: (channels) =>
    set((state) => ({ ...state, channelsSubscribed: channels })),
  usersInChannel: [],
  setUsersInChannel: function (fn) {
    set(function (state) {
      return { ...state, usersInChannel: fn(state.usersInChannel) };
    });
  },
}));

export function usePubSub() {
  const {
    status,
    setStatus,
    channelsSubscribed,
    setChannelsSubscribed,
    usersInChannel,
    setUsersInChannel,
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
      channel.presence.enter(client.options.clientId);
      channel.presence.update({ isLeader: !isLeaderElected });
      const usersToSet = [
        ...presences?.map(({ clientId, data }) => ({
          clientId,
          isLeader: data.isLeader,
        })),
        { clientId: client.options.clientId, isLeader: !isLeaderElected },
      ];
      setUsersInChannel((prevUsers) => usersToSet);
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

  const presenceSubscribe = (channelName, action, callback) => {
    const channel = client.channels.get(channelName);
    channel.presence.subscribe(action, callback);
  };

	const presenceUpdate = (channelName, data) => {
		const channel = client.channels.get(channelName);
		channel.presence.update(data);
	 };

  return {
    publish,
    subscribe,
    status,
    connect,
    disconnect,
    history,
    presence,
    presenceSubscribe,
		presenceUpdate,
    usersInChannel,
    setUsersInChannel,
  };
}
