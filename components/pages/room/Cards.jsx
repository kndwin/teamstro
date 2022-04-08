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
import { STATUS } from "hooks/usePubSub.js";
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
    history,
    usersInChannel,
    setUsersInChannel,
    presence,
  } = usePubSub();
  const { sm } = useBreakpoint();

  const {
    sensors,
    handleDragEnd,
    handleDragStart,
    handleDragOver,
    handleSubscriptionUpdate,
    items,
    activeItem,
    collisionDetectionStrategy,
    event,
    setEvent,
    containers,
  } = useCards();

  useEffect(() => {
    if (event?.state === "ready" && Boolean(roomId)) {
      console.log({ event });
      publish(`room:${roomId}`, event);
      setEvent({ state: "idle" });
    }
  }, [event?.state, roomId]);

  const roomEventSubscription = () => {
    subscribe(`room:${roomId}`, (event) => {
      handleSubscriptionUpdate({ type: event.name, payload: event.data });
    });
  };

  // TODO: implement leader / follower and grab from leader instead
  const updateLatestState = (events) => {
    console.log({ events });
    const lastCardAndContainerEvent = events.find(({ name }) =>
      CARD_AND_CONTAINER_EVENT.includes(name)
    );

    const lastCardAndContainerEventIndex = events.findIndex(({ name }) =>
      CARD_AND_CONTAINER_EVENT.includes(name)
    );

    const lastContainerEvent = events.find(({ name }) =>
      CONTAINER_EVENT.includes(name)
    );

    const lastCardEvent = events.find(({ name }) => CARD_EVENT.includes(name));

    const lastCardEventIndex = events.findIndex(({ name }) =>
      CARD_EVENT.includes(name)
    );

    if (
      lastCardAndContainerEvent &&
      lastCardAndContainerEventIndex < lastCardEventIndex
    ) {
      handleSubscriptionUpdate({
        type: lastContainerEvent.name,
        payload: lastContainerEvent.data,
      });
    } else {
      if (lastContainerEvent) {
        handleSubscriptionUpdate({
          type: lastContainerEvent.name,
          payload: lastContainerEvent.data,
        });
      }
      if (lastCardEvent) {
        handleSubscriptionUpdate({
          type: lastCardEvent.name,
          payload: lastCardEvent.data,
        });
      }
    }
  };

  useEffect(() => {
    if (status === STATUS.CONNECTED) {
      roomEventSubscription();
      history(`room:${roomId}`, (err, messagePage) => {
        console.log({ messagePage });
        updateLatestState(messagePage.items);
      });
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
