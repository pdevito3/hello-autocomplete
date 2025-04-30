import { useCallback, useEffect, useRef, useState } from "react";

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
  onInputValueChange?: (value: string) => void;
  onSelectValue?: (value: T) => void;
  onCustomValueAsync?: (params: {
    value: string;
    signal: AbortSignal;
  }) => Promise<void>;
  onInputValueChangeAsync?: (params: {
    value: string;
    signal: AbortSignal;
  }) => Promise<void>;
  onBlurAsync?: (params: {
    value: string;
    signal: AbortSignal;
  }) => Promise<void>;
  onFilterAsync?: (params: {
    searchTerm: string;
    signal: AbortSignal;
  }) => Promise<T[]>;
  onEmptyActionClick?: () => void;
}

// Notice the updated return type for getOptionProps
export interface UseAutoCompleteReturn<T> {
  getItems: () => T[];
  getSelectedItem: () => T | undefined;
  hasActiveItem: () => boolean;
  isFocused: () => boolean;
  getRootProps: () => React.HTMLAttributes<HTMLDivElement>;
  getLabelProps: () => React.LabelHTMLAttributes<HTMLLabelElement>;
  getInputProps: () => React.InputHTMLAttributes<HTMLInputElement>;
  getClearProps: () => React.ButtonHTMLAttributes<HTMLButtonElement>;
  getDisclosureProps: () => React.ButtonHTMLAttributes<HTMLButtonElement>;
  getPopoverProps: () => React.HTMLAttributes<HTMLDivElement>;
  getListProps: () => React.HTMLAttributes<HTMLUListElement>;
  // Now includes `isActive` on the returned props
  getOptionProps: (
    item: T
  ) => React.LiHTMLAttributes<HTMLLIElement> & { isActive: boolean };
  getGroupProps: (group: Group<T>) => React.HTMLAttributes<HTMLDivElement>;
  getGroupLabelProps: (
    group: Group<T>
  ) => React.HTMLAttributes<HTMLSpanElement>;
}

export function useAutoComplete<T>({
  state,
  defaultOpen = false,
  labelSrOnly = false,
  placement = "bottom",
  asyncDebounceMs = 300,
  allowCustomValue = false,
  onInputValueChange,
  onSelectValue,
  onCustomValueAsync,
  onInputValueChangeAsync,
  onBlurAsync,
  onFilterAsync,
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
  } = state;

  const [items, setItems] = useState<T[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const listboxRef = useRef<HTMLUListElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
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

  // Handle default value
  useEffect(() => {
    if (state.defaultValue) {
      setSelectedValue(state.defaultValue);
    }
  }, [state.defaultValue, setSelectedValue]);

  const handleSelect = useCallback(
    (item: T) => {
      setSelectedValue(item);
      onSelectValue?.(item);
      setIsOpen(false);
    },
    [setSelectedValue, onSelectValue, setIsOpen]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      const { key } = event;
      const currentIndex = items.findIndex((i) => i === activeItem);
      switch (key) {
        case "ArrowDown":
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            if (items.length > 0) setActiveItem(items[0]);
          } else {
            const next = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            setActiveItem(items[next]);
            document
              .getElementById(`option-${next}`)
              ?.scrollIntoView({ block: "nearest" });
          }
          break;
        case "ArrowUp":
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            if (items.length > 0) setActiveItem(items[items.length - 1]);
          } else {
            const prev = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            setActiveItem(items[prev]);
            document
              .getElementById(`option-${prev}`)
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
    [items, activeItem, isOpen, setIsOpen, setActiveItem, handleSelect]
  );

  const debouncedAsyncOperation = useCallback(
    async (value: string) => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      try {
        if (onFilterAsync) {
          const results = await onFilterAsync({
            searchTerm: value,
            signal: abortControllerRef.current.signal,
          });
          setItems(results);
        }
      } catch (err) {
        if (!(err instanceof Error && err.name === "AbortError"))
          console.error(err);
      }
    },
    [onFilterAsync]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setInputValue(v);
      onInputValueChange?.(v);
      if (onFilterAsync) debouncedAsyncOperation(v);
    },
    [setInputValue, onInputValueChange, onFilterAsync, debouncedAsyncOperation]
  );

  const getRootProps = useCallback(
    () => ({
      ref: rootRef,
      role: "combobox",
      "aria-expanded": isOpen,
      "aria-haspopup": "listbox",
      "aria-controls": "autocomplete-listbox",
    }),
    [isOpen]
  );

  const getLabelProps = useCallback(
    () => ({
      htmlFor: "autocomplete-input",
      className: labelSrOnly ? "sr-only" : "",
    }),
    [labelSrOnly]
  );

  const getInputProps = useCallback(
    () => ({
      id: "autocomplete-input",
      value: inputValue,
      onChange: handleInputChange,
      onKeyDown: handleKeyDown,
      onFocus: () => {
        setIsFocused(true);
        setIsOpen(true);
        if (items.length === 0 && onFilterAsync)
          debouncedAsyncOperation(inputValue);
        if (items.length > 0 && !activeItem) setActiveItem(items[0]);
      },
      onBlur: () => setIsFocused(false),
      "aria-autocomplete": "list",
      "aria-controls": "autocomplete-listbox",
      "aria-activedescendant": activeItem
        ? `option-${items.indexOf(activeItem)}`
        : undefined,
    }),
    [
      inputValue,
      handleInputChange,
      handleKeyDown,
      items,
      activeItem,
      onFilterAsync,
      debouncedAsyncOperation,
    ]
  );

  const getListProps = useCallback(
    () => ({
      id: "autocomplete-listbox",
      role: "listbox",
      "aria-label": label,
      ref: listboxRef,
      tabIndex: -1,
    }),
    [label]
  );

  const getOptionProps = useCallback(
    (item: T) => {
      const index = items.indexOf(item);
      const isItemActive = item === activeItem;
      return {
        role: "option",
        "aria-selected": item === selectedValue,
        "aria-posinset": index + 1,
        "aria-setsize": items.length,
        id: `option-${index}`,
        onClick: () => handleSelect(item),
        className: isItemActive ? "bg-gray-100" : "",
        "data-active": isItemActive ? true : undefined,
        isActive: isItemActive,
      };
    },
    [selectedValue, items, activeItem, handleSelect]
  );

  return {
    getItems: () => items,
    getSelectedItem: () => selectedValue,
    hasActiveItem: () => !!activeItem,
    isFocused: () => isFocused,
    getRootProps,
    getLabelProps,
    getInputProps,
    getClearProps: () => ({}),
    getDisclosureProps: () => ({}),
    getPopoverProps: () => ({}),
    getListProps,
    getOptionProps,
    getGroupProps: () => ({}),
    getGroupLabelProps: () => ({}),
  };
}
