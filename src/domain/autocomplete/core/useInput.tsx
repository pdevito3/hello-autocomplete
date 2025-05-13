import React, { useCallback } from "react";

export interface UseInputOptions<T> {
  /** Current input text */
  inputValue: string;
  /** Called on each keystroke */
  handleInputChange(e: React.ChangeEvent<HTMLInputElement>): void;
  /** Centralized key‑down handler */
  handleKeyDown(e: React.KeyboardEvent<HTMLElement>): void;
  /** Called when the input gains focus */
  onFocus(): Promise<void>;
  /** Called when the input loses focus */
  onBlur(): Promise<void>;
  /** Currently active (highlighted) item, if any */
  activeItem: T | null;
  /** Full flattened list of items (including any ActionItem) */
  flattenedItems: Array<T>;
  /** Number of tabs configured */
  tabsCount: number;
  /** Whether empty collections may open the menu */
  allowsEmptyCollection: boolean;
  /** Set the open/closed state of the listbox */
  setIsOpen(open: boolean): void;
  /** Move focus to a particular item */
  setActiveItem(item: T | null): void;
  /** Ref to the latest async filter function */
  onFilterAsyncRef: React.MutableRefObject<
    | ((params: { searchTerm: string; signal: AbortSignal }) => Promise<T[]>)
    | undefined
  >;
  /** Debounced call into async filter */
  debouncedAsyncOperation(value: string): Promise<void>;
  /** Optional async blur hook */
  onBlurAsync?: (params: {
    value: string;
    signal: AbortSignal;
  }) => Promise<void>;

  onInputValueChangeAsync?: (params: {
    value: string;
    signal: AbortSignal;
  }) => Promise<void>;
  onInputValueChange?: (value: string) => void;
  setInputValue(value: string): void;
}

export function useInput<T>(opts: UseInputOptions<T>) {
  const getInputProps = React.useCallback(
    (): React.InputHTMLAttributes<HTMLInputElement> & {
      [key: `data-${string}`]: string | boolean | undefined;
    } => ({
      id: "autocomplete-input",
      value: opts.inputValue,
      onChange: opts.handleInputChange,
      onKeyDown: opts.handleKeyDown,
      onFocus: async () => {
        await opts.onFocus();
        if (opts.onFilterAsyncRef.current) {
          await opts.debouncedAsyncOperation(opts.inputValue);
        }
        if (opts.allowsEmptyCollection || opts.flattenedItems.length > 0) {
          opts.setIsOpen(true);
          if (opts.flattenedItems.length && !opts.activeItem) {
            opts.setActiveItem(opts.flattenedItems[0]);
          }
        }
      },
      onBlur: async () => {
        await opts.onBlur();
        if (opts.onBlurAsync) {
          const controller = new AbortController();
          try {
            await opts.onBlurAsync({
              value: opts.inputValue,
              signal: controller.signal,
            });
          } catch (err) {
            if (!(err instanceof Error && err.name === "AbortError")) {
              console.error(err);
            }
          }
        }
      },
      autoComplete: "off",
      "aria-autocomplete": "list",
      "aria-controls": "autocomplete-listbox",
      "aria-activedescendant":
        opts.activeItem != null
          ? `option-${opts.flattenedItems.indexOf(opts.activeItem)}`
          : undefined,
      "aria-description":
        opts.tabsCount > 0
          ? "Use Up and Down arrows to navigate options, Left and Right arrows to switch tabs, Enter to select, Escape to close."
          : "Use Up and Down arrows to navigate options, Enter to select, Escape to close.",
      "data-input": true,
      "data-value": opts.inputValue,
      "data-has-value": opts.inputValue.trim() !== "" ? "true" : undefined,
      "data-autocomplete": "list",
    }),
    [opts]
  );

  const handleInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      opts.setInputValue(v);
      opts.onInputValueChange?.(v);

      if (opts.onInputValueChangeAsync) {
        const controller = new AbortController();
        try {
          await opts.onInputValueChangeAsync({
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
    [opts]
  );

  return { getInputProps, handleInputChange };
}
