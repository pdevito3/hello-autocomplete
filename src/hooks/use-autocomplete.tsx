import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useDebouncedValue } from "./use-debounced-value";

export type Placement = "top" | "bottom" | "left" | "right";
export type Mode = "single" | "multiple";

export interface GroupingOptions<T> {
  /** property name on item to group by */
  key: keyof T;
  /** optional aria-label or overall label for group list */
  label: string;
}

export interface Group<T> {
  /** unique identifier for this group (the group-by value) */
  key: string;
  /** items in this group (always entire set even if nested groups) */
  items: T[];
  /** optional sub-groups for further levels of grouping */
  groups?: Group<T>[];
  /** aria-label for the group's list container */
  label: string;

  /** allow any `data-*` on the <ul> */
  listProps: React.HTMLAttributes<HTMLUListElement> & {
    [key: `data-${string}`]: string | boolean | undefined;
  };

  header: {
    /** text to render as the group's heading */
    label: string;

    /** allow any `data-*` on the <span> */
    headingProps: React.HTMLAttributes<HTMLSpanElement> & {
      [key: `data-${string}`]: string | boolean | undefined;
    };
  };
}

// ----------------------------------------------------------------
// New: ActionItem type to represent “action” entries in the list
// ----------------------------------------------------------------
interface ActionItem {
  /** marker so we can detect these at runtime */
  __isAction?: true;
  /** text to render for this action */
  label: string;
  /** what to do when it’s “selected” */
  onAction: () => void;
  /** placement: top or bottom of the list (default bottom) */
  placement?: "top" | "bottom";
  /** if true, only render when the list of real items is empty */
  showWhenEmpty?: boolean;
}

export interface Tab<T> {
  /** unique key for this tab */
  key: string;
  /** text to render on the tab */
  label: string;
  /** filter to apply before other filtering */
  filter?: (item: T) => boolean;
  /** optional custom props for the tab button */
  tabProps?: React.HTMLAttributes<HTMLButtonElement>;
}

export interface AutocompleteState<T> {
  inputValue?: string;
  setInputValue?: (value: string) => void;
  selectedValue?: T;
  setSelectedValue?: (value: T | undefined) => void;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  /** one or more levels of grouping definitions */
  grouping?: GroupingOptions<T>[];
  defaultValue?: T;

  activeItem?: T | null;
  setActiveItem?: (item: T | null) => void;
  /** index of the currently highlighted option */
  highlightedIndex?: number | null;
  /** callback to set the highlighted option index */
  setHighlightedIndex?: (index: number | null) => void;
  label?: string;
}

export interface UseAutoCompleteOptions<T> {
  /** 'single' for one selection, 'multiple' for multiple */
  mode?: Mode;
  state?: AutocompleteState<T>;
  defaultOpen?: boolean;
  labelSrOnly?: boolean;
  placement?: Placement;
  asyncDebounceMs?: number;
  /** enable selecting values that aren’t in the list */
  allowsCustomValue?: boolean;
  items?: T[];
  itemToString?: (item: T) => string;
  onInputValueChange?: (value: string) => void;
  onFilterAsync?: (params: {
    searchTerm: string;
    signal: AbortSignal;
  }) => Promise<T[]>;
  onInputValueChangeAsync?: (params: {
    value: string;
    signal: AbortSignal;
  }) => Promise<void>;
  onBlurAsync?: (params: {
    value: string;
    signal: AbortSignal;
  }) => Promise<void>;
  onSelectValue?: (value: T) => void;
  onCustomValueAsync?: (params: {
    value: string;
    signal: AbortSignal;
  }) => Promise<void>;
  /** called when the clear button is clicked */
  onClear?: () => void;

