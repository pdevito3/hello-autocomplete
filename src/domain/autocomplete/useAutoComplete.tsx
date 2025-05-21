import { useCallback, useEffect, useRef, useState } from "react";
import { useActiveItem } from "../autocomplete/core/useActiveItem";
import { useAutocompleteRoot } from "../autocomplete/core/useAutocompleteRoot";
import { useClearButton } from "../autocomplete/core/useClearButton";
import { useDisclosure } from "../autocomplete/core/useDisclosure";
import { useInput } from "../autocomplete/core/useInput";
import { useLabel } from "../autocomplete/core/useLabel";
import { useListbox } from "../autocomplete/core/useListbox";
import { useOption } from "../autocomplete/core/useOption";
import { useCustomValue } from "../autocomplete/features/useCustomValue";
import { useFiltering } from "../autocomplete/features/useFiltering";
import { useGroup } from "../autocomplete/features/useGroup";
import { useGrouping } from "../autocomplete/features/useGrouping";
import { useNavigation } from "../autocomplete/features/useNavigation";
import { useTabs } from "../autocomplete/features/useTabs";
import type {
  ActionItem,
  GroupingOptions,
  UseAutoCompleteGroupedMultipleNoActions,
  UseAutoCompleteGroupedMultipleWithActions,
  UseAutoCompleteGroupedSingleNoActions,
  UseAutoCompleteGroupedSingleWithActions,
  UseAutoCompleteOptions,
  UseAutoCompleteUngroupedMultipleNoActions,
  UseAutoCompleteUngroupedMultipleWithActions,
  UseAutoCompleteUngroupedSingleNoActions,
  UseAutoCompleteUngroupedSingleWithActions,
} from "../autocomplete/types";

export function useAutoComplete<T>(
  options: UseAutoCompleteOptions<T> & {
    actions?: undefined;
    state?: { grouping?: undefined };
    mode?: "single";
  }
): UseAutoCompleteUngroupedSingleNoActions<T>;

export function useAutoComplete<T>(
  options: UseAutoCompleteOptions<T> & {
    actions?: undefined;
    state?: { grouping?: undefined };
    mode: "multiple";
  }
): UseAutoCompleteUngroupedMultipleNoActions<T>;

export function useAutoComplete<T>(
  options: UseAutoCompleteOptions<T> & {
    actions?: undefined;
    state: { grouping: GroupingOptions<T>[] };
    mode?: "single";
  }
): UseAutoCompleteGroupedSingleNoActions<T>;

export function useAutoComplete<T>(
  options: UseAutoCompleteOptions<T> & {
    actions?: undefined;
    state: { grouping: GroupingOptions<T>[] };
    mode: "multiple";
  }
): UseAutoCompleteGroupedMultipleNoActions<T>;

export function useAutoComplete<T>(
  options: UseAutoCompleteOptions<T> & {
    actions: ActionItem[];
    state?: { grouping?: undefined };
    mode?: "single";
  }
): UseAutoCompleteUngroupedSingleWithActions<T>;

export function useAutoComplete<T>(
  options: UseAutoCompleteOptions<T> & {
    actions: ActionItem[];
    state?: { grouping?: undefined };
    mode: "multiple";
  }
): UseAutoCompleteUngroupedMultipleWithActions<T>;

export function useAutoComplete<T>(
  options: UseAutoCompleteOptions<T> & {
    actions: ActionItem[];
    state: { grouping: GroupingOptions<T>[] };
    mode?: "single";
  }
): UseAutoCompleteGroupedSingleWithActions<T>;

export function useAutoComplete<T>(
  options: UseAutoCompleteOptions<T> & {
    actions: ActionItem[];
    state: { grouping: GroupingOptions<T>[] };
    mode: "multiple";
  }
): UseAutoCompleteGroupedMultipleWithActions<T>;

