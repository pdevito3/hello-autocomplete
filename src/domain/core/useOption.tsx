import React, { useCallback } from "react";
import type { ActionItem, Mode, OptionState } from "../types";

export interface UseOptionOptions<T> {
  /** the full, flattened list (including any ActionItem entries) */
  items: Array<T | ActionItem>;
  /** the currently active/highlighted entry */
  activeItem: T | ActionItem | null;
  /** single‑select value */
  selectedValue?: T;
  /** multi‑select values */
  selectedValues?: T[];
  /** pick up disabled state for real items */
  isItemDisabled(item: T): boolean;
  /** detect if a real item is the “custom value” */
  isCustomValue(item: T): boolean;
  /** callback when a real item is chosen */
  onSelect(item: T): void;
  /** the mode of the autocomplete */
  mode: Mode;
  flattenedItems: Array<T | ActionItem>;
  getOptionLink?: (
    item: T
  ) => string | Partial<Record<string, unknown>> | undefined;
}

export function useOption<T>(opts: UseOptionOptions<T>) {
  const getOptionProps = useCallback(
    (item: T | ActionItem) => {
      // --- action entries ---
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
        };
      }

      // --- listbox entries ---
      const real = item as T;
      const index = opts.items.findIndex((i) => i === item);
      const disabled = opts.isItemDisabled(real);
      const isActive = item === opts.activeItem;
      const isSelected =
        opts.mode === "multiple"
          ? Boolean(opts.selectedValues?.includes(real))
          : real === opts.selectedValue;
      const custom = opts.isCustomValue(real);

      return {
        role: "option",
        id: `option-${index}`,
        "aria-posinset": index + 1,
        "aria-setsize": opts.items.length,
        "aria-selected": isSelected,
        "aria-disabled": disabled,
        "data-active": isActive ? "true" : undefined,
        "data-selected": isSelected ? "true" : undefined,
        "data-index": index,
        "data-custom": custom ? "true" : undefined,
        disabled,
        onClick: disabled ? undefined : () => opts.onSelect(real),
        "data-disabled": disabled ? "true" : undefined,
      };
    },
    [opts]
  );

  const getOptionState = useCallback(
    (item: T | ActionItem): OptionState => {
      // always treat actions as their own state
      if ((item as ActionItem).__isAction) {
        return {
          isActive: false,
          isDisabled: false,
          isSelected: false,
          isAction: true,
        };
      }

      const real = item as T;
      const disabled = opts.isItemDisabled(real);
      const selected =
        opts.mode === "multiple"
          ? Boolean(opts.selectedValues?.includes(real))
          : real === opts.selectedValue;

      return {
        isActive: item === opts.activeItem,
        isDisabled: disabled,
        isSelected: selected,
        isAction: false,
      };
    },
    [opts]
  );

  const getOptionLinkProps = useCallback(
    (item: T): Record<string, unknown> & { role: "option" } => {
      const index = opts.flattenedItems.findIndex((i) => i === item);
      const disabled = opts.isItemDisabled(item);
      const isSelected =
        opts.mode === "multiple"
          ? opts.selectedValues?.includes(item) || false
          : item === opts.selectedValue;

      // user‑returned link value
      const linkResult = opts.getOptionLink?.(item);
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
        "aria-setsize": opts.flattenedItems.length,
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
    [opts]
  );

  return { getOptionProps, getOptionState, getOptionLinkProps };
}
