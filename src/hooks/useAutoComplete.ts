import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "./use-debounced-value";

export type Placement = "top" | "bottom" | "left" | "right";

export interface GroupingOptions<T> {
  key: string;
  items: T[];
  label: string;
}

export interface Group<T> {
  key: string;
  items: T[];
  label: string;
  listProps: React.HTMLAttributes<HTMLUListElement>;
  header: {
    label: string;
    headingProps: React.HTMLAttributes<HTMLSpanElement>;
  };
}

export interface UseAutoCompleteOptions<T> {
  state: {
    inputValue: string;
    setInputValue: (value: string) => void;
    selectedValue: T | undefined;
    setSelectedValue: (value: T | undefined) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    grouping?: GroupingOptions<T>;
    defaultValue?: T;
    activeItem: T | null;
    setActiveItem: (item: T | null) => void;
    label: string;
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
}

export interface OptionState {
  isActive: boolean;
  isSelected: boolean;
}

export interface UseAutoCompleteReturn<T> {
  getItems: () => T[];
  getSelectedItem: () => T | undefined;
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
  getGroupProps: (group: Group<T>) => React.HTMLAttributes<HTMLDivElement>;
  getGroupLabelProps: (
    group: Group<T>
  ) => React.HTMLAttributes<HTMLSpanElement>;
  hasSelectedItem: () => boolean;
}

export function useAutoComplete<T>({
  state,
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
}: UseAutoCompleteOptions<T>): UseAutoCompleteReturn<T> {
  const {
    inputValue,
    setInputValue,
    selectedValue,
    setSelectedValue,
    isOpen,
    setIsOpen,
    activeItem,
    setActiveItem,
    label,
    defaultValue,
  } = state;

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
    if (defaultValue) {
      setSelectedValue(defaultValue);
      setInputValue(itemToStringFn(defaultValue));
    }
  }, [defaultValue, setSelectedValue, setInputValue, itemToStringFn]);

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
      setSelectedValue(item);
      setInputValue(itemToStringFn(item));
      onSelectValue?.(item);
      setIsOpen(false);
    },
    [setSelectedValue, setInputValue, onSelectValue, setIsOpen, itemToStringFn]
  );

  const handleClear = useCallback(() => {
    setInputValue("");
    setSelectedValue(undefined);
    onEmptyActionClick?.();
    setActiveItem(null);
    setIsOpen(false);
  }, [
    setInputValue,
    setSelectedValue,
    onEmptyActionClick,
    setActiveItem,
    setIsOpen,
  ]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      const { key } = event;
      const currentIndex = items.findIndex((i) => i === activeItem);
      switch (
        key
        // ... existing navigation logic ...
      ) {
      }
    },
    [items, activeItem, isOpen, setIsOpen, setActiveItem, handleSelect]
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
      "aria-label": label,
      ref: listboxRef,
      tabIndex: -1,
      "data-listbox": true,
    }),
    [label]
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
        if (items.length && !activeItem) setActiveItem(items[0]);
      },
      onBlur: () => setIsFocused(false),
      "aria-autocomplete": "list",
      "aria-controls": "autocomplete-listbox",
      "aria-activedescendant": activeItem
        ? `option-${items.indexOf(activeItem)}`
        : undefined,
      "data-input": true,
    }),
    [
      inputValue,
      handleInputChange,
      handleKeyDown,
      items,
      activeItem,
      debouncedAsyncOperation,
    ]
  );

  const getClearProps = useCallback(
    () => ({
      type: "button",
      "aria-label": "Clear input",
      onClick: handleClear,
      disabled: inputValue === "",
      "data-clear-button": true,
    }),
    [handleClear, inputValue]
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
      const index = items.indexOf(item);
      const isItemActive = item === activeItem;
      const isItemSelected = item === selectedValue;
      return {
        role: "option",
        "aria-selected": isItemSelected,
        "aria-posinset": index + 1,
        "aria-setsize": items.length,
        id: `option-${index}`,
        onClick: () => handleSelect(item),
        "data-active": isItemActive || undefined,
        "data-selected": isItemSelected || undefined,
      };
    },
    [selectedValue, items, activeItem, handleSelect]
  );

  const getOptionState = useCallback(
    (item: T): OptionState => ({
      isActive: item === activeItem,
      isSelected: item === selectedValue,
    }),
    [activeItem, selectedValue]
  );

  return {
    getItems: () => items,
    hasSelectedItem: () => !!selectedValue,
    getSelectedItem: () => selectedValue,
    hasActiveItem: () => !!activeItem,
    isFocused: () => isFocused,
    getRootProps,
    getListProps,
    getLabelProps,
    getInputProps,
    getClearProps,
    getDisclosureProps: () => ({}),
    getOptionProps,
    getOptionState,
    getGroupProps: () => ({}),
    getGroupLabelProps: () => ({}),
  };
}
