import { useCallback, useEffect, useRef } from "react";

export function useAutocompleteRoot<T>({
  isOpen,
  isFocused,
  mode,
  selectedValue,
  selectedValues,
  inputValue,
  setIsOpen,
  setActiveItem,
  setHighlightedIndex,
}: {
  isOpen: boolean;
  isFocused: boolean;
  mode: "single" | "multiple";
  selectedValue?: T;
  selectedValues: T[];
  inputValue: string;
  setIsOpen: (isOpen: boolean) => void;
  setActiveItem: (item: T | null) => void;
  setHighlightedIndex: (index: number | null) => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const getRootProps = useCallback((): React.HTMLAttributes<HTMLDivElement> & {
    ref: React.Ref<HTMLDivElement>;
  } & { [key: `data-${string}`]: string | boolean | undefined } => {
    return {
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
          ? selectedValues.length > 0
            ? "true"
            : undefined
          : selectedValue
          ? "true"
          : undefined,
      "data-has-value": inputValue.trim() !== "" ? "true" : undefined,
    };
  }, [isOpen, isFocused, mode, selectedValue, selectedValues, inputValue]);

  // Close the listbox when clicking outside
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

  return { getRootProps };
}
