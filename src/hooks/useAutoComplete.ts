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
  /** Debounce delay (ms) for async filtering */
  asyncDebounceMs?: number;
  allowCustomValue?: boolean;
  /**
   * Called immediately on every keystroke with the current input value.
   * Use for side-effects (e.g. analytics, external state sync).
   */
  onInputValueChange?: (value: string) => void;

  /**
   * Called after debouncing (asyncDebounceMs) when filtering items.
   * Receives the searchTerm and an AbortSignal; should return a Promise
   * that resolves to the array of items to render.
   */
  onFilterAsync?: (params: {
    searchTerm: string;
    signal: AbortSignal;
  }) => Promise<T[]>;

  /**
   * Called immediately on every keystroke, returning a Promise<void>.
   * Use for async side-effects that don't directly drive the dropdown items.
   */
  onInputValueChangeAsync?: (params: {
    value: string;
    signal: AbortSignal;
  }) => Promise<void>;

  /**
   * Called when the input loses focus. Can be used for async validation or cleanup.
   */
  onBlurAsync?: (params: {
    value: string;
    signal: AbortSignal;
  }) => Promise<void>;

  /**
   * Called when the user clicks the "empty" action button (if enabled).
   */
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
  // keep a ref to the latest onFilterAsync
  const onFilterAsyncRef = useRef(onFilterAsync);
  useEffect(() => {
    onFilterAsyncRef.current = onFilterAsync;
  }, [onFilterAsync]);

  // now only created once
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

  // debounce the raw inputValue
  const [debouncedInputValue] = useDebouncedValue(inputValue, asyncDebounceMs);

  // now only fires when the debounced value actually changes
  useEffect(() => {
    if (onFilterAsyncRef.current) {
      debouncedAsyncOperation(debouncedInputValue);
    }
  }, [debouncedInputValue, debouncedAsyncOperation]);

  // close on outside click
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
            if (items.length) setActiveItem(items[0]);
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
            if (items.length) setActiveItem(items[items.length - 1]);
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

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setInputValue(v);
      onInputValueChange?.(v);
    },
    [setInputValue, onInputValueChange]
  );

  const getRootProps = useCallback(
    (): React.HTMLAttributes<HTMLDivElement> & {
      ref: React.Ref<HTMLDivElement>;
    } => ({
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
    (): React.HTMLAttributes<HTMLUListElement> & {
      ref: React.Ref<HTMLUListElement>;
    } => ({
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
    (): React.InputHTMLAttributes<HTMLInputElement> => ({
      id: "autocomplete-input",
      value: inputValue,
      onChange: handleInputChange,
      onKeyDown: handleKeyDown,
      onFocus: () => {
        setIsFocused(true);
        setIsOpen(true);
        if (!items.length && onFilterAsync) debouncedAsyncOperation(inputValue);
        if (items.length && !activeItem) setActiveItem(items[0]);
      },
      onBlur: () => setIsFocused(false),
      // narrow to the literal union React expects
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
      onFilterAsync,
      debouncedAsyncOperation,
    ]
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
    getSelectedItem: () => selectedValue,
    hasActiveItem: () => !!activeItem,
    isFocused: () => isFocused,
    getRootProps,
    getListProps,
    getLabelProps,
    getInputProps,
    getClearProps: () => ({}),
    getDisclosureProps: () => ({}),
    getOptionProps,
    getOptionState,
    getGroupProps: () => ({}),
    getGroupLabelProps: () => ({}),
  };
}
