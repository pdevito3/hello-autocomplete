import React, { useCallback, useEffect } from "react";
import type { ActionItem, Mode, OptionState } from "../types";

export function useOption<T>({
  items,
  activeItem,
  selectedValue,
  selectedValues,
  isItemDisabled,
  isCustomValue,
  onSelect,
  mode,
  flattenedItems,
  getOptionLink,
  setActiveItem,
}: {
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
  setActiveItem(item: T | ActionItem): void;
}) {
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
      const nonActionItem = item as T;
      const index = items.findIndex((i) => i === item);
      const disabled = isItemDisabled(nonActionItem);
      const isActive = item === activeItem;
      const isSelected =
        mode === "multiple"
          ? Boolean(selectedValues?.includes(nonActionItem))
          : nonActionItem === selectedValue;
      const custom = isCustomValue(nonActionItem);

      return {
        role: "option",
        id: `option-${index}`,
        "aria-posinset": index + 1,
        "aria-setsize": items.length,
        "aria-selected": isSelected,
        "aria-disabled": disabled,
        "data-active": isActive ? "true" : undefined,
        "data-selected": isSelected ? "true" : undefined,
        "data-index": index,
        "data-custom": custom ? "true" : undefined,
        disabled,
        onClick: disabled ? undefined : () => onSelect(nonActionItem),
        "data-disabled": disabled ? "true" : undefined,
      };
    },
    [
      items,
      activeItem,
      selectedValue,
      selectedValues,
      isItemDisabled,
      mode,
      onSelect,
      isCustomValue,
    ]
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

      const nonActionItem = item as T;
      const disabled = isItemDisabled(nonActionItem);
      const selected =
        mode === "multiple"
          ? Boolean(selectedValues?.includes(nonActionItem))
          : nonActionItem === selectedValue;

      return {
        isActive: item === activeItem,
        isDisabled: disabled,
        isSelected: selected,
        isAction: false,
      };
    },
    [activeItem, isItemDisabled, mode, selectedValue, selectedValues]
  );

  const getOptionLinkProps = useCallback(
    (item: T): Record<string, unknown> & { role: "option" } => {
      const index = flattenedItems.findIndex((i) => i === item);
      const disabled = isItemDisabled(item);
      const isSelected =
        mode === "multiple"
          ? selectedValues?.includes(item) || false
          : item === selectedValue;

      // user‑returned link value
      const linkResult = getOptionLink?.(item);
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
        "aria-setsize": flattenedItems.length,
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
    [
      flattenedItems,
      isItemDisabled,
      mode,
      selectedValues,
      selectedValue,
      getOptionLink,
    ]
  );

  // Automatically highlight when exactly one option remains
  useEffect(() => {
    // only run when there's exactly one item and it isn’t already active
    if (flattenedItems.length === 1 && activeItem !== flattenedItems[0]) {
      setActiveItem(flattenedItems[0] as T | ActionItem);
    }
  }, [flattenedItems, activeItem, setActiveItem]);

  return { getOptionProps, getOptionState, getOptionLinkProps };
}
