import clsx from "clsx";
import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FiEdit, FiX, FiMove } from "react-icons/fi";

import {
  ActionIcon,
  Group,
  Button,
  Textarea,
  Kbd,
  useMantineColorScheme,
} from "@mantine/core";
import { useFocusTrap } from "@mantine/hooks";
import { Text } from "components";
import { useCards } from "hooks";

const MODE = {
  EDIT: "edit",
  VIEW: "view",
};

export function SortableItem({ id, type, payload, metadata }) {
  const { colorScheme } = useMantineColorScheme();
  const textareaRef = useFocusTrap();
  const [mode, setMode] = useState(payload?.defaultMode ?? MODE.VIEW);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const { handleEditItem, handleRemoveItem } = useCards();

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  const handleModeChange = (mode) => {
    setMode(mode);
  };

  const ViewMode = () => <Text>{payload?.description}</Text>;

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const { text } = e.currentTarget.elements;
    const item = {
      id,
      payload: { description: text.value },
    };
    handleEditItem(type, item);
    handleModeChange(MODE.VIEW);
  };

  const handleCtrlAndEnter = (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      const item = {
        id,
        payload: {
          description: e.target.value,
        },
      };
      handleEditItem(type, item);
      handleModeChange(MODE.VIEW);
    }
  };

  const EditMode = () => (
    <form onSubmit={handleEditSubmit}>
      <Group direction="column">
        <Text className="text-xs text-neutral-400">
          {`Press `}
          <Kbd>Ctrl</Kbd>
          {`+`}
          <Kbd>Enter</Kbd>
          {` to enter text`}
        </Text>
        <Textarea
          ref={textareaRef}
          name="text"
          className="w-full"
          defaultValue={payload?.description}
          onKeyDown={handleCtrlAndEnter}
        />
        <Group position="apart" grow className="w-full">
          <Button onClick={() => handleModeChange(MODE.VIEW)} color="red">
            {`Cancel`}
          </Button>
          <Button type="submit" color="dark">
            {`Edit`}
          </Button>
        </Group>
      </Group>
    </form>
  );

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "p-4 mx-4 my-4 rounded-lg shadow-lg",
        colorScheme === "dark" ? "bg-neutral-900" : "bg-neutral-100"
      )}
      style={style}
    >
      <Group position="right" spacing="xs" className="z-20 w-full mb-4 ml-auto">
        <ActionIcon onClick={() => handleModeChange(MODE.EDIT)}>
          <FiEdit />
        </ActionIcon>
        <ActionIcon onClick={() => handleRemoveItem(type, id)}>
          <FiX />
        </ActionIcon>
        <ActionIcon {...attributes} {...listeners}>
          <FiMove />
        </ActionIcon>
      </Group>
      {mode === MODE.VIEW && <ViewMode />}
      {mode === MODE.EDIT && <EditMode />}
    </div>
  );
}
