import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useDebouncedValue } from "./use-debounced-value";

export type Placement = "top" | "bottom" | "left" | "right";
export type Mode = "single" | "multiple";

export interface GroupingOptions<T> {
  /** property name on item to group by */
  key: string;
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
  /** props to spread on the group's <ul> element */
  listProps: React.HTMLAttributes<HTMLUListElement>;
  header: {
    /** text to render as the group's heading */
    label: string;
    /** props to spread on the group's heading <span> */
    headingProps: React.HTMLAttributes<HTMLSpanElement>;
  };
}

export interface UseAutoCompleteOptions<T> {
  /** 'single' for one selection, 'multiple' for multiple */
  mode?: Mode;
  state?: {
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
  };
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
  onEmptyActionClick?: () => void;
  onSelectValue?: (value: T) => void;
  onCustomValueAsync?: (params: {
    value: string;
    signal: AbortSignal;
  }) => Promise<void>;
  /** called when the clear button is clicked */
  onClear?: () => void;

  /** return true for items that should be rendered and treated as disabled */
  isItemDisabled?: (item: T) => boolean;
}

export interface OptionState {
  isActive: boolean;
  isSelected: boolean;
}

export interface UseAutoCompleteReturn<T> {
  getItems: () => T[] | Group<T>[];
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
  getOptionProps: (item: T) => React.LiHTMLAttributes<HTMLLIElement>;
  getOptionState: (item: T) => OptionState;
  getGroupProps: (group: Group<T>) => React.HTMLAttributes<HTMLUListElement>;
  getGroupLabelProps: (
    group: Group<T>
  ) => React.HTMLAttributes<HTMLSpanElement>;
  hasSelectedItem: () => boolean;
  isOpen: () => boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCustomValue: (item: T) => boolean;
  /** get the index of the highlighted option */
  getHighlightedIndex: () => number | null;
  /** set the index of the highlighted option */
  setHighlightedIndex: (index: number | null) => void;
  getActiveItem: () => T | null;
  setActiveItem: (item: T | null) => void;
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

export function useAutoComplete<T>({
  mode: modeProp = "single",
  state = {},
  defaultOpen = false,
  labelSrOnly = false,
  asyncDebounceMs = 0,
  allowsCustomValue = false,
  onInputValueChange,
  onSelectValue,
  onCustomValueAsync,
  onInputValueChangeAsync,
  onBlurAsync,
  items: itemsProp = [],
  onFilterAsync,
  itemToString,
  onEmptyActionClick,
  onClear,
  isItemDisabled: isItemDisabledProp,
}: UseAutoCompleteOptions<T>): UseAutoCompleteReturn<T> {
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
      const k = String((item as any)[propKey] ?? "");
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
          "data-group-level": level,
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

  const grouped = groupingOptions.length ? createGroups(items) : [];

  const flattenGroups = (groupsList: Group<T>[]): T[] =>
    groupsList.reduce<T[]>(
      (acc, grp) =>
        grp.groups && grp.groups.length
          ? acc.concat(flattenGroups(grp.groups))
          : acc.concat(grp.items),
      []
    );

  const ungroupedItemsWithCustom: T[] = (() => {
    if (
      allowsCustomValue &&
      inputValue.trim() !== "" &&
      !items.some((it) => itemToStringFn(it) === inputValue)
    ) {
      return [...items, inputValue as unknown as T];
    }
    return items;
  })();

  const flattenedItems = groupingOptions.length
    ? flattenGroups(grouped)
    : ungroupedItemsWithCustom;

  const isItemDisabled = useCallback(
    (item: T) => isItemDisabledProp?.(item) ?? false,
    [isItemDisabledProp]
  );

  type NavState = { activeItem: T | null; highlightedIndex: number | null };
  type NavAction =
    | {
        type: "SET_ACTIVE_ITEM";
        payload: { item: T | null; index: number | null };
      }
    | {
        type: "SET_HIGHLIGHTED_INDEX";
        payload: { item: T | null; index: number | null };
      };

  // Reducer ensures both activeItem & highlightedIndex stay in sync
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

  // Derive final activeItem / highlightedIndex (respect external props if provided)
  const activeItem: T | null =
    activeItemProp !== undefined ? activeItemProp : navState.activeItem;
  const highlightedIndex: number | null =
    highlightedIndexProp !== undefined
      ? highlightedIndexProp
      : navState.highlightedIndex;

  // Wrappers that update both pieces via reducer + external setters
  const setActiveItem = useCallback(
    (item: T | null) => {
      const index =
        item !== null ? flattenedItems.findIndex((i) => i === item) : null;
      setActiveItemProp?.(item);
      setHighlightedIndexProp?.(index);
      dispatchNav({ type: "SET_ACTIVE_ITEM", payload: { item, index } });
    },
    [flattenedItems, setActiveItemProp, setHighlightedIndexProp]
  );

  const setHighlightedIndex = useCallback(
    (index: number | null) => {
      const item = index !== null ? flattenedItems[index] : null;
      setActiveItemProp?.(item);
      setHighlightedIndexProp?.(index);
      dispatchNav({ type: "SET_HIGHLIGHTED_INDEX", payload: { item, index } });
    },
    [flattenedItems, setActiveItemProp, setHighlightedIndexProp]
  );

  const [isFocused, setIsFocused] = useState(false);

  const itemToStringFn = useCallback(
    (item: T) => (itemToString ? itemToString(item) : String(item)),
    [itemToString]
  );

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
    // const disabled =
    //   inputValue === "" &&
    //   (mode === "single" ? !selectedValue : selectedValues.length === 0);
    setInputValue("");
    if (mode === "single") {
      setSelectedValue(undefined);
    } else {
      setSelectedValuesState([]);
    }
    onEmptyActionClick?.();
    onClear?.();
    setActiveItem(null);
    setIsOpen(false);
  }, [
    mode,
    setInputValue,
    setSelectedValue,
    onEmptyActionClick,
    onClear,
    setActiveItem,
    setIsOpen,
  ]);

  const handleDisclosure = useCallback(
    () => setIsOpen(!isOpen),
    [setIsOpen, isOpen]
  );

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
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      const { key } = event;
      const currentIndex = flattenedItems.findIndex((i) => i === activeItem);
      switch (key) {
        case "ArrowDown":
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            if (flattenedItems.length) setActiveItem(flattenedItems[0]);
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
            setIsOpen(true);
            if (flattenedItems.length)
              setActiveItem(flattenedItems[flattenedItems.length - 1]);
          } else {
            const prevIndex =
              currentIndex > 0 ? currentIndex - 1 : flattenedItems.length - 1;
            setActiveItem(flattenedItems[prevIndex]);
            document
              .getElementById(`option-${prevIndex}`)
              ?.scrollIntoView({ block: "nearest" });
          }
          break;
        case "Enter":
          event.preventDefault();
          if (activeItem) handleSelect(activeItem);
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
    [flattenedItems, activeItem, isOpen, setIsOpen, setActiveItem, handleSelect]
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
        setIsOpen(true);
        if (flattenedItems.length && !activeItem) {
          setActiveItem(flattenedItems[0]);
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

      // force this to the exact union member:
      "aria-autocomplete": "list" as const,
      "aria-controls": "autocomplete-listbox",
      "aria-activedescendant": activeItem
        ? `option-${flattenedItems.indexOf(activeItem)}`
        : undefined,

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
        (mode === "single" ? !selectedValue : selectedValues.length === 0);
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
    (item: T) => {
      const index = flattenedItems.findIndex((i) => i === item);
      const disabled = isItemDisabled(item);
      const isItemActive = item === activeItem;
      const isItemSelected =
        mode === "multiple"
          ? selectedValues().includes(item)
          : item === selectedValue;
      const custom = isCustomValue(item);

      return {
        role: "option",
        "aria-selected": isItemSelected,
        "aria-posinset": index + 1,
        "aria-setsize": flattenedItems.length,
        id: `option-${index}`,
        "data-active": isItemActive ? "true" : undefined,
        "data-selected": isItemSelected ? "true" : undefined,
        "data-index": index,
        "data-custom": custom ? "true" : undefined,
        "aria-disabled": disabled,
        disabled,
        onClick: disabled ? undefined : () => handleSelect(item),
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

  const getOptionState = useCallback(
    (item: T): OptionState => ({
      isActive: item === activeItem,
      isSelected:
        mode === "multiple"
          ? selectedValues.includes(item)
          : item === selectedValue,
    }),
    [activeItem, selectedValue, selectedValues, mode]
  );

  const getGroupProps = useCallback((group: Group<T>) => group.listProps, []);
  const getGroupLabelProps = useCallback(
    (group: Group<T>) => group.header.headingProps,
    []
  );

  return {
    getItems: () => {
      // mirror flattenedItems logic for rendering
      if (
        !groupingOptions.length &&
        allowsCustomValue &&
        inputValue.trim() !== "" &&
        !items.some((it) => itemToStringFn(it) === inputValue)
      ) {
        return [...items, inputValue as unknown as T];
      }
      return groupingOptions.length ? grouped : items;
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
  };
}
