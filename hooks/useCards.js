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

const CARD_EVENTS = [
  "move_items_within_container",
  "move_items_over_container",
  "edit_container_metadata",
  "remove_item",
  "edit_item",
  "add_item",
];
const CONTAINER_EVENT = ["move_container"];
const CARD_AND_CONTAINER_EVENT = ["add_container", "remove_container"];

export const defaultItems = {
  Like: {
    metadata: {
      id: "Like",
      color: "skyblue",
      label: "Like",
    },
    data: [],
  },
  Love: {
    metadata: {
      id: "Love",
      color: "rose",
      label: "Love",
    },
    data: [],
  },
  Lacked: {
    metadata: {
      id: "Lacked",
      color: "yellow",
      label: "Lacked",
    },
    data: [],
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
  containers: Object.keys(defaultItems),
  setContainers: function (fn) {
    set(function (state) {
      return { ...state, containers: fn(state.containers) };
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
    containers,
    setContainers,
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

    if (containers.includes(active.id) && containers.includes(over.id)) {
      const activeIndex = containers.findIndex((id) => id === active.id);
      const overIndex = containers.findIndex((id) => id === over.id);
      const newContainers = arrayMove(containers, activeIndex, overIndex);
      const areContainerDifferent = !isEqual(containers, newContainers);

      if (areContainerDifferent) {
        setEvent({
          state: "ready",
          name: "move_container",
          data: { containers: newContainers },
        });
        setContainers((prevContainers) => newContainers);
      }
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

  const handleAddContainer = ({ container, containerId }) => {
    const newItems = {
      ...items,
      ...container,
    };
    const newContainers = [...containers, containerId];
    setEvent({
      state: "ready",
      name: "add_container",
      data: { items: newItems, containers: newContainers },
    });

    setItems((prevItems) => newItems);
    setContainers((prevContainer) => newContainers);
  };

  const handleEditContainerMetadata = ({ containerId, metadata }) => {
    const newItems = {
      ...items,
      [containerId]: {
        metadata: { ...metadata },
        data: items[containerId].data,
      },
    };
    const areItemsDifferent = !isEqual(items, newItems);
    if (areItemsDifferent) {
      setEvent({
        state: "ready",
        name: "edit_container_metadata",
        data: { items: newItems },
      });
      setItems((prevItems) => newItems);
    }
  };

  const handleRemoveContainer = ({ containerId }) => {
    const newItems = { ...items };
    delete newItems[containerId];
    const newContainers = containers.filter((id) => id !== containerId);
    setEvent({
      state: "ready",
      name: "remove_container",
      data: { items: newItems, containers: newContainers },
    });
    setItems((prevItems) => newItems);
    setContainers((prevContainers) => newContainers);
  };

  const handleSubscriptionUpdate = ({ type, payload }) => {
    const isCardAndContainerEvent = CARD_AND_CONTAINER_EVENT.includes(type);
    console.log({
      type,
      payload,
      CARD_AND_CONTAINER_EVENT,
      isCardAndContainerEvent,
    });
    const newContainers = payload?.containers;
    const newItems = payload?.items;

    if (CARD_AND_CONTAINER_EVENT.includes(type)) {
      console.log({ type, newContainers, newItems });
      setItems((prevItems) => {
        return !isEqual(prevItems, newItems) ? newItems : prevItems;
      });
      setContainers((prevContainers) => {
        return !isEqual(prevContainers, newContainers)
          ? newContainers
          : prevContainers;
      });
    } else if (CARD_EVENTS.includes(type)) {
      setItems((prevItems) => {
        return !isEqual(prevItems, newItems) ? newItems : prevItems;
      });
    } else if (CONTAINER_EVENT.includes(type)) {
      setContainers((prevContainers) => {
        return !isEqual(prevContainers, newContainers)
          ? newContainers
          : prevContainers;
      });
    }
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
    handleEditContainerMetadata,
    handleRemoveContainer,
    containers,
    items,
    activeItem,
    sensors,
    collisionDetectionStrategy,
    event,
    setEvent,
  };
}
