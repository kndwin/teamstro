import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import {
  Group,
  Tabs,
  Box,
  TextInput,
  useMantineColorScheme,
} from "@mantine/core";

import { COLORS } from "styles/colors";
import { STATUS, clientId } from "hooks/usePubSub.js";
import { useBreakpoint, useCards, usePubSub } from "hooks";
import { Button, Popover, Text } from "components";
import { Container, ColorPalette } from "./Container";
import { SortableItem } from "./SortableItem";
import { nanoid } from "nanoid";

export function Cards() {
  const { colorScheme } = useMantineColorScheme();
  const router = useRouter();
  const { id: roomId } = router.query;
  const {
    subscribe,
    publish,
    status,
    setUsersInChannel,
    presenceSubscribe,
		presenceUpdate, 
		usersInChannel
  } = usePubSub();
  const { sm } = useBreakpoint();

  const {
    items,
    containers,
    sensors,
    handleDragEnd,
    handleDragStart,
    handleDragOver,
    handleSubscriptionUpdate,
    activeItem,
    collisionDetectionStrategy,
    event,
    setEvent,
  } = useCards();

  const channelName = `room:${roomId}`;

  useEffect(() => {
    if (event?.state === "ready" && Boolean(roomId)) {
      if (event.name === "new_user_joined") {
        event.data = { items, containers };
      }
      publish(channelName, event);
      setEvent({ state: "idle" });
    }
  }, [event?.state, roomId, containers, items]);

  const roomEventSubscription = () => {
    subscribe(channelName, (event) => {
      handleSubscriptionUpdate({ type: event.name, payload: event.data });
    });
  };


	useEffect(() => {
		console.log({ usersInChannel })
	}, [usersInChannel])

  const presenceSubscriptions = () => {
    presenceSubscribe(channelName, "enter", (presence) => {
      const newUser = {
        clientId: presence.clientId,
        isLeader: false,
      };

      setUsersInChannel((prevUsers) => {
        const doesNewUserExist = prevUsers.find(
          (user) => user.clientId === newUser.clientId
        );
				const isUserLeader = prevUsers.find((user) => 
					user.clientId === clientId && user.isLeader === true)
        if (Boolean(isUserLeader)) {
          setEvent({
            state: "ready",
            name: "new_user_joined",
          });
        }
        return Boolean(doesNewUserExist) ? prevUsers : [...prevUsers, newUser];
      });
    });
    presenceSubscribe(channelName, "leave", (presence) => {
			setUsersInChannel((prevUsers) => {
				const newUsers = prevUsers.filter(
					(user) => user.clientId !== presence.clientId
				);
				if (presence.data.isLeader) {
					newUsers.sort((a,b) => a.clientId - b.clientId);
					newUsers[0].isLeader = true;
					if (newUsers[0].clientId === clientId) {
						presenceUpdate(channelName, {
							clientId,
							isLeader: true,
						});
					}
				} 
				return newUsers;
			});
    });
  };

  useEffect(() => {
    if (status === STATUS.CONNECTED) {
      roomEventSubscription();
      presenceSubscriptions();
    }
  }, [status]);

  const renderContainerDragOverlay = (activeContainer) => {
    return (
      <Container
        id={activeContainer.id}
        items={activeContainer.data}
        metadata={activeContainer.metadata}
        disableTitle
      />
    );
  };

  const renderSortableItemDragOverlay = (activeItem) => {
    return <SortableItem id={activeItem.id} payload={activeItem.payload} />;
  };

  return (
    <DndContext
      id="cards-context"
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
    >
      {sm ? (
        <div className="p-4 mt-4 overflow-x-auto min-w-screen max-w-screen">
          <div className="flex items-start justify-center mx-auto w-fit gap-2">
            {containers?.map((containerId) => {
              return (
                <Box key={containerId} className="w-80">
                  <Container
                    id={containerId}
                    items={items[containerId]?.data}
                    metadata={items[containerId]?.metadata}
                  />
                </Box>
              );
            })}
            <AddContainerPopover />
          </div>
        </div>
      ) : (
        <Tabs className="px-4" color="dark">
          {containers?.map((containerId) => {
            return (
              <Tabs.Tab
                key={containerId}
                label={items[containerId]?.metadata?.label}
              >
                <Container
                  id={containerId}
                  items={items[containerId]?.data}
                  metadata={items[containerId]?.metadata}
                  disableHeader
                />
              </Tabs.Tab>
            );
          })}
        </Tabs>
      )}
      <DragOverlay>
        {activeItem
          ? containers.includes(activeItem.id)
            ? renderContainerDragOverlay(activeItem)
            : renderSortableItemDragOverlay(activeItem)
          : null}
      </DragOverlay>
    </DndContext>
  );
}

const AddContainerPopover = () => {
  const [label, setLabel] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [colorChecked, setColorChecked] = useState(Object.keys(COLORS)[0]);
  const { colorScheme } = useMantineColorScheme();
  const { handleAddContainer } = useCards();
  const handleAddNewContainer = () => {
    const id = nanoid();
    const newContainer = {
      [id]: {
        metadata: {
          id,
          color: colorChecked,
          label,
        },
        data: [],
      },
    };
    handleAddContainer({ containerId: id, container: newContainer });
    setColorChecked(Object.keys(COLORS)[0]);
    setLabel("");
    setPopoverOpen(false);
  };
  return (
    <Popover
      open={popoverOpen}
      setOpen={setPopoverOpen}
      trigger={<Button>{`Add Container`}</Button>}
    >
      <Group direction="column" grow>
        <TextInput
          placeholder="Container Name"
          value={label}
          onChange={(e) => setLabel(e.currentTarget.value)}
        />
        <ColorPalette
          colorChecked={colorChecked}
          setColorChecked={setColorChecked}
        />
        <Button
          onClick={() => handleAddNewContainer()}
          color={colorScheme === "dark" ? "gray" : "dark"}
        >{`Add Container`}</Button>
      </Group>
    </Popover>
  );
};
