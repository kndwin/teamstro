import clsx from "clsx";
import { useState, useEffect } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "./SortableItem";
import { useDroppable } from "@dnd-kit/core";
import {
  Group,
  Textarea,
  Kbd,
  useMantineColorScheme,
  Paper,
  Input,
  Popover,
  ActionIcon,
} from "@mantine/core";
import { useSortable } from "@dnd-kit/sortable";
import { useFocusTrap } from "@mantine/hooks";
import { nanoid } from "nanoid";
import { FiMoreHorizontal, FiMove } from "react-icons/fi";

import { Text, Button } from "components";
import { useCards } from "hooks";

const containerColors = {
  rose: "bg-rose-100",
  skyblue: "bg-sky-100",
};

export function Container({ id, items, metadata, disableTitle }) {
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

  const handleCtrlAndEnter = (e) => {
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
  };

  const { setNodeRef, listeners, attributes } = useSortable({ id });

  return (
    <SortableContext
      id={id}
      items={items}
      strategy={verticalListSortingStrategy}
    >
      <div
        ref={setNodeRef}
        className={clsx(
          colorScheme === "dark" ? "bg-neutral-800" : "bg-neutral-100",
					"p-4"
        )}
      >
        <Title
          disableTitle={disableTitle}
          metadata={metadata}
          handles={{ ...attributes, ...listeners }}
        />

        <div className={`py-2 mt-8 ${containerColors[metadata?.color]}`}>
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
                  metadata={metadata}
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
                onKeyDown={handleCtrlAndEnter}
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
      </div>
    </SortableContext>
  );
}

const MODE = {
  VIEW: "view",
  EDIT: "edit",
};

const Title = ({ metadata, handles, disableTitle }) => {
  const [showEditPopper, setShowEditPopper] = useState(false);
  const [label, setLabel] = useState(metadata?.label);
  const { colorScheme } = useMantineColorScheme();

  const MoreIcon = () => (
    <ActionIcon
      onClick={() => setShowEditPopper(!showEditPopper)}
      width={24}
      size="xl"
      color="dark"
    >
      <FiMoreHorizontal size={24} />
    </ActionIcon>
  );

  const handleLabelUpdate = (e) => {
    const labelToSet = e.target.value;
    console.log({ labelToSet });
  };

  return (
    <Group position="apart" align="center">
      <Text
        className="cursor-pointer"
        as="h4"
        onClick={() => handleToggleTitleMode()}
      >
        {`${metadata?.label}`}
      </Text>

      <Group>
        <Popover
          opened={showEditPopper}
          onClose={() => setShowEditPopper(false)}
          target={<MoreIcon />}
          position="bottom"
          placement="end"
          width="100%"
          radius="md"
          classNames={{
            popover:
              colorScheme === "dark" ? "bg-neutral-900" : "bg-neutral-100",
          }}
        >
          <Paper>
            <Group direction="column" grow>
              <Input
                defaultValue={metadata?.label}
                onBlur={handleLabelUpdate}
              />
              <Button color="red">{`Delete container`}</Button>
            </Group>
          </Paper>
        </Popover>
        <ActionIcon {...handles} width={24} size="xl" color="dark">
          <FiMove size={24} />
        </ActionIcon>
      </Group>
    </Group>
  );
};
