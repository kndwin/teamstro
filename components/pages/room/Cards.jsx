import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { Grid } from "@mantine/core";

import { usePubSub, client, STATUS } from "hooks/usePubSub.js";
import { useCards } from "hooks";
import { Container, TYPE } from "./Container";
import { SortableItem } from "./SortableItem";

export function Cards() {
  const router = useRouter();
  const { id: roomId } = router.query;
  const { subscribe, publish, status } = usePubSub();
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
  } = useCards();

  useEffect(() => {
    if (event?.state === "ready" && Boolean(roomId)) {
      publish(`room:${roomId}`, event);
      setEvent({
        state: "idle",
      });
    }
  }, [event?.state, roomId]);

  const roomEventSubscription = () => {
    subscribe(`room:${roomId}`, (event) => {
      console.log({ event });
      handleSubscriptionUpdate(event.data.items);
    });
  };

  useEffect(() => {
    status === STATUS.CONNECTED && roomEventSubscription();
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
