import clsx from 'clsx'
import { useState } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "./SortableItem";
import { useDroppable } from "@dnd-kit/core";
import { Group, Textarea, Kbd, useMantineColorScheme } from "@mantine/core";
import { useFocusTrap } from "@mantine/hooks";
import { nanoid } from "nanoid";

import { Text, Button } from "components";
import { useCards } from "hooks";

export const TYPE = {
  Like: {
    emoji: "👍",
    color: "bg-rose-100",
  },
  Learn: {
    emoji: "🤓",
    color: "bg-amber-100",
  },
  Lack: {
    emoji: "🤔",
    color: "bg-sky-100",
  },
};

export function Container({ id, items, color, disableTitle }) {
  const { setNodeRef } = useDroppable({ id });
  const [isAddingCard, setIsAddingCard] = useState(false);
  const textareaRef = useFocusTrap();
  const { handleAddItem } = useCards();
  const { colorScheme } = useMantineColorScheme();

  const handleAddItemSubmit = (e) => {
    e.preventDefault();
    const { text } = e.currentTarget.elements;
    const item = {
      id: nanoid(),
      payload: {
        description: text.value,
      },
    };
    handleAddItem(id, item);
    setIsAddingCard(false);
  };

  return (
    <SortableContext
      id={id}
      items={items}
      strategy={verticalListSortingStrategy}
    >
      {!disableTitle && (
        <Text className="mt-4" as="h4">
          {`${TYPE[id].emoji} ${id}`}
        </Text>
      )}
      <div className={`py-2 mt-8 ${color}`} ref={setNodeRef}>
        {items?.length === 0 ? (
          <Text disableColorScheme className="ml-4 blue-100 text-neutral-900">
            {`No cards 😦, please add one!`}
          </Text>
        ) : (
          <>
            {items?.map((item) => (
              <SortableItem
                key={item?.id}
                id={item?.id}
                type={id}
                payload={item?.payload}
              />
            ))}
          </>
        )}
      </div>
      <Group position="center" className="pt-4">
        <Button
          onClick={() => setIsAddingCard(true)}
          className="mx-auto w-fit"
        >{`Add Card`}</Button>
      </Group>
      {isAddingCard && (
        <form
          onSubmit={handleAddItemSubmit}
          className={clsx(
            "p-4 mt-4 rounded-lg shadow-lg bg-neutral-100",
						 colorScheme === "dark" ? "bg-neutral-900" : "bg-neutral-100"
          )}
        >
          <Group direction="column">
            <Text className="text-xs text-neutral-400">
              {`Press `}
              <Kbd>Ctrl</Kbd>
              {`+`}
              <Kbd>Enter</Kbd>
              {` to enter text`}
            </Text>
            <Textarea
              name="text"
              ref={textareaRef}
              className="w-full"
              placeholder="Type here"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  const item = {
                    id: nanoid(),
                    payload: {
                      description: e.target.value,
                    },
                  };
                  handleAddItem(id, item);
                  setIsAddingCard(false);
                }
              }}
            />
            <Group position="apart" grow className="w-full">
              <Button onClick={() => setIsAddingCard(false)} color="red">
                {`Cancel`}
              </Button>
              <Button type="submit" color="dark">
                {`Add`}
              </Button>
            </Group>
          </Group>
        </form>
      )}
    </SortableContext>
  );
}