export function useAutoComplete<T>({
  mode: modeProp = "single",
  state = {},
  defaultOpen = false,
  labelSrOnly = false,
  asyncDebounceMs = 0,
  allowsCustomItems = false,
  onInputValueChange,
  onSelectItem,
  onInputValueChangeAsync,
  onBlurAsync,
  items: itemsProp = [],
  onFilterAsync,
  itemToString,
  onClearAsync,
  isItemDisabled: isItemDisabledProp,
  getItemLink,
  actions,
  allowsEmptyCollection = false,
  tabs = [],
  defaultTabKey,
}: UseAutoCompleteOptions<T>):
  | UseAutoCompleteUngroupedSingleNoActions<T>
  | UseAutoCompleteUngroupedMultipleNoActions<T>
  | UseAutoCompleteGroupedSingleNoActions<T>
  | UseAutoCompleteGroupedMultipleNoActions<T>
  | UseAutoCompleteUngroupedSingleWithActions<T>
  | UseAutoCompleteUngroupedMultipleWithActions<T>
  | UseAutoCompleteGroupedSingleWithActions<T>
  | UseAutoCompleteGroupedMultipleWithActions<T> {
  const mode = modeProp;

  const {
    inputValue: inputValueProp,
    setInputValue: setInputValueProp,
    selectedItem: selectedItemProp,
    setSelectedItem: setSelectedItemProp,
    selectedItems: selectedItemsProp,
    setSelectedItems: setSelectedItemsProp,
    isOpen: isOpenProp,
    setIsOpen: setIsOpenProp,
    activeItem: activeItemProp,
    setActiveItem: setActiveItemProp,
    highlightedIndex: highlightedIndexProp,
    setHighlightedIndex: setHighlightedIndexProp,
    disabled,
    label: labelProp = "",
    defaultValue,
    grouping: groupingProp,
  } = state;

  // Input state
  const [inputValueState, setInputValueState] = useState<string>(
    inputValueProp ?? ""
  );
  const inputValue =
    inputValueProp !== undefined ? inputValueProp : inputValueState;
  const setInputValue = setInputValueProp ?? setInputValueState;

  // Single selected value state
  const [selectedItemState, setSelectedItemState] = useState<T | undefined>(
    defaultValue
  );
  const selectedItem =
    mode === "single"
      ? selectedItemProp !== undefined
        ? selectedItemProp
        : selectedItemState
      : undefined;
  const setSelectedItem = setSelectedItemProp ?? setSelectedItemState;

  // Multiple selected values state
  const [selectedItemsState, setSelectedItemsState] = useState<T[]>([]);
  const selectedItems =
    mode === "multiple"
      ? selectedItemsProp !== undefined
        ? selectedItemsProp
        : selectedItemsState
      : [];
  const setSelectedItems =
    mode === "multiple"
      ? setSelectedItemsProp ?? setSelectedItemsState
      : () => {};

  // Open state
  const [isOpenState, setIsOpenState] = useState<boolean>(defaultOpen);
  const isOpen = isOpenProp !== undefined ? isOpenProp : isOpenState;
  const setIsOpen = setIsOpenProp ?? setIsOpenState;

  // Items and tabs
  const [items, setItems] = useState<T[]>(itemsProp);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(() => {
    if (tabs.length === 0) return -1;
    const defIdx = defaultTabKey
      ? tabs.findIndex((t) => t.key === defaultTabKey)
      : -1;
    return defIdx >= 0 ? defIdx : 0;
  });

  const itemToStringFn = useCallback(
    (item: T) => (itemToString ? itemToString(item) : String(item)),
    [itemToString]
  );
  const { grouped, flattenedItems, groupingOptions, ungroupedWithActions } =
    useGrouping<T>({
      allowsCustomItems,
      inputValue,
      itemToString: itemToStringFn,
      actions,
      grouping: groupingProp ?? [],
      items,
      tabs,
      activeTabIndex,
    });

  const isItemDisabled = useCallback(
    (item: T) => isItemDisabledProp?.(item) ?? false,
    [isItemDisabledProp]
  );

  const { activeItem, setActiveItem, highlightedIndex, setHighlightedIndex } =
    useActiveItem({
      activeItemProp,
      highlightedIndexProp,
      flattenedItems,
      setActiveItemProp,
      setHighlightedIndexProp,
    });

  const [isFocused, setIsFocused] = useState(false);

  const handleSelect = useCallback(
    (item: T) => {
      if (isItemDisabled(item)) return;

      if (mode === "single") {
        setSelectedItem(item);
        setInputValue(itemToStringFn(item));
        onSelectItem?.(item);
        setIsOpen(false);
      } else {
        setSelectedItems(
          selectedItems.includes(item)
            ? selectedItems.filter((i) => i !== item)
            : [...selectedItems, item]
        );
        onSelectItem?.(item);
        setInputValue("");
      }

      setActiveItem(null);
    },
    [
      isItemDisabled,
      mode,
      setActiveItem,
      setSelectedItem,
      setInputValue,
      itemToStringFn,
      onSelectItem,
      setIsOpen,
      setSelectedItems,
      selectedItems,
    ]
  );

  const { isCustomItem } = useCustomValue<T>({
    items,
    inputValue,
    itemToString: itemToStringFn,
    allowsCustomItems,
  });

  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);
  const { getItemState, getItemProps, getItemLinkProps } = useOption<T>({
    optionRefs,
    items,
    activeItem,
    selectedItem,
    selectedItems: selectedItems,
    isItemDisabled,
    isCustomItem,
    onSelect: handleSelect,
    mode,
    flattenedItems,
    getItemLink,
    setActiveItem,
    close: () => setIsOpen(false),
  });

  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const { handleKeyDown } = useNavigation<T>({
    activeItem,
    setActiveItem,
    flattenedItems,
    isOpen,
    setIsOpen,
    allowsEmptyCollection,
    tabs,
    activeTabIndex,
    setActiveTabIndex,
    handleSelect,
    optionRefs,
    tabRefs,
  });

  const onFilterAsyncRef = useRef(onFilterAsync);
  useEffect(() => {
    onFilterAsyncRef.current = onFilterAsync;
  }, [onFilterAsync]);
  const prevItemsPropRef = useRef<T[]>(itemsProp);

  // shallow-equal utility so inline arrays don’t repeatedly trigger updates
  function arraysShallowEqual<T>(a: T[], b: T[]) {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  useEffect(() => {
    if (!arraysShallowEqual(prevItemsPropRef.current, itemsProp)) {
      setItems(itemsProp);
      prevItemsPropRef.current = itemsProp;
    }
  }, [itemsProp]);

  useEffect(() => {
    if (defaultValue && mode === "single") {
      setSelectedItem(defaultValue);
      setInputValue(itemToStringFn(defaultValue));
    }
  }, [defaultValue, mode, setSelectedItem, setInputValue, itemToStringFn]);

  const { debouncedAsyncOperation } = useFiltering<T>({
    inputValue,
    setItems,
    onFilterAsyncRef,
    asyncDebounceMs,
  });

  const { getDisclosureProps } = useDisclosure({
    isOpen,
    setIsOpen,
    allowsEmptyCollection,
    itemsLength: flattenedItems.length,
  });

  const { getClearProps, handleClear } = useClearButton<T>({
    inputValue: inputValue,
    selectedItem,
    selectedItems: selectedItems,
    mode,
    onClearAsync,
    setInputValue,
    setSelectedItem,
    setSelectedItems: setSelectedItemsState,
    setActiveItem,
    setIsOpen,
  });

  const { getTabListProps, getTabState, getTabProps } = useTabs<T>({
    tabRefs,
    activeTabIndex,
    items,
    tabs,
    setActiveTabIndex,
    handleKeyDown,
  });

  const { getRootProps } = useAutocompleteRoot<T>({
    isOpen,
    isFocused,
    mode,
    selectedItem,
    selectedItems: selectedItems,
    inputValue,
    setIsOpen,
    setActiveItem,
    setHighlightedIndex,
  });

  // TODO can do better id
  const { getListProps } = useListbox({
    isOpen,
    label: labelProp,
    hasGroups: groupingOptions.length > 0,
    isEmpty: flattenedItems.length === 0,
    size: flattenedItems.length,
  });

  const { getInputProps } = useInput({
    inputValue,
    setInputValue,
    handleKeyDown,
    activeItem,
    flattenedItems,
    tabsCount: tabs.length,
    allowsEmptyCollection,
    setIsOpen,
    setActiveItem,
    onBlurAsync,
    onInputValueChangeAsync,
    onFilterAsyncRef,
    debouncedAsyncOperation,
    onInputValueChange,
    setIsFocused,
    disabled,
  });

  // TODO htmlFor dynamic from input
  const { getLabelProps } = useLabel({
    htmlFor: "autocomplete-input",
    srOnly: labelSrOnly,
  });

  const { getGroupProps, getGroupLabelProps } = useGroup();

  return {
    getItems: () => {
      // if grouped, render groups
      if (groupingOptions.length) {
        return grouped;
      }

      // otherwise, render items + custom‐value + action items
      return ungroupedWithActions as T[];
    },
    getSelectedItem: () => (mode === "multiple" ? selectedItems : selectedItem),
    hasActiveItem: () => !!activeItem,
    isFocused: () => isFocused,
    getRootProps,
    getListProps,
    getLabelProps,
    getInputProps,
    inputValue,
    setInputValue,
    getClearProps,
    getDisclosureProps,
    getItemProps,
    getItemState,
    getGroupProps,
    getGroupLabelProps,
    hasSelectedItem: () =>
      mode === "multiple" ? selectedItems.length > 0 : !!selectedItem,
    isOpen,
    setIsOpen,
    isCustomItem,
    getHighlightedIndex: () => highlightedIndex,
    setHighlightedIndex,
    getActiveItem: () => activeItem,
    setActiveItem,
    getItemLinkProps,
    clear: handleClear,
    getTabListProps,
    getTabProps,
    getTabState,
    getIsDisabled: () => disabled,
  } as unknown as
    | UseAutoCompleteUngroupedSingleNoActions<T>
    | UseAutoCompleteUngroupedMultipleNoActions<T>
    | UseAutoCompleteGroupedSingleNoActions<T>
    | UseAutoCompleteGroupedMultipleNoActions<T>
    | UseAutoCompleteUngroupedSingleWithActions<T>
    | UseAutoCompleteUngroupedMultipleWithActions<T>
    | UseAutoCompleteGroupedSingleWithActions<T>
    | UseAutoCompleteGroupedMultipleWithActions<T>;
}
