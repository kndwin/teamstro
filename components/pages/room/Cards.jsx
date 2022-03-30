import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { Grid } from "@mantine/core";

import { usePubSub, STATUS } from "hooks/usePubSub.js";
import { useCards, EVENTS as CARD_EVENTS } from "hooks/useCards";
import { Container, TYPE } from "./Container";
import { SortableItem } from "./SortableItem";

export function Cards() {
  const router = useRouter();
  const { id: roomId } = router.query;
  const { subscribe, publish, status, history, presence } = usePubSub();

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

  return (
    <DndContext
      id="cards-context"
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
    >
      <Grid>
        {["Like", "Learn", "Lack"].map((type) => (
          <Grid.Col key={type} span={4}>
            <Container id={type} items={items[type]} color={TYPE[type].color} />
          </Grid.Col>
        ))}
      </Grid>
      <DragOverlay>
        {activeItem ? (
          <SortableItem
            id={activeItem.id}
            type={activeItem.type}
            payload={activeItem.payload}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
