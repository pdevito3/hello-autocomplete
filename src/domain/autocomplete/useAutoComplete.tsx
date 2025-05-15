import { useActiveItem } from "@/domain/autocomplete/core/useActiveItem";
import { useAutocompleteRoot } from "@/domain/autocomplete/core/useAutocompleteRoot";
import { useClearButton } from "@/domain/autocomplete/core/useClearButton";
import { useDisclosure } from "@/domain/autocomplete/core/useDisclosure";
import { useInput } from "@/domain/autocomplete/core/useInput";
import { useLabel } from "@/domain/autocomplete/core/useLabel";
import { useListbox } from "@/domain/autocomplete/core/useListbox";
import { useOption } from "@/domain/autocomplete/core/useOption";
import { useCustomValue } from "@/domain/autocomplete/features/useCustomValue";
import { useFiltering } from "@/domain/autocomplete/features/useFiltering";
import { useGroup } from "@/domain/autocomplete/features/useGroup";
import { useGrouping } from "@/domain/autocomplete/features/useGrouping";
import { useNavigation } from "@/domain/autocomplete/features/useNavigation";
import { useTabs } from "@/domain/autocomplete/features/useTabs";
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
} from "@/domain/autocomplete/types";
import { useCallback, useEffect, useRef, useState } from "react";

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
  allowsCustomValue = false,
  onInputValueChange,
  onSelectValue,
  onInputValueChangeAsync,
  onBlurAsync,
  items: itemsProp = [],
  onFilterAsync,
  itemToString,
  onClear,
  isItemDisabled: isItemDisabledProp,
  getOptionLink,
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
    selectedValue: selectedValueProp,
    setSelectedValue: setSelectedValueProp,
    selectedValues: selectedValuesProp,
    setSelectedValues: setSelectedValuesProp,
    isOpen: isOpenProp,
    setIsOpen: setIsOpenProp,
    activeItem: activeItemProp,
    setActiveItem: setActiveItemProp,
    highlightedIndex: highlightedIndexProp,
    setHighlightedIndex: setHighlightedIndexProp,

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
  const [selectedValueState, setSelectedValueState] = useState<T | undefined>(
    defaultValue
  );
  const selectedValue =
    mode === "single"
      ? selectedValueProp !== undefined
        ? selectedValueProp
        : selectedValueState
      : undefined;
  const setSelectedValue = setSelectedValueProp ?? setSelectedValueState;

  // Multiple selected values state
  const [selectedValuesState, setSelectedValuesState] = useState<T[]>([]);
  const selectedValues =
    mode === "multiple"
      ? selectedValuesProp !== undefined
        ? selectedValuesProp
        : selectedValuesState
      : [];
  const setSelectedValues =
    mode === "multiple"
      ? setSelectedValuesProp ?? setSelectedValuesState
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
      allowsCustomValue,
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
        setSelectedValue(item);
        setInputValue(itemToStringFn(item));
        onSelectValue?.(item);
        setIsOpen(false);
      } else {
        setSelectedValues(
          selectedValues.includes(item)
            ? selectedValues.filter((i) => i !== item)
            : [...selectedValues, item]
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
      itemToStringFn,
      onSelectValue,
      setIsOpen,
      setSelectedValues,
      selectedValues,
    ]
  );

  const { isCustomValue } = useCustomValue<T>({
    items,
    inputValue,
    itemToString: itemToStringFn,
    allowsCustomValue,
  });

  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);
  const { getOptionState, getOptionProps, getOptionLinkProps } = useOption<T>({
    optionRefs,
    items,
    activeItem,
    selectedValue,
    selectedValues: selectedValues,
    isItemDisabled,
    isCustomValue,
    onSelect: handleSelect,
    mode,
    flattenedItems,
    getOptionLink,
    setActiveItem,
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
      setSelectedValue(defaultValue);
      setInputValue(itemToStringFn(defaultValue));
    }
  }, [defaultValue, mode, setSelectedValue, setInputValue, itemToStringFn]);

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
    selectedValue,
    selectedValues: selectedValues,
    mode,
    onClear,
    setInputValue,
    setSelectedValue,
    setSelectedValues: setSelectedValuesState,
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
    selectedValue,
    selectedValues: selectedValues,
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
    getSelectedItem: () =>
      mode === "multiple" ? selectedValues : selectedValue,
    hasActiveItem: () => !!activeItem,
    isFocused: () => isFocused,
    getRootProps,
    getListProps,
    getLabelProps,
    getInputProps,
    getClearProps,
    getDisclosureProps,
    getOptionProps,
    getOptionState,
    getGroupProps,
    getGroupLabelProps,
    hasSelectedItem: () =>
      mode === "multiple" ? selectedValues.length > 0 : !!selectedValue,
    isOpen,
    setIsOpen,
    isCustomValue,
    getHighlightedIndex: () => highlightedIndex,
    setHighlightedIndex,
    getActiveItem: () => activeItem,
    setActiveItem,
    getOptionLinkProps,
    clear: handleClear,
    getTabListProps,
    getTabProps,
    getTabState,
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
