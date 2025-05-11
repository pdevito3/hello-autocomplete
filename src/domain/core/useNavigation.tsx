import { useCallback } from "react";
import type { ActionItem, Mode } from "../types";

export function useNavigation<T>({
  activeItem,
  setActiveItem,
  flattenedItems,
  isOpen,
  setIsOpen,
  allowsEmptyCollection,
  tabs,
  activeTabIndex,
  setActiveTabIndex,
  isItemDisabled,
  itemToString,
  mode,
  setSelectedValue,
  setInputValue,
  setSelectedValuesState,
  onSelectValue,
}: {
  activeItem: ActionItem | T | null;
  setActiveItem: (item: T | null) => void;
  flattenedItems: Array<T>;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  allowsEmptyCollection: boolean;
  tabs: Array<{ key: string; filter?: (item: T) => boolean }>;
  activeTabIndex: number;
  setActiveTabIndex: (index: number) => void;
  isItemDisabled: (item: T) => boolean;
  itemToString: (item: T) => string;
  mode: Mode;
  setSelectedValue: (value: T) => void;
  setInputValue: (value: string) => void;
  setSelectedValuesState: React.Dispatch<React.SetStateAction<T[]>>;
  onSelectValue?: (item: T) => void;
}) {
  const handleSelect = useCallback(
    (item: T) => {
      if (isItemDisabled(item)) {
        return; // do nothing if the item is disabled
      }
      if (mode === "single") {
        setSelectedValue(item);
        setInputValue(itemToString(item));
        onSelectValue?.(item);
        setIsOpen(false);
      } else {
        setSelectedValuesState((prev) =>
          prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
        );
        onSelectValue?.(item);
        setInputValue("");
      }
      setActiveItem(null);
    },
    [
      isItemDisabled,
      mode,
      setActiveItem,
      setSelectedValue,
      setInputValue,
      itemToString,
      onSelectValue,
      setIsOpen,
      setSelectedValuesState,
    ]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      const { key } = event;
      const currentIndex = flattenedItems.findIndex((i) => i === activeItem);

      switch (key) {
        case "ArrowDown":
          event.preventDefault();
          if (!isOpen) {
            if (allowsEmptyCollection || flattenedItems.length > 0) {
              setIsOpen(true);
              if (flattenedItems.length) setActiveItem(flattenedItems[0]);
            }
          } else {
            const nextIndex =
              currentIndex < flattenedItems.length - 1 ? currentIndex + 1 : 0;
            setActiveItem(flattenedItems[nextIndex]);
            document
              .getElementById(`option-${nextIndex}`)
              ?.scrollIntoView({ block: "nearest" });
          }
          break;

        case "ArrowUp":
          event.preventDefault();
          if (!isOpen) {
            if (allowsEmptyCollection || flattenedItems.length > 0) {
              setIsOpen(true);
              if (flattenedItems.length)
                setActiveItem(flattenedItems[flattenedItems.length - 1]);
            }
          } else {
            const prevIndex =
              currentIndex > 0 ? currentIndex - 1 : flattenedItems.length - 1;
            setActiveItem(flattenedItems[prevIndex]);
            document
              .getElementById(`option-${prevIndex}`)
              ?.scrollIntoView({ block: "nearest" });
          }
          break;

        case "ArrowRight":
          event.preventDefault();
          if (tabs.length > 0) {
            const nextTab = (activeTabIndex + 1) % tabs.length;
            setActiveTabIndex(nextTab);
            // document
            //   .getElementById(`autocomplete-tab-${tabs[nextTab].key}`)
            //   ?.focus();
          }
          break;

        case "ArrowLeft":
          event.preventDefault();
          if (tabs.length > 0) {
            const prevTab = (activeTabIndex - 1 + tabs.length) % tabs.length;
            setActiveTabIndex(prevTab);
            // document
            //   .getElementById(`autocomplete-tab-${tabs[prevTab].key}`)
            //   ?.focus();
          }
          break;

        case "Enter":
          event.preventDefault();
          if (activeItem) {
            if ((activeItem as ActionItem).__isAction) {
              (activeItem as ActionItem).onAction();
            } else {
              handleSelect(activeItem as T);
            }
          }
          break;

        case "Escape":
          event.preventDefault();
          setIsOpen(false);
          setActiveItem(null);
          break;

        case "Tab":
          setIsOpen(false);
          setActiveItem(null);
          break;
      }
    },
    [
      allowsEmptyCollection,
      flattenedItems,
      activeItem,
      isOpen,
      setIsOpen,
      setActiveItem,
      handleSelect,
      tabs,
      activeTabIndex,
      setActiveTabIndex,
    ]
  );

  return { handleKeyDown };
}
