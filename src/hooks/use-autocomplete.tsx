import { useAutocompleteRoot } from "@/domain/autocomplete/core/useAutocompleteRoot";
import { useClearButton } from "@/domain/autocomplete/core/useClearButton";
import { useDisclosure } from "@/domain/autocomplete/core/useDisclosure";
import { useInput } from "@/domain/autocomplete/core/useInput";
import { useLabel } from "@/domain/autocomplete/core/useLabel";
import { useListbox } from "@/domain/autocomplete/core/useListbox";
import { useOption } from "@/domain/autocomplete/core/useOption";
import { useTabs } from "@/domain/autocomplete/core/useTabs";
import { useGroup } from "@/domain/autocomplete/features/useGroup";
import type {
  ActionItem,
  Group,
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
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useDebouncedValue } from "./use-debounced-value";

// 2) Wire them up in your overloads:

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

  // Apply tab‐level filter before other filters
  const filteredItems: T[] =
    tabs.length && activeTabIndex >= 0
      ? rawItems.filter((item) =>
          tabs[activeTabIndex].filter
            ? tabs[activeTabIndex].filter!(item)
            : true
        )
      : rawItems;

  const abortControllerRef = useRef<AbortController | null>(null);
  const prevItemsPropRef = useRef<T[]>(itemsProp);

  // ---- grouping logic unchanged ----
  const groupingOptions = Array.isArray(groupingProp)
    ? groupingProp
    : groupingProp
    ? [groupingProp]
    : [];

  const createGroups = (itemsToGroup: T[], level = 0): Group<T>[] => {
    if (level >= groupingOptions.length) return [];
    const { key: propKey, label: propLabel } = groupingOptions[level];
    const map = itemsToGroup.reduce<Record<string, T[]>>((acc, item) => {
      const raw = item[propKey];
      const k = String(raw ?? "");
      (acc[k] ??= []).push(item);
      return acc;
    }, {});
    return Object.entries(map).map(([groupKey, groupItems]) => {
      const sub = createGroups(groupItems, level + 1);
      const grp: Group<T> = {
        key: groupKey,
        items: groupItems,
        label: propLabel,
        listProps: {
          role: "group",
          "aria-label": propLabel,
          "data-group": true,
          "data-group-key": groupKey,
          "data-group-level": level.toString(),
          "data-has-subgroups": sub.length > 0 ? "true" : undefined,
        },
        header: {
          label: groupKey,
          headingProps: {
            role: "presentation",
            "data-group-label": true,
            "data-group-key": groupKey,
          },
        },
      };
      if (sub.length) grp.groups = sub;
      return grp;
    });
  };

  const grouped = groupingOptions.length ? createGroups(filteredItems) : [];

  const flattenGroups = (groupsList: Group<T>[]): T[] =>
    groupsList.reduce<T[]>(
      (acc, grp) =>
        grp.groups && grp.groups.length
          ? acc.concat(flattenGroups(grp.groups))
          : acc.concat(grp.items),
      []
    );

  const itemToStringFn = useCallback(
    (item: T) => (itemToString ? itemToString(item) : String(item)),
    [itemToString]
  );

  // ---- ungrouped items + optional “create custom” item as before ----
  const ungroupedItemsWithCustom: T[] = (() => {
    if (
      allowsCustomValue &&
      inputValue.trim() !== "" &&
      !filteredItems.some((it) => itemToStringFn(it) === inputValue)
    ) {
      return [...filteredItems, inputValue as unknown as T];
    }
    return filteredItems;
  })();

  // ---- now weave in any ActionItem[] from options.actions ----  // ----------------------------------------------------------------
  // New: auto‑inject the __isAction flag on every action item
  // ----------------------------------------------------------------
  const builtActions: ActionItem[] = (actions ?? []).map((a) => ({
    ...a,
    __isAction: true as const,
  }));
  const ungroupedWithActions: Array<T | ActionItem> = (() => {
    const base = ungroupedItemsWithCustom;
    // filter out “empty‐only” if we have items
    const visible = builtActions.filter(
      (a) => !a.showWhenEmpty || base.length === 0
    );
    const top = visible.filter((a) => a.placement === "top");
    const bottom = visible.filter((a) => a.placement !== "top");
    return [...top, ...base, ...bottom];
  })();

  // ---- final flattenedItems now includes real items + ActionItems ----
  const flattenedItems: Array<T | ActionItem> = groupingOptions.length
    ? (flattenGroups(grouped) as Array<T | ActionItem>)
    : ungroupedWithActions;

  const isItemDisabled = useCallback(
    (item: T) => isItemDisabledProp?.(item) ?? false,
    [isItemDisabledProp]
  );

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

  const [isFocused, setIsFocused] = useState(false);

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

  const onFilterAsyncRef = useRef(onFilterAsync);
  useEffect(() => {
    onFilterAsyncRef.current = onFilterAsync;
  }, [onFilterAsync]);

  const debouncedAsyncOperation = useCallback(async (value: string) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    try {
      const filterFn = onFilterAsyncRef.current;
      if (filterFn) {
        const results = await filterFn({
          searchTerm: value,
          signal: abortControllerRef.current!.signal,
        });
        setItems(results);
      }
    } catch (err) {
      if (!(err instanceof Error && err.name === "AbortError"))
        console.error(err);
    }
  }, []);

  const [debouncedInputValue] = useDebouncedValue(inputValue, asyncDebounceMs);
  useEffect(() => {
    if (onFilterAsyncRef.current) debouncedAsyncOperation(debouncedInputValue);
  }, [debouncedInputValue, debouncedAsyncOperation]);

  const handleSelect = useCallback(
    (item: T) => {
      if (isItemDisabled(item)) {
        return; // do nothing if the item is disabled
      }
      if (mode === "single") {
        setSelectedValue(item);
        setInputValue(itemToStringFn(item));
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
      itemToStringFn,
      onSelectValue,
      setIsOpen,
    ]
  );

  const { getDisclosureProps } = useDisclosure({
    isOpen,
    setIsOpen,
    allowsEmptyCollection,
    itemsLength: flattenedItems.length,
  });

  const { getClearProps, handleClear } = useClearButton<T>({
    inputValue: inputValue,
    selectedValue,
    selectedValues: selectedValues(),
    mode,
    onClear,
    setInputValue,
    setSelectedValue,
    setSelectedValues: setSelectedValuesState,
    setActiveItem,
    setIsOpen,
  });

  const isCustomValue = useCallback(
    (item: T) => {
      return (
        allowsCustomValue &&
        inputValue.trim() !== "" &&
        itemToStringFn(item) === inputValue &&
        !items.some((it) => itemToStringFn(it) === inputValue)
      );
    },
    [allowsCustomValue, inputValue, itemToStringFn, items]
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

  const { getTabListProps, getTabState, getTabProps } = useTabs({
    activeTabIndex,
    rawItems: items,
    tabs,
    setActiveTabIndex,
    handleKeyDown,
  });

  const { getRootProps } = useAutocompleteRoot<T>({
    isOpen,
    isFocused,
    mode,
    selectedValue,
    selectedValues: selectedValues(),
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

  const { getOptionState, getOptionProps, getOptionLinkProps } = useOption<T>({
    items,
    activeItem,
    selectedValue,
    selectedValues: selectedValues(),
    isItemDisabled,
    isCustomValue,
    onSelect: handleSelect,
    mode,
    flattenedItems,
    getOptionLink,
    setActiveItem,
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
      mode === "multiple" ? selectedValues() : selectedValue,
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
      mode === "multiple" ? selectedValues().length > 0 : !!selectedValue,
    isOpen: () => isOpen,
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
