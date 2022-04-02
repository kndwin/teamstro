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
  Like: {
    metadata: {
      color: "skyblue",
      emoji: "👍",
      label: "Like",
    },
    data: [{ id: "like1", payload: { description: "like 1" } }],
  },
  Love: {
    metadata: {
      color: "rose",
      emoji: "💖",
      label: "Love",
    },
    data: [{ id: "love1", payload: { description: "love 1" } }],
  },
};

const useStore = create((set) => ({
  items: defaultItems,
  setItems: function (fn) {
    set(function (state) {
      return { ...state, items: fn(state.items) };
    });
  },
  activeItem: null,
  container: Object.keys(defaultItems),
  setContainer: function (fn) {
    set(function (state) {
      return { ...state, container: fn(state.container) };
    });
  },
  setActiveItem: (activeItem) => set((state) => ({ ...state, activeItem })),
  event: null,
  setEvent: (event) => set((state) => ({ ...state, event })),
}));

export function useCards() {
  const {
    items,
    setItems,
    container,
    setContainer,
    activeItem,
    setActiveItem,
    event,
    setEvent,
  } = useStore();

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
    // if id is a container, return id
    if (id in items) {
      return id;
    }

    // if if is an item within container, find item and return
    return Object.keys(items).find((type) => {
      const { data } = items[type];
      const container = data.find((key) =>
        data.some(({ id: itemId }) => itemId == id)
      );
      return container?.id;
    });
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

    const activeIndex = items[activeContainer].data.findIndex(
      (item) => item.id === active.id
    );
    const overIndex = items[overContainer].data.findIndex(
      (item) => item.id === over.id
    );

    if (activeIndex !== overIndex) {
      const newItems = {
        ...items,
        [overContainer]: {
          metadata: items[overContainer].metadata,
          data: arrayMove(items[overContainer].data, activeIndex, overIndex),
        },
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
    const id = event.active.id;
    // if handle is grabbing container, set container as active
    if (id in items) {
      const activeContainer = { id, ...items[id] };
      setActiveItem(activeContainer);
    }
    // else handle is grabbing item in container, set item id as active
    else {
      const activeContainer = findContainer(id);
      const activeItemToSet = items[activeContainer]?.data?.find(
        (item) => item.id === event.active.id
      );
      setActiveItem(activeItemToSet);
    }
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

    if (container.includes(active.id) && container.includes(over.id)) {
      const activeIndex = container.findIndex((id) => id === active.id);
      const overIndex = container.findIndex((id) => id === over.id);
      setContainer((prevContainer) =>
        arrayMove(container, activeIndex, overIndex)
      );
      return;
    }

    setActiveItem(null);

    const activeItems = items[activeContainer]?.data;
    const overItems = items[overContainer]?.data;
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
      [activeContainer]: {
        metadata: items[activeContainer].metadata,
        data: [
          ...items[activeContainer].data.filter(
            (item) => item.id !== active.id
          ),
        ],
      },
      [overContainer]: {
        metadata: items[overContainer].metadata,
        data: [
          ...items[overContainer].data.slice(0, newIndex),
          items[activeContainer].data[activeIndex],
          ...items[overContainer].data.slice(
            newIndex,
            items[overContainer].data.length
          ),
        ],
      },
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
      newItems[type].data = items[type].data.filter(({ id }) => id !== itemId);

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
    const itemIndex = items[type].data.findIndex(({ id }) => id === item.id);
    const newItems = { ...items };
    newItems[type].data[itemIndex] = item;
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
      [type]: {
        metadata: items[type].metadata,
        data: [...items[type].data, item],
      },
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

  const handleAddContainer = (container) => {
    const newItems = {
      ...items,
      [container?.id]: {
        metadata: [container?.metadata],
        data: [...container?.data],
      },
    };
    setEvent({
      state: "ready",
      name: "add_container",
      data: { items: newItems },
    });
    setItems((prevItems) => newItems);
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
    handleAddContainer,
    container,
    items,
    activeItem,
    sensors,
    collisionDetectionStrategy,
    event,
    setEvent,
  };
}