  /** return true for items that should be rendered and treated as disabled */
  isItemDisabled?: (item: T) => boolean;
  /**
   * derive link props for an option.
   * Can return a string (will be used as href)
   * or an object of props (e.g. { to, params, search } for a router Link).
   */
  getOptionLink?: (
    item: T
  ) => string | Partial<Record<string, unknown>> | undefined;
  /**
   * zero or more “action” entries that appear alongside your normal items,
   * can be clicked or keyboard‑selected to run `onAction()`
   */
  actions?: ActionItem[];
  /** whether the combo box allows the menu to open even when the item collection is empty */
  allowsEmptyCollection?: boolean;

  /** zero or more tabs for pre‐filtering items */
  tabs?: Tab<T>[];
  /** key of the tab to select by default */
  defaultTabKey?: string;
}

export interface OptionState {
  isActive: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  isAction: boolean;
}

export interface TabState {
  isSelected: boolean;
  isDisabled: boolean;
  itemCount: number;
}

// ----------------------------------------------------------------
// 1) Define two distinct return types:
//    - NoActions → getItems(): T[]
//    - WithActions → getItems(): Array<T|ActionItem>
// ----------------------------------------------------------------

interface UseAutoCompleteReturnNoActions<T> {
  getItems: () => T[];
  getSelectedItem: () => T | T[] | undefined;
  hasActiveItem: () => boolean;
  isFocused: () => boolean;
  getRootProps: () => React.HTMLAttributes<HTMLDivElement> & {
    ref: React.Ref<HTMLDivElement>;
  } & { [key: `data-${string}`]: string | boolean | undefined };
  getListProps: () => React.HTMLAttributes<HTMLUListElement> & {
    ref: React.Ref<HTMLUListElement>;
  };
  getLabelProps: () => React.LabelHTMLAttributes<HTMLLabelElement>;
  getInputProps: () => React.InputHTMLAttributes<HTMLInputElement> & {
    [key: `data-${string}`]: string | boolean | undefined;
  };
  getClearProps: () => React.ButtonHTMLAttributes<HTMLButtonElement> & {
    [key: `data-${string}`]: string | boolean | undefined;
  };
  getDisclosureProps: () => React.ButtonHTMLAttributes<HTMLButtonElement> & {
    [key: `data-${string}`]: string | boolean | undefined;
  };
  getOptionProps: (
    item: T | ActionItem
  ) => React.LiHTMLAttributes<HTMLLIElement>;

  getOptionState: (item: T) => OptionState;
  getGroupProps: (group: Group<T>) => React.HTMLAttributes<HTMLUListElement>;
  getGroupLabelProps: (
    group: Group<T>
  ) => React.HTMLAttributes<HTMLSpanElement>;
  hasSelectedItem: () => boolean;
  isOpen: () => boolean;
  setIsOpen: (open: boolean) => void;
  isCustomValue: (item: T) => boolean;
  getHighlightedIndex: () => number | null;
  setHighlightedIndex: (i: number | null) => void;
  getActiveItem: () => T | null;
  setActiveItem: (item: T | null) => void;
  getOptionLinkProps: (
    item: T
  ) => React.AnchorHTMLAttributes<HTMLAnchorElement> & { role: "option" };
  clear: () => void;
  /** props for the tab list container */
  getTabListProps: () => React.HTMLAttributes<HTMLDivElement>;
  /** props for an individual tab */
  getTabProps: (
    tab: Tab<T>,
    index: number
  ) => React.HTMLAttributes<HTMLButtonElement>;
  getTabState: (tab: Tab<T>) => TabState;
}

