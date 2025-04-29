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
  // State Management
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
    label: string;
  };

  // Configuration
  defaultOpen?: boolean;
  labelSrOnly?: boolean;
  placement?: Placement;
  asyncDebounceMs?: number;
  allowCustomValue?: boolean;

  // Event Handlers
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

export interface UseAutoCompleteReturn<T> {
  // State Accessors
  getItems: () => T[];
  getSelectedItem: () => T | undefined;
  hasActiveItem: () => boolean;
  isFocused: () => boolean;

  // Component Props
  getRootProps: () => React.HTMLAttributes<HTMLDivElement>;
  getLabelProps: () => React.LabelHTMLAttributes<HTMLLabelElement>;
  getInputProps: () => React.InputHTMLAttributes<HTMLInputElement>;
  getClearProps: () => React.ButtonHTMLAttributes<HTMLButtonElement>;
  getDisclosureProps: () => React.ButtonHTMLAttributes<HTMLButtonElement>;
  getPopoverProps: () => React.HTMLAttributes<HTMLDivElement>;
  getListProps: () => React.HTMLAttributes<HTMLUListElement>;
  getOptionProps: (item: T) => React.LiHTMLAttributes<HTMLLIElement>;
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
  onEmptyActionClick,
}: UseAutoCompleteOptions<T>): UseAutoCompleteReturn<T> {
  const {
    inputValue,
    setInputValue,
    selectedValue,
    setSelectedValue,
    isOpen,
    setIsOpen,
    grouping,
    defaultValue,
    activeItem,
    label,
  } = state;

  const [items, setItems] = useState<T[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize with default value
  useEffect(() => {
    if (defaultValue) {
      setSelectedValue(defaultValue);
    }
  }, [defaultValue, setSelectedValue]);

  // Handle async operations
  const debouncedAsyncOperation = useCallback(
    async (value: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        if (onFilterAsync) {
          const filteredItems = await onFilterAsync({
            searchTerm: value,
            signal: abortControllerRef.current.signal,
          });
          setItems(filteredItems);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Error in async operation:", error);
      }
    },
    [onFilterAsync]
  );

  // Handle input changes
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setInputValue(newValue);
      onInputValueChange?.(newValue);

      if (onInputValueChangeAsync) {
        debouncedAsyncOperation(newValue);
      }
    },
    [
      setInputValue,
      onInputValueChange,
      onInputValueChangeAsync,
      debouncedAsyncOperation,
    ]
  );

  // Handle selection
  const handleSelect = useCallback(
    (item: T) => {
      setSelectedValue(item);
      onSelectValue?.(item);
      setIsOpen(false);
    },
    [setSelectedValue, onSelectValue, setIsOpen]
  );

  // Component props
  const getRootProps = useCallback(
    () => ({
      role: "combobox",
      "aria-expanded": isOpen,
      "aria-haspopup": "listbox" as const,
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
      onFocus: () => {
        setIsFocused(true);
        setIsOpen(true);
      },
      onBlur: () => {
        setIsFocused(false);
        if (onBlurAsync) {
          debouncedAsyncOperation(inputValue);
        }
      },
      "aria-autocomplete": "list" as const,
      "aria-controls": "autocomplete-listbox",
      "aria-activedescendant": activeItem ? "option-" + activeItem : undefined,
    }),
    [
      inputValue,
      handleInputChange,
      setIsFocused,
      setIsOpen,
      onBlurAsync,
      debouncedAsyncOperation,
      activeItem,
    ]
  );

  const getListProps = useCallback(
    () => ({
      id: "autocomplete-listbox",
      role: "listbox",
      "aria-label": label,
    }),
    [label]
  );

  const getOptionProps = useCallback(
    (item: T) => ({
      role: "option",
      "aria-selected": item === selectedValue,
      onClick: () => handleSelect(item),
    }),
    [selectedValue, handleSelect]
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
