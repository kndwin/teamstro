import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { Grid, Tabs } from "@mantine/core";

import { usePubSub, STATUS } from "hooks/usePubSub.js";
import { useCards, EVENTS as CARD_EVENTS } from "hooks/useCards";
import { useBreakpoint } from "hooks";
import { Container, TYPE } from "./Container";
import { SortableItem } from "./SortableItem";

export function Cards() {
  const router = useRouter();
  const { id: roomId } = router.query;
  const { subscribe, publish, status, history, presence } = usePubSub();
  const { md } = useBreakpoint();

  const {
    sensors,
    handleDragEnd,
    handleDragStart,
    handleDragOver,
    handleSubscriptionUpdate: handleCardSubscriptionUpdate,
    items,
    activeItem,
    collisionDetectionStrategy,
    event,
    setEvent,
    container,
  } = useCards();

  useEffect(() => {
    if (event?.state === "ready" && Boolean(roomId)) {
      publish(`room:${roomId}`, event);
      setEvent({ state: "idle" });
    }
  }, [event?.state, roomId]);

  const roomEventSubscription = () => {
    subscribe(`room:${roomId}`, (event) => {
      if (CARD_EVENTS.includes(event.name)) {
        handleCardSubscriptionUpdate(event.data.items);
      }
    });
  };

  useEffect(() => {
    if (status === STATUS.CONNECTED) {
      roomEventSubscription();
      presence(`room:${roomId}`, (err, presencePage) => {
        console.log({ presencePage });
      });
      history(`room:${roomId}`, (err, messagePage) => {
        const event = messagePage.items[0];
        if (CARD_EVENTS.includes(event.name)) {
          handleCardSubscriptionUpdate(event.data.items);
        }
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
      {md ? (
        <Grid className="mt-4">
          {container?.map((type) => {
            const { data, metadata } = items[type];
            return (
              <Grid.Col key={type} span={4}>
                <Container id={type} items={data} metadata={metadata} />
              </Grid.Col>
            );
          })}
        </Grid>
      ) : (
        <Tabs color="dark">
          {container?.map((type) => {
            const { data, metadata } = items[type];
            return (
              <Tabs.Tab icon={metadata?.emoji} key={type} label={`${type}`}>
                <Container
                  id={type}
                  items={data}
                  metadata={metadata}
                  disableTitle
                />
              </Tabs.Tab>
            );
          })}
        </Tabs>
      )}
      <DragOverlay>
        {activeItem
          ? container.includes(activeItem.id)
            ? renderContainerDragOverlay(activeItem)
            : renderSortableItemDragOverlay(activeItem)
          : null}
      </DragOverlay>
    </DndContext>
  );
}
