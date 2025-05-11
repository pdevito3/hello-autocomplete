import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { ActionItem, AutocompleteState, Mode } from "../types";

export function useControlled<T>({
  state,
  mode,
  itemToString,
  defaultOpen,
  items: itemsProp,
  flattenedItems,
  tabs,
  defaultTabKey,
}: {
  state: AutocompleteState<T>;
  mode: Mode;
  itemToString: ((item: T) => string) | undefined;
  defaultOpen: boolean;
  items: T[];
  flattenedItems: Array<T | ActionItem>;
  tabs: Array<{ key: string; filter?: (item: T) => boolean }>;
  defaultTabKey?: string;
}) {
  const {
    inputValue: inputValueProp,
    setInputValue: setInputValueProp,
    selectedValue: selectedValueProp,
    setSelectedValue: setSelectedValueProp,
    isOpen: isOpenProp,
    setIsOpen: setIsOpenProp,
    activeItem: activeItemProp,
    setActiveItem: setActiveItemProp,
    highlightedIndex: highlightedIndexProp,
    setHighlightedIndex: setHighlightedIndexProp,
    defaultValue,
  } = state;

  const [inputValueState, setInputValueState] = useState<string>(
    inputValueProp ?? ""
  );
  const inputValue =
    inputValueProp !== undefined ? inputValueProp : inputValueState;
  const setInputValue = setInputValueProp ?? setInputValueState;

  const [selectedValueState, setSelectedValueState] = useState<T | undefined>(
    defaultValue
  );
  const [selectedValuesState, setSelectedValuesState] = useState<T[]>([]);
  const selectedValue =
    mode === "single"
      ? selectedValueProp !== undefined
        ? selectedValueProp
        : selectedValueState
      : undefined;
  const selectedValues = useCallback(
    () => (mode === "multiple" ? selectedValuesState : []),
    [mode, selectedValuesState]
  );
  const setSelectedValue = setSelectedValueProp ?? setSelectedValueState;

  const [isOpenState, setIsOpenState] = useState<boolean>(defaultOpen);
  const isOpen = isOpenProp !== undefined ? isOpenProp : isOpenState;
  const setIsOpen = setIsOpenProp ?? setIsOpenState;

  const [items, setItems] = useState<T[]>(itemsProp);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(() => {
    if (tabs.length === 0) return -1;
    const defIdx = defaultTabKey
      ? tabs.findIndex((t) => t.key === defaultTabKey)
      : -1;
    return defIdx >= 0 ? defIdx : 0;
  });
  // Raw items from props or async
  const rawItems = items;

  const filteredItems: T[] =
    tabs.length && activeTabIndex >= 0
      ? rawItems.filter((item) =>
          tabs[activeTabIndex].filter
            ? tabs[activeTabIndex].filter!(item)
            : true
        )
      : rawItems;

  const [isFocused, setIsFocused] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const prevItemsPropRef = useRef<T[]>(itemsProp);

  // // apply defaultValue if provided (single‐select only)
  useEffect(() => {
    if (state.defaultValue && mode === "single") {
      setSelectedValue(state.defaultValue);
      const text = itemToString
        ? itemToString(state.defaultValue)
        : String(state.defaultValue);
      setInputValue(text);
    }
  }, [
    state.defaultValue,
    mode,
    itemToString,
    setSelectedValueProp,
    setInputValue,
    setSelectedValue,
  ]);

  useEffect(() => {
    if (!arraysShallowEqual(prevItemsPropRef.current, itemsProp)) {
      setItems(itemsProp);
      prevItemsPropRef.current = itemsProp;
    }
  }, [itemsProp]);

  const {
    activeItem,
    setActiveItem,
    highlightedIndex,
    setHighlightedIndex,
  }: {
    activeItem: T | ActionItem | null;
    setActiveItem: (item: T | ActionItem | null) => void;
    highlightedIndex: number | null;
    setHighlightedIndex: (index: number | null) => void;
  } = useActiveItemManager<T>(
    activeItemProp,
    highlightedIndexProp,
    flattenedItems,
    setActiveItemProp,
    setHighlightedIndexProp
  );

  return {
    inputValue,
    setInputValue,
    isOpen,
    setIsOpen,
    activeItem,
    setActiveItem,
    highlightedIndex,
    setHighlightedIndex,
    open,
    isFocused,
    setIsFocused,
    rawItems,
    abortControllerRef,
    setSelectedValuesState,
    selectedValue,
    selectedValues,
    selectedValueProp,
    selectedValuesState,
    setItems,
    activeTabIndex,
    setActiveTabIndex,
    filteredItems,
    prevItemsPropRef,
  };
}

// shallow-equal utility so inline arrays don’t repeatedly trigger updates
function arraysShallowEqual<T>(a: T[], b: T[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function useActiveItemManager<T>(
  activeItemProp: T | null | undefined,
  highlightedIndexProp: number | null | undefined,
  flattenedItems: (T | ActionItem)[],
  setActiveItemProp: ((item: T | null) => void) | undefined,
  setHighlightedIndexProp: ((index: number | null) => void) | undefined
) {
  type NavState = {
    activeItem: T | ActionItem | null;
    highlightedIndex: number | null;
  };

  type NavAction =
    | {
        type: "SET_ACTIVE_ITEM";
        payload: { item: T | ActionItem | null; index: number | null };
      }
    | {
        type: "SET_HIGHLIGHTED_INDEX";
        payload: { item: T | ActionItem | null; index: number | null };
      };

  function navReducer(state: NavState, action: NavAction): NavState {
    switch (action.type) {
      case "SET_ACTIVE_ITEM":
      case "SET_HIGHLIGHTED_INDEX":
        return {
          activeItem: action.payload.item,
          highlightedIndex: action.payload.index,
        };
      default:
        return state;
    }
  }

  const [navState, dispatchNav] = useReducer(navReducer, {
    activeItem: null,
    highlightedIndex: null,
  });

  const activeItem: T | ActionItem | null =
    activeItemProp !== undefined ? activeItemProp : navState.activeItem;
  const highlightedIndex: number | null =
    highlightedIndexProp !== undefined
      ? highlightedIndexProp
      : navState.highlightedIndex;

  // Wrappers that update both pieces via reducer + external setters
  const setActiveItem = useCallback(
    (item: T | ActionItem | null) => {
      const index =
        item !== null ? flattenedItems.findIndex((i) => i === item) : null;
      // only pass real T back to any external prop
      setActiveItemProp?.((item as T) || null);
      setHighlightedIndexProp?.(index);
      dispatchNav({ type: "SET_ACTIVE_ITEM", payload: { item, index } });
    },
    [flattenedItems, setActiveItemProp, setHighlightedIndexProp]
  );

  const setHighlightedIndex = useCallback(
    (index: number | null) => {
      const item = index !== null ? flattenedItems[index] : null;
      // only pass real T back to any external prop
      setActiveItemProp?.((item as T) || null);
      setHighlightedIndexProp?.(index);
      dispatchNav({ type: "SET_HIGHLIGHTED_INDEX", payload: { item, index } });
    },
    [flattenedItems, setActiveItemProp, setHighlightedIndexProp]
  );
  return { activeItem, setActiveItem, highlightedIndex, setHighlightedIndex };
}