interface UseAutoCompleteReturnWithActions<T> {
  getItems: () => Array<T | ActionItem>;
  getSelectedItem: () => T | T[] | undefined;
  hasActiveItem: () => boolean;
  isFocused: () => boolean;
  getRootProps: () => React.HTMLAttributes<HTMLDivElement> & {
    ref: React.Ref<HTMLDivElement>;
  } & { [key: `data-${string}`]: string | boolean | undefined };
  getListProps: () => React.HTMLAttributes<HTMLUListElement> & {
    ref: React.Ref<HTMLUListElement>;
  };
  getLabelProps: () => React.LabelHTMLAttributes<HTMLLabelElement>;
  getInputProps: () => React.InputHTMLAttributes<HTMLInputElement> & {
    [key: `data-${string}`]: string | boolean | undefined;
  };
  getClearProps: () => React.ButtonHTMLAttributes<HTMLButtonElement> & {
    [key: `data-${string}`]: string | boolean | undefined;
  };
  getDisclosureProps: () => React.ButtonHTMLAttributes<HTMLButtonElement> & {
    [key: `data-${string}`]: string | boolean | undefined;
  };
  getOptionProps: (
    item: T | ActionItem
  ) => React.LiHTMLAttributes<HTMLLIElement>;
  getOptionState: (item: T | ActionItem) => OptionState;
  getGroupProps: (group: Group<T>) => React.HTMLAttributes<HTMLUListElement>;
  getGroupLabelProps: (
    group: Group<T>
  ) => React.HTMLAttributes<HTMLSpanElement>;
  hasSelectedItem: () => boolean;
  isOpen: () => boolean;
  setIsOpen: (open: boolean) => void;
  isCustomValue: (item: T) => boolean;
  getHighlightedIndex: () => number | null;
  setHighlightedIndex: (i: number | null) => void;
  getActiveItem: () => T | ActionItem | null;
  setActiveItem: (item: T | ActionItem | null) => void;
  getOptionLinkProps: (
    item: T
  ) => React.AnchorHTMLAttributes<HTMLAnchorElement> & { role: "option" };
  clear: () => void;
  /** props for the tab list container */
  getTabListProps: () => React.HTMLAttributes<HTMLDivElement>;
  /** props for an individual tab */
  getTabProps: (
    tab: Tab<T>,
    index: number
  ) => React.HTMLAttributes<HTMLButtonElement>;
  getTabState: (tab: Tab<T>) => TabState;
}

// ——————————————————————————————
// No‐actions variants: getItems(): T[]
// ——————————————————————————————

type UseAutoCompleteUngroupedSingleNoActions<T> = Omit<
  UseAutoCompleteReturnNoActions<T>,
  "getItems" | "getSelectedItem"
> & {
  getItems: () => T[];
  getSelectedItem: () => T | undefined;
};

type UseAutoCompleteUngroupedMultipleNoActions<T> = Omit<
  UseAutoCompleteReturnNoActions<T>,
  "getItems" | "getSelectedItem"
> & {
  getItems: () => T[];
  getSelectedItem: () => T[];
};

// grouped versions:
type UseAutoCompleteGroupedSingleNoActions<T> = Omit<
  UseAutoCompleteReturnNoActions<T>,
  "getItems" | "getSelectedItem"
> & {
  getItems: () => Group<T>[];
  getSelectedItem: () => T | undefined;
};

type UseAutoCompleteGroupedMultipleNoActions<T> = Omit<
  UseAutoCompleteReturnNoActions<T>,
  "getItems" | "getSelectedItem"
> & {
  getItems: () => Group<T>[];
  getSelectedItem: () => T[];
};

