import { useRouter } from "next/router";
import { useRef, useEffect, useCallback } from "react";
import create from "zustand";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import isEqual from "lodash.isequal";

const TRASH_ID = "void";

export const EVENTS = [
  "move_items_within_container",
  "move_items_over_container",
  "remove_item",
  "edit_item",
  "add_item",
];

export const defaultItems = {
  Like: [],
  Learn: [],
  Lack: [],
};

const useStore = create((set) => ({
  items: defaultItems,
  setItems: function (fn) {
    set(function (state) {
      return { ...state, items: fn(state.items) };
    });
  },
  activeItem: null,
  setActiveItem: (activeItem) => set((state) => ({ ...state, activeItem })),
  event: null,
  setEvent: (event) => set((state) => ({ ...state, event })),
}));

export function useCards() {
  const { items, setItems, activeItem, setActiveItem, event, setEvent } =
    useStore();

  const recentlyMovedToNewContainer = useRef(false);
  const lastOverId = useRef(null);

  const collisionDetectionStrategy = useCallback(
    (args) => {
      if (activeItem && activeItem in items) {
        return closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter(
            (container) => container.id in items
          ),
        });
      }

      // Start by finding any intersecting droppable
      const pointerIntersections = pointerWithin(args);
      const intersections =
        pointerIntersections.length > 0
          ? // If there are droppables intersecting with the pointer, return those
            pointerIntersections
          : rectIntersection(args);
      let overId = getFirstCollision(intersections, "id");

      if (overId != null) {
        if (overId === TRASH_ID) {
          // If the intersecting droppable is the trash, return early
          // Remove this if you're not using trashable functionality in your app
          return intersections;
        }

        if (overId in items) {
          const containerItems = items[overId];

          // If a container is matched and it contains items (columns 'A', 'B', 'C')
          if (containerItems.length > 0) {
            // Return the closest droppable within that container
            overId = closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter(
                (container) =>
                  container.id !== overId &&
                  containerItems.includes(container.id)
              ),
            })[0]?.id;
          }
        }

        lastOverId.current = overId;

        return [{ id: overId }];
      }

      // When a draggable item moves to a new container, the layout may shift
      // and the `overId` may become `null`. We manually set the cached `lastOverId`
      // to the id of the draggable item that was moved to the new container, otherwise
      // the previous `overId` will be returned which can cause items to incorrectly shift positions
      if (recentlyMovedToNewContainer.current) {
        lastOverId.current = activeItem;
      }

      // If no droppable is matched, return the last match
      return lastOverId.current ? [{ id: lastOverId.current }] : [];
    },
    [activeItem, items]
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findContainer = (id) => {
    if (id in items) {
      return id;
    }
    return Object.keys(items).find((key) =>
      items[key].some(({ id: itemId }) => itemId == id)
    );
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    const activeContainer = findContainer(active?.id);
    const overContainer = findContainer(over?.id);
    if (
      !activeContainer ||
      !overContainer ||
      activeContainer !== overContainer
    ) {
      return;
    }

    const activeIndex = items[activeContainer].findIndex(
      (item) => item.id === active.id
    );
    const overIndex = items[overContainer].findIndex(
      (item) => item.id === over.id
    );

    if (activeIndex !== overIndex) {
      const newItems = {
        ...items,
        [overContainer]: arrayMove(
          items[overContainer],
          activeIndex,
          overIndex
        ),
      };
      setEvent({
        state: "ready",
        name: "move_items_within_container",
        data: { items: newItems },
      });
      setItems((items) => newItems);
    }
    setActiveItem(null);
  };

  const handleDragStart = (event) => {
    const activeContainer = findContainer(event.active.id);
    setActiveItem(
      items[activeContainer].find((item) => item.id === event.active.id)
    );
  };

  const handleDragOver = (event) => {
    const { active, over, draggingRect } = event;
    const activeContainer = findContainer(active?.id);
    const overContainer = findContainer(over?.id);

    if (
      !activeContainer ||
      !overContainer ||
      activeContainer === overContainer
    ) {
      return;
    }

    setActiveItem(null);

    const activeItems = items[activeContainer];
    const overItems = items[overContainer];
    const activeIndex = activeItems.findIndex((item) => item.id === active.id);
    const overIndex = overItems.findIndex((item) => item.id === over.id);
    let newIndex;

    if (over.id in items) {
      newIndex = overItems.length + 1;
    } else {
      const isBelowLastItem =
        over &&
        overIndex === overItems.length - 1 &&
        draggingRect?.offsetTop > over.rect.offsetTop + over.rect.height;
      const modifier = isBelowLastItem ? 1 : 0;
      newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
    }
    const newItems = {
      ...items,
      [activeContainer]: [
        ...items[activeContainer].filter((item) => item.id !== active.id),
      ],
      [overContainer]: [
        ...items[overContainer].slice(0, newIndex),
        items[activeContainer][activeIndex],
        ...items[overContainer].slice(newIndex, items[overContainer].length),
      ],
    };

    setEvent({
      state: "ready",
      name: "move_items_over_container",
      data: { items: newItems },
    });

    setItems((prevItems) => newItems);
  };

  const handleRemoveItem = (type, itemId) => {
    try {
      const newItems = { ...items };
      newItems[type] = items[type].filter(({ id }) => id !== itemId);

      console.log({ newItems });

      setEvent({
        state: "ready",
        name: "remove_item",
        data: { items: newItems },
      });

      setItems((prevItems) => newItems);
    } catch (err) {
      console.log({ err });
    }
  };

  const handleEditItem = (type, item) => {
    const itemIndex = items[type].findIndex(({ id }) => id === item.id);
    const newItems = { ...items };
    newItems[type][itemIndex] = item;
    setEvent({
      state: "ready",
      name: "edit_item",
      data: { items: newItems },
    });
    setItems((prevItems) => newItems);
  };

  const handleAddItem = (type, item) => {
    const newItems = {
      ...items,
      [type]: [...items[type], item],
    };
    setEvent({
      state: "ready",
      name: "add_item",
      data: { items: newItems },
    });
    setItems((prevItems) => newItems);
  };

  const handleSubscriptionUpdate = (updatedItems) => {
    setItems((prevItems) => {
      const diff = !isEqual(prevItems, updatedItems);
      if (Boolean(diff)) {
        return updatedItems;
      } else {
        return prevItems;
      }
    });
  };

  return {
    findContainer,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleRemoveItem,
    handleEditItem,
    handleAddItem,
    handleSubscriptionUpdate,
    items,
    activeItem,
    sensors,
    collisionDetectionStrategy,
    event,
    setEvent,
  };
}
