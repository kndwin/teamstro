import clsx from "clsx";
import { useState, useEffect } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "./SortableItem";
import {
  Group,
  Textarea,
  Kbd,
  useMantineColorScheme,
  TextInput,
  ColorSwatch,
  ActionIcon,
} from "@mantine/core";
import { useSortable } from "@dnd-kit/sortable";
import { useFocusTrap } from "@mantine/hooks";
import { nanoid } from "nanoid";
import { FiMove, FiCheck } from "react-icons/fi";

import { Text, Button, Popover } from "components";
import { useCards } from "hooks";
import { COLORS } from "styles/colors";

export function Container({ id, items, metadata, disableHeader }) {
	const { activeItem } = useCards()
  const [isAddingCard, setIsAddingCard] = useState(false);
  const { colorScheme } = useMantineColorScheme();
  const { setNodeRef, listeners, attributes } = useSortable({ id });

	useEffect(() => {
		console.log({ activeItem })
	}, [activeItem])

  return (
    <SortableContext
      id={id}
      items={items}
      strategy={verticalListSortingStrategy}
    >
      <div
        ref={setNodeRef}
        style={{
          border: colorScheme === "dark" ? "1px solid #ccc" : "1px solid #333",
					opacity: activeItem?.id === id ? 0.5 : 1,
        }}
        className={clsx(
          colorScheme === "dark" ? "bg-neutral-800" : "bg-neutral-100",
          "p-4 rounded-lg"
        )}
      >
        {!disableHeader && (
          <Header
            metadata={metadata}
            handles={{ ...attributes, ...listeners }}
          />
        )}

        <div
          style={{ backgroundColor: COLORS[metadata?.color]?.rgb }}
          className={`py-2 mt-8`}
        >
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
          <AddNewCard containerId={id} setIsAddingCard={setIsAddingCard} />
        )}
      </div>
    </SortableContext>
  );
}

const AddNewCard = ({ containerId, setIsAddingCard }) => {
  const { handleAddItem } = useCards();
  const textareaRef = useFocusTrap();
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
    handleAddItem(containerId, item);
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
      handleAddItem(containerId, item);
      setIsAddingCard(false);
    }
  };

  return (
    <form
      onSubmit={handleAddItemSubmit}
      className={clsx(
        "p-4 mt-4 rounded-lg shadow-lg bg-neutral-100",
        colorScheme === "dark" ? "bg-neutral-900" : "bg-neutral-100"
      )}
    >
      <Group direction="column">
        <Text className="items-center text-xs">
          {`Press `}
          <Kbd>Ctrl</Kbd>
          {` + `}
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
  );
};
const Header = ({ metadata, handles }) => {
  const { colorScheme } = useMantineColorScheme();

  return (
    <Group position="apart" align="center">
      <Text className="text-xl font-bold">{`${metadata?.label}`}</Text>

      <Group>
        <EditContainerPopover metadata={metadata} />
        <ActionIcon {...handles} width={24} size="xl" color="dark">
          <FiMove
            className={
              colorScheme === "dark" ? "text-neutral-200" : "text-neutral-900"
            }
            size={24}
          />
        </ActionIcon>
      </Group>
    </Group>
  );
};

const EditContainerPopover = ({ metadata }) => {
  const [openPopover, setOpenPopover] = useState(false);
  const { handleEditContainerMetadata, handleRemoveContainer } = useCards();
  const [colorChecked, setColorChecked] = useState("rose");

  const handleLabelUpdate = (e) => {
    const label = e.target.value;
    handleEditContainerMetadata({
      containerId: metadata.id,
      metadata: { ...metadata, label },
    });
  };

  const handleColorSelection = (color) => {
    setColorChecked(color);
    handleEditContainerMetadata({
      containerId: metadata.id,
      metadata: { ...metadata, color },
    });
  };

  const handleDeleteContainer = ({ containerId }) => {
    handleRemoveContainer({ containerId });
    setOpenPopover(false);
  };

  return (
    <Popover
      open={openPopover}
      setOpen={setOpenPopover}
      placement="end"
      position="bottom"
    >
      <Group direction="column" grow>
        <TextInput defaultValue={metadata?.label} onBlur={handleLabelUpdate} />
        <ColorPalette
          colorChecked={colorChecked}
          handleColorSelection={handleColorSelection}
        />
        <Button
          onClick={() => handleDeleteContainer({ containerId: metadata.id })}
          color="red"
        >{`Delete container`}</Button>
      </Group>
    </Popover>
  );
};

export const ColorPalette = ({
  colorChecked,
  setColorChecked,
  handleColorSelection,
}) => {
  const onClick = (color) => {
    Boolean(handleColorSelection)
      ? handleColorSelection(color)
      : setColorChecked(color);
  };

  return (
    <Group spacing="xs">
      {Object.keys(COLORS).map((color) => {
        return (
          <ColorSwatch
            onClick={() => onClick(color)}
            key={color}
            color={COLORS[color].rgb}
            className="cursor-pointer"
          >
            {colorChecked === color ? <FiCheck /> : null}
          </ColorSwatch>
        );
      })}
    </Group>
  );
};