// shallow-equal utility so inline arrays don’t repeatedly trigger updates
function arraysShallowEqual<T>(a: T[], b: T[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// ——————————————————————————————
// With‐actions variants: getItems(): Array<T|ActionItem>
// ——————————————————————————————

type UseAutoCompleteUngroupedSingleWithActions<T> = Omit<
  UseAutoCompleteReturnWithActions<T>,
  "getItems" | "getSelectedItem"
> & {
  getItems: () => Array<T | ActionItem>;
  getSelectedItem: () => T | undefined;
};

type UseAutoCompleteUngroupedMultipleWithActions<T> = Omit<
  UseAutoCompleteReturnWithActions<T>,
  "getItems" | "getSelectedItem"
> & {
  getItems: () => Array<T | ActionItem>;
  getSelectedItem: () => T[];
};

// grouped versions:
type UseAutoCompleteGroupedSingleWithActions<T> = Omit<
  UseAutoCompleteReturnWithActions<T>,
  "getItems" | "getSelectedItem"
> & {
  getItems: () => Group<T>[];
  getSelectedItem: () => T | undefined;
};

type UseAutoCompleteGroupedMultipleWithActions<T> = Omit<
  UseAutoCompleteReturnWithActions<T>,
  "getItems" | "getSelectedItem"
> & {
  getItems: () => Group<T>[];
  getSelectedItem: () => T[];
};

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
  const listboxRef = useRef<HTMLUListElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
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

  const getTabListProps = useCallback(
    () => ({
      role: "tablist",
      "data-tablist": true,
    }),
    []
  );

  const getTabState = useCallback(
    (tab: Tab<T>): TabState => ({
      isSelected: tab.key === tabs[activeTabIndex].key,
      isDisabled: false,
      itemCount: rawItems.filter((item) =>
        tab.filter ? tab.filter(item) : true
      ).length,
    }),
    [activeTabIndex, rawItems, tabs]
  );

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

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveItem(null);
        setHighlightedIndex(null);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [setIsOpen, setActiveItem, setHighlightedIndex]);

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

  const handleClear = useCallback(() => {
    setInputValue("");
    if (mode === "single") {
      setSelectedValue(undefined);
    } else {
      setSelectedValuesState([]);
    }
    onClear?.();
    setActiveItem(null);
    setIsOpen(false);
  }, [
    mode,
    setInputValue,
    setSelectedValue,
    onClear,
    setActiveItem,
    setIsOpen,
  ]);

  const handleDisclosure = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
    } else if (allowsEmptyCollection || flattenedItems.length > 0) {
      setIsOpen(true);
    }
  }, [isOpen, setIsOpen, allowsEmptyCollection, flattenedItems.length]);

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

  // Automatically highlight when exactly one option remains
  useEffect(() => {
    // only run when there's exactly one item and it isn’t already active
    if (flattenedItems.length === 1 && activeItem !== flattenedItems[0]) {
      setActiveItem(flattenedItems[0] as T | ActionItem);
    }
  }, [flattenedItems, activeItem, setActiveItem]);

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

  const getTabProps = useCallback(
    (tab: Tab<T>, index: number) => ({
      role: "tab",
      id: `autocomplete-tab-${tab.key}`,
      "aria-selected": index === activeTabIndex || undefined,
      tabIndex: index === activeTabIndex ? 0 : -1,
      onClick: () => setActiveTabIndex(index),
      onKeyDown: handleKeyDown,
      ...tab.tabProps,
    }),
    [activeTabIndex, handleKeyDown]
  );

  const handleInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setInputValue(v);
      onInputValueChange?.(v);

      if (onInputValueChangeAsync) {
        const controller = new AbortController();
        try {
          await onInputValueChangeAsync({
            value: v,
            signal: controller.signal,
          });
        } catch (err) {
          // ignore only user‑aborted calls
          if (!(err instanceof Error && err.name === "AbortError")) {
            console.error(err);
          }
        }
      }
    },
    [setInputValue, onInputValueChange, onInputValueChangeAsync]
  );

  const getRootProps = useCallback(
    (): React.HTMLAttributes<HTMLDivElement> & {
      ref: React.Ref<HTMLDivElement>;
    } & { [key: `data-${string}`]: string | boolean | undefined } => ({
      ref: rootRef,
      role: "combobox",
      "aria-expanded": isOpen,
      "aria-haspopup": "listbox",
      "aria-controls": "autocomplete-listbox",
      "data-combobox": true,
      "data-expanded": isOpen ? true : false,
      "data-focused": isFocused ? true : undefined,
      "data-mode": mode,
      "data-has-selected":
        mode === "multiple"
          ? selectedValues().length > 0
            ? "true"
            : undefined
          : selectedValue
          ? "true"
          : undefined,
      "data-has-value": inputValue.trim() !== "" ? "true" : undefined,
    }),
    [
      rootRef,
      isOpen,
      isFocused,
      mode,
      selectedValue,
      selectedValues,
      inputValue,
    ]
  );

  const getListProps = useCallback(
    () => ({
      id: "autocomplete-listbox",
      role: "listbox",
      "aria-label": labelProp,
      ref: listboxRef,
      tabIndex: -1,
      "data-listbox": true,
      "data-state": isOpen ? "open" : "closed",
      "data-has-groups": groupingOptions.length ? "true" : undefined,
      "data-empty": flattenedItems.length === 0 ? "true" : undefined,
      "data-size": flattenedItems.length,
    }),
    [labelProp, isOpen, groupingOptions.length, flattenedItems]
  );

  const getInputProps = useCallback(
    (): React.InputHTMLAttributes<HTMLInputElement> & {
      [key: `data-${string}`]: string | boolean | undefined;
    } => ({
      id: "autocomplete-input",
      value: inputValue,
      onChange: handleInputChange,
      onKeyDown: handleKeyDown,
      onFocus: async () => {
        setIsFocused(true);
        if (onFilterAsyncRef.current) {
          await debouncedAsyncOperation(inputValue);
        }
        // only open if we have items or it's explicitly allowed
        if (allowsEmptyCollection || flattenedItems.length > 0) {
          setIsOpen(true);
          if (flattenedItems.length && !activeItem) {
            setActiveItem(flattenedItems[0]);
          }
        }
      },
      onBlur: async () => {
        setIsFocused(false);
        if (onBlurAsync) {
          const controller = new AbortController();
          try {
            await onBlurAsync({ value: inputValue, signal: controller.signal });
          } catch (err) {
            if (!(err instanceof Error && err.name === "AbortError")) {
              console.error(err);
            }
          }
        }
      },

      autoComplete: "off",
      // force this to the exact union member:
      "aria-autocomplete": "list" as const,
      "aria-controls": "autocomplete-listbox",
      "aria-activedescendant": activeItem
        ? `option-${flattenedItems.indexOf(activeItem)}`
        : undefined,
      "aria-description":
        tabs.length > 0
          ? "Use Up and Down arrows to navigate options, Left and Right arrows to switch tabs, Enter to select, Escape to close."
          : "Use Up and Down arrows to navigate options, Enter to select, Escape to close.",

      // now allowed by our index‑signature
      "data-input": true,
      "data-value": inputValue,
      "data-has-value": inputValue.trim() !== "" ? "true" : undefined,
      "data-autocomplete": "list",
    }),
    [
      inputValue,
      handleInputChange,
      handleKeyDown,
      activeItem,
      flattenedItems,
      tabs.length,
      allowsEmptyCollection,
      debouncedAsyncOperation,
      setIsOpen,
      setActiveItem,
      onBlurAsync,
    ]
  );

  const getClearProps =
    useCallback((): React.ButtonHTMLAttributes<HTMLButtonElement> & {
      [key: `data-${string}`]: string | boolean | undefined;
    } => {
      const disabled =
        inputValue === "" &&
        (mode === "single" ? !selectedValue : selectedValues().length === 0);
      return {
        type: "button",
        "aria-label": "Clear input",
        onClick: handleClear,
        disabled,
        "data-clear-button": true,
        "data-disabled": disabled ? "true" : undefined,
      };
    }, [handleClear, inputValue, mode, selectedValue, selectedValues]);

  const getDisclosureProps = useCallback(
    (): React.ButtonHTMLAttributes<HTMLButtonElement> & {
      [key: `data-${string}`]: string | boolean | undefined;
    } => ({
      type: "button",
      "aria-label": isOpen ? "Close options" : "Open options",
      onClick: handleDisclosure,
      "data-disclosure-button": true,
      "data-state": isOpen ? "open" : "closed",
    }),
    [isOpen, handleDisclosure]
  );

  const getLabelProps = useCallback(
    () => ({
      htmlFor: "autocomplete-input",
      className: labelSrOnly ? "sr-only" : "",
      "data-label": true,
    }),
    [labelSrOnly]
  );

  const getOptionProps = useCallback(
    (item: T | ActionItem) => {
      // if this is one of our “action” entries:
      if ((item as ActionItem).__isAction) {
        const action = item as ActionItem;
        return {
          role: "option",
          "data-action-item": true,
          "aria-label": action.label,
          tabIndex: 0,
          onClick: () => action.onAction(),
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              action.onAction();
            }
          },
          // visually you can style via [data-action-item]
        };
      }

      // otherwise, your existing item logic:
      const real = item as T;
      const index = flattenedItems.findIndex((i) => i === real);
      const disabled = isItemDisabled(real);
      const isItemActive = real === activeItem;
      const isItemSelected =
        mode === "multiple"
          ? selectedValues().includes(real)
          : real === selectedValue;
      const custom = isCustomValue(real);

      return {
        role: "option",
        "aria-selected": isItemSelected,
        "aria-posinset": index + 1,
        "aria-setsize": flattenedItems.length,
        "aria-disabled": disabled,
        id: `option-${index}`,
        "data-active": isItemActive ? "true" : undefined,
        "data-selected": isItemSelected ? "true" : undefined,
        "data-index": index,
        "data-custom": custom ? "true" : undefined,
        disabled,
        onClick: disabled ? undefined : () => handleSelect(real),
        "data-disabled": disabled ? "true" : undefined,
      };
    },
    [
      flattenedItems,
      isItemDisabled,
      activeItem,
      mode,
      selectedValues,
      selectedValue,
      isCustomValue,
      handleSelect,
    ]
  );

  const getOptionLinkProps = useCallback(
    (item: T): Record<string, unknown> & { role: "option" } => {
      const index = flattenedItems.findIndex((i) => i === item);
      const disabled = isItemDisabled(item);
      const isSelected =
        mode === "multiple"
          ? selectedValues().includes(item)
          : item === selectedValue;

      // user‑returned link value
      const linkResult = getOptionLink?.(item);
      // build base props: if string, treat as href; else spread object
      const linkProps: Record<string, unknown> =
        typeof linkResult === "string"
          ? { href: linkResult }
          : linkResult && typeof linkResult === "object"
          ? { ...linkResult }
          : {};

      return {
        role: "option",
        "aria-selected": isSelected,
        "aria-posinset": index + 1,
        "aria-setsize": flattenedItems.length,
        "aria-disabled": disabled || undefined,
        id: `option-${index}`,
        tabIndex: disabled ? -1 : 0,

        // spread whatever the consumer needs (href, to, params, etc)
        ...linkProps,

        onClick: !disabled
          ? (e: React.MouseEvent) => {
              // don't use handleSelect(item) for link
              e.stopPropagation();
            }
          : undefined,
      };
    },
    [
      flattenedItems,
      isItemDisabled,
      mode,
      selectedValues,
      selectedValue,
      getOptionLink,
    ]
  );

  const getOptionState = useCallback(
    (item: T): OptionState => ({
      isActive: item === activeItem,
      isDisabled: isItemDisabled(item),
      isAction: (item as ActionItem).__isAction ? true : false,
      isSelected:
        mode === "multiple"
          ? selectedValues().includes(item)
          : item === selectedValue,
    }),
    [activeItem, isItemDisabled, mode, selectedValues, selectedValue]
  );

  const getGroupProps = useCallback((group: Group<T>) => group.listProps, []);
  const getGroupLabelProps = useCallback(
    (group: Group<T>) => group.header.headingProps,
    []
  );

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
