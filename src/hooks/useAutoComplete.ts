import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "./use-debounced-value";

export type Placement = "top" | "bottom" | "left" | "right";

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
  /** 'single' for one selection, 'multiselect' for multiple */
  mode?: "single" | "multiselect";
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
    label?: string;
  };
  defaultOpen?: boolean;
  labelSrOnly?: boolean;
  placement?: Placement;
  asyncDebounceMs?: number;
  allowCustomValue?: boolean;
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
  };
  getListProps: () => React.HTMLAttributes<HTMLUListElement> & {
    ref: React.Ref<HTMLUListElement>;
  };
  getLabelProps: () => React.LabelHTMLAttributes<HTMLLabelElement>;
  getInputProps: () => React.InputHTMLAttributes<HTMLInputElement>;
  getClearProps: () => React.ButtonHTMLAttributes<HTMLButtonElement>;
  getDisclosureProps: () => React.ButtonHTMLAttributes<HTMLButtonElement>;
  getOptionProps: (item: T) => React.LiHTMLAttributes<HTMLLIElement>;
  getOptionState: (item: T) => OptionState;
  getGroupProps: (group: Group<T>) => React.HTMLAttributes<HTMLUListElement>;
  getGroupLabelProps: (
    group: Group<T>
  ) => React.HTMLAttributes<HTMLSpanElement>;
  hasSelectedItem: () => boolean;
  isOpen: () => boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function useAutoComplete<T>({
  mode: modeProp = "single",
  state = {},
  defaultOpen = false,
  labelSrOnly = false,
  placement = "bottom",
  asyncDebounceMs = 0,
  allowCustomValue = false,
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
  const selectedValues = mode === "multiselect" ? selectedValuesState : [];
  const setSelectedValue = setSelectedValueProp ?? setSelectedValueState;

  const [isOpenState, setIsOpenState] = useState<boolean>(defaultOpen);
  const isOpen = isOpenProp !== undefined ? isOpenProp : isOpenState;
  const setIsOpen = setIsOpenProp ?? setIsOpenState;

  const [activeItemState, setActiveItemState] = useState<T | null>(null);
  const activeItem =
    activeItemProp !== undefined ? activeItemProp : activeItemState;
  const setActiveItem = setActiveItemProp ?? setActiveItemState;

  const itemToStringFn = useCallback(
    (item: T) => (itemToString ? itemToString(item) : String(item)),
    [itemToString]
  );

  const [items, setItems] = useState<T[]>(itemsProp);
  const [isFocused, setIsFocused] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const listboxRef = useRef<HTMLUListElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const prevItemsPropRef = useRef<T[]>(itemsProp);

  useEffect(() => {
    if (prevItemsPropRef.current !== itemsProp) {
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
          signal: abortControllerRef.current.signal,
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
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [setIsOpen, setActiveItem]);

  const handleSelect = useCallback(
    (item: T) => {
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
      mode,
      setSelectedValue,
      setInputValue,
      onSelectValue,
      setIsOpen,
      itemToStringFn,
    ]
  );

  const handleClear = useCallback(() => {
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
    () => setIsOpen((prev) => !prev),
    [setIsOpen]
  );

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
      const grp: Group<T> = {
        key: groupKey,
        items: groupItems,
        label: propLabel,
        listProps: { role: "group", "aria-label": propLabel },
        header: { label: groupKey, headingProps: { role: "presentation" } },
      };
      const sub = createGroups(groupItems, level + 1);
      if (sub.length) grp.groups = sub;
      return grp;
    });
  };

  const grouped: Group<T>[] = groupingOptions.length ? createGroups(items) : [];

  const flattenGroups = (groupsList: Group<T>[]): T[] =>
    groupsList.reduce<T[]>(
      (acc, grp) =>
        grp.groups && grp.groups.length
          ? acc.concat(flattenGroups(grp.groups))
          : acc.concat(grp.items),
      []
    );
  const flattenedItems = groupingOptions.length
    ? flattenGroups(grouped)
    : items;

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
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setInputValue(v);
      onInputValueChange?.(v);
    },
    [setInputValue, onInputValueChange]
  );

  const getRootProps = useCallback(
    () => ({
      ref: rootRef,
      role: "combobox",
      "aria-expanded": isOpen,
      "aria-haspopup": "listbox",
      "aria-controls": "autocomplete-listbox",
      "data-combobox": true,
    }),
    [isOpen]
  );

  const getListProps = useCallback(
    () => ({
      id: "autocomplete-listbox",
      role: "listbox",
      "aria-label": labelProp,
      ref: listboxRef,
      tabIndex: -1,
      "data-listbox": true,
    }),
    [labelProp]
  );

  const getInputProps = useCallback(
    () => ({
      id: "autocomplete-input",
      value: inputValue,
      onChange: handleInputChange,
      onKeyDown: handleKeyDown,
      onFocus: async () => {
        setIsFocused(true);
        if (onFilterAsyncRef.current) await debouncedAsyncOperation(inputValue);
        setIsOpen(true);
        if (flattenedItems.length && !activeItem)
          setActiveItem(flattenedItems[0]);
      },
      onBlur: () => setIsFocused(false),
      "aria-autocomplete": "list",
      "aria-controls": "autocomplete-listbox",
      "aria-activedescendant": activeItem
        ? `option-${flattenedItems.indexOf(activeItem)}`
        : undefined,
      "data-input": true,
    }),
    [
      inputValue,
      handleInputChange,
      handleKeyDown,
      flattenedItems,
      activeItem,
      debouncedAsyncOperation,
      setIsOpen,
      setActiveItem,
    ]
  );

  const getClearProps = useCallback(
    () => ({
      type: "button",
      "aria-label": "Clear input",
      onClick: handleClear,
      disabled:
        inputValue === "" &&
        (mode === "single" ? !selectedValue : selectedValues.length === 0),
      "data-clear-button": true,
    }),
    [handleClear, inputValue, mode, selectedValue, selectedValues]
  );

  const getDisclosureProps = useCallback(
    () => ({
      type: "button",
      "aria-label": isOpen ? "Close options" : "Open options",
      onClick: handleDisclosure,
      "data-disclosure-button": true,
    }),
    [handleDisclosure, isOpen]
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
      const isItemActive = item === activeItem;
      const isItemSelected =
        mode === "multiselect"
          ? selectedValues.includes(item)
          : item === selectedValue;
      return {
        role: "option",
        "aria-selected": isItemSelected,
        "aria-posinset": index + 1,
        "aria-setsize": flattenedItems.length,
        id: `option-${index}`,
        onClick: () => handleSelect(item),
        "data-active": isItemActive || undefined,
        "data-selected": isItemSelected || undefined,
      };
    },
    [
      selectedValue,
      selectedValues,
      flattenedItems,
      activeItem,
      handleSelect,
      mode,
    ]
  );

  const getOptionState = useCallback(
    (item: T): OptionState => ({
      isActive: item === activeItem,
      isSelected:
        mode === "multiselect"
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
    getItems: () => (groupingOptions.length ? grouped : items),
    getSelectedItem: () =>
      mode === "multiselect" ? selectedValues : selectedValue,
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
      mode === "multiselect" ? selectedValues.length > 0 : !!selectedValue,
    isOpen: () => isOpen,
    setIsOpen,
  };
}
