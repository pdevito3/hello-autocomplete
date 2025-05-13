import React from "react";

export interface UseClearButtonOptions<T> {
  /** current input text */
  inputValue: string;
  /** single‑select value (if mode = single) */
  selectedValue?: T;
  /** multi‑select values (if mode = multiple) */
  selectedValues: T[];
  /** 'single' or 'multiple' */
  mode: "single" | "multiple";
  /** clear any external side‑effects */
  onClear?: () => void;
  /** reset the input text */
  setInputValue(value: string): void;
  /** reset the single‑select value */
  setSelectedValue?(value: T | undefined): void;
  /** reset the multi‑select values */
  setSelectedValues?(values: T[]): void;
  /** clear any active/highlighted item */
  setActiveItem(item: T | null): void;
  /** close the listbox */
  setIsOpen(open: boolean): void;
}

export function useClearButton<T>(opts: UseClearButtonOptions<T>) {
  const handleClear = React.useCallback(() => {
    opts.setInputValue("");
    if (opts.mode === "single") {
      opts.setSelectedValue?.(undefined);
    } else {
      opts.setSelectedValues?.([]);
    }
    opts.onClear?.();
    opts.setActiveItem(null);
    opts.setIsOpen(false);
  }, [opts]);

  const getClearProps =
    React.useCallback((): React.ButtonHTMLAttributes<HTMLButtonElement> & {
      [key: `data-${string}`]: string | boolean | undefined;
    } => {
      const disabled =
        opts.inputValue === "" &&
        (opts.mode === "single"
          ? !opts.selectedValue
          : opts.selectedValues.length === 0);
      return {
        type: "button",
        "aria-label": "Clear input",
        onClick: handleClear,
        disabled,
        "data-clear-button": true,
        "data-disabled": disabled ? "true" : undefined,
      };
    }, [
      opts.inputValue,
      opts.mode,
      opts.selectedValue,
      opts.selectedValues,
      handleClear,
    ]);

  return { getClearProps, handleClear };
}
