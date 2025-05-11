// src/hooks/useAutoComplete/useAutoComplete.ts
import { useClearButton } from "./core/useClearButton";
import { useControlled } from "./core/useControlled";
import { useDisclosure } from "./core/useDisclosure";
import { useGroup } from "./core/useGroup";
import { useInput } from "./core/useInput";
import { useLabel } from "./core/useLabel";
import { useListbox } from "./core/useListbox";
import { useOption } from "./core/useOption";
import { useCustomValue } from "./features/useCustomValue";
import { useFiltering } from "./features/useFiltering";
import { useGrouping } from "./features/useGrouping";
import { useNavigation } from "./features/useNavigation";
import type {
  ActionItem,
  Group,
  GroupingOptions,
  UseAutoCompleteGroupedMultipleNoActions,
  UseAutoCompleteGroupedMultipleWithActions,
  UseAutoCompleteGroupedSingleNoActions,
  UseAutoCompleteGroupedSingleWithActions,
  UseAutoCompleteOptions,
  UseAutoCompleteUngroupedMultipleNoActions,
  UseAutoCompleteUngroupedMultipleWithActions,
  UseAutoCompleteUngroupedSingleNoActions,
  UseAutoCompleteUngroupedSingleWithActions,
} from "./types";

export function useAutoComplete<T>(
  options: UseAutoCompleteOptions<T> & {
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    actions?: undefined;
    state?: { grouping?: undefined };
    mode?: "single";
  }
): UseAutoCompleteUngroupedSingleNoActions<T>;

export function useAutoComplete<T>(
  options: UseAutoCompleteOptions<T> & {
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    actions?: undefined;
    state?: { grouping?: undefined };
    mode: "multiple";
  }
): UseAutoCompleteUngroupedMultipleNoActions<T>;

export function useAutoComplete<T>(
  options: UseAutoCompleteOptions<T> & {
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    actions?: undefined;
    state: { grouping: GroupingOptions<T>[] };
    mode?: "single";
  }
): UseAutoCompleteGroupedSingleNoActions<T>;

export function useAutoComplete<T>(
  options: UseAutoCompleteOptions<T> & {
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    actions?: undefined;
    state: { grouping: GroupingOptions<T>[] };
    mode: "multiple";
  }
): UseAutoCompleteGroupedMultipleNoActions<T>;

export function useAutoComplete<T>(
  options: UseAutoCompleteOptions<T> & {
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    actions: ActionItem[];
    state?: { grouping?: undefined };
    mode?: "single";
  }
): UseAutoCompleteUngroupedSingleWithActions<T>;

export function useAutoComplete<T>(
  options: UseAutoCompleteOptions<T> & {
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    actions: ActionItem[];
    state?: { grouping?: undefined };
    mode: "multiple";
  }
): UseAutoCompleteUngroupedMultipleWithActions<T>;

export function useAutoComplete<T>(
  options: UseAutoCompleteOptions<T> & {
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    actions: ActionItem[];
    state: { grouping: GroupingOptions<T>[] };
    mode?: "single";
  }
): UseAutoCompleteGroupedSingleWithActions<T>;

export function useAutoComplete<T>(
  options: UseAutoCompleteOptions<T> & {
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    actions: ActionItem[];
    state: { grouping: GroupingOptions<T>[] };
    mode: "multiple";
  }
): UseAutoCompleteGroupedMultipleWithActions<T>;

export function useAutoComplete<T>({
  mode: modeProp = "single",
  state = {},
  defaultOpen = false,
  labelSrOnly = false,
  asyncDebounceMs = 0,
  allowsCustomValue = false,
  onInputValueChange,
  onSelectValue,
  onInputValueChangeAsync,
  onBlurAsync,
  items: itemsProp = [],
  onFilterAsync,
  itemToString,
  onClear,
  isItemDisabled: isItemDisabledProp,
  getOptionLink,
  actions,
  allowsEmptyCollection = false,
  tabs = [],
  defaultTabKey,
}: UseAutoCompleteOptions<T> & {
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}):
  | UseAutoCompleteUngroupedSingleNoActions<T>
  | UseAutoCompleteUngroupedMultipleNoActions<T>
  | UseAutoCompleteGroupedSingleNoActions<T>
  | UseAutoCompleteGroupedMultipleNoActions<T>
  | UseAutoCompleteUngroupedSingleWithActions<T>
  | UseAutoCompleteUngroupedMultipleWithActions<T>
  | UseAutoCompleteGroupedSingleWithActions<T>
  | UseAutoCompleteGroupedMultipleWithActions<T> {
  const mode = modeProp;

  // 1) Controlled vs internal state
  const controlled = useControlled(
    state,
    mode,
    itemToString,
    defaultOpen,
    itemsProp
  );
  const {
    inputValue,
    selectedValue,
    selectedValues,
    isOpen,
    items,
    activeItem,
    highlightedIndex,
    setInputValue,
    setIsOpen,
    setActiveItem,
    setHighlightedIndex,
    clear,
    select,
    open,
    blur,
    toggleOpen,
    getSelectedItem,
    listboxRef,
    setSelectedValues,
    isCustomValue,
  } = controlled;

  // 2) Navigation
  const navigation = useNavigation({
    items,
    activeItem,
    highlightedIndex,
    setActiveItem,
    setHighlightedIndex,
  });

  // 3) Filtering, grouping, custom value
  const filtering = useFiltering(inputValue, onFilterAsync, asyncDebounceMs);
  const groupingFeature = useGrouping(filtering.items, groupingDefs);
  const customValue = useCustomValue(
    inputValue,
    allowsCustomValue,
    filtering.items
  );

  const finalItems: Array<T | ActionItem> | Array<Group<T>> =
    groupingFeature.grouped.length > 0
      ? groupingFeature.grouped
      : customValue.appended
      ? customValue.itemsWithCustom
      : filtering.items;

  // 4) Core prop hooks
  const input = useInput({
    inputValue,
    handleInputChange: (e) => {
      setInputValue(e.target.value);
      onInputValueChange?.(e.target.value);
    },
    handleKeyDown: navigation.onKeyDown,
    onFocus: open,
    onBlur: blur,
    activeItem,
    flattenedItems: Array.isArray(finalItems) ? (finalItems as T[]) : [],
    tabsCount: tabs.length,
    allowsEmptyCollection,
    setIsOpen,
    setActiveItem,
    onFilterAsyncRef: { current: onFilterAsync },
    debouncedAsyncOperation: async () => {},
    onBlurAsync,
  });

  const listbox = useListbox({
    isOpen,
    label,
    ref: listboxRef,
    hasGroups: Boolean(groupingDefs?.length),
    isEmpty: !Array.isArray(finalItems) || finalItems.length === 0,
    size: Array.isArray(finalItems) ? finalItems.length : 0,
  });

  const clearButton = useClearButton({
    inputValue,
    selectedValue,
    selectedValues: selectedValues(),
    mode,
    onClear,
    setInputValue,
    setSelectedValue: controlled.setSelectedValue,
    setSelectedValues,
    setActiveItem,
    setIsOpen,
  });

  const disclosure = useDisclosure({
    isOpen,
    allowsEmptyCollection,
    itemsLength: Array.isArray(finalItems) ? finalItems.length : 0,
    setIsOpen,
  });

  const labelProps = useLabel({
    htmlFor: "autocomplete-input",
    srOnly: labelSrOnly,
  });

  // export interface UseOptionOptions<T> {
  //   /** the full, flattened list (including any ActionItem entries) */
  //   items: Array<T | ActionItem>;
  //   /** the currently active/highlighted entry */
  //   activeItem: T | ActionItem | null;
  //   /** single‑select value */
  //   selectedValue?: T;
  //   /** multi‑select values */
  //   selectedValues?: T[];
  //   /** pick up disabled state for real items */
  //   isItemDisabled(item: T): boolean;
  //   /** detect if a real item is the “custom value” */
  //   isCustomValue(item: T): boolean;
  //   /** callback when a real item is chosen */
  //   onSelect(item: T): void;
  //   /** the mode of the autocomplete */
  //   mode: Mode;
  // }
  const option = useOption({
    items: finalItems,
    activeItem,
    selectedValue,
    selectedValues: selectedValues(),
    isItemDisabled: isItemDisabledProp,
    isCustomValue,
    onSelect: (item) => {
      if (itemToString) {
        setInputValue(itemToString(item));
      }
      onSelectValue?.(item);
    },
    mode,
    getOptionLink,
  });

  const group = useGroup<T>();

  // 5) Return merged API with inputProps override
  return {
    getItems: () =>
      groupingFeature.grouped.length > 0 ? groupingFeature.grouped : finalItems,
    getSelectedItem,
    hasActiveItem: () => Boolean(activeItem),
    isFocused: () => controlled.isFocused(),
    getRootProps: controlled.getRootProps,
    getListProps: listbox.getListProps,
    getLabelProps: labelProps.getLabelProps,
    getInputProps: input.getInputProps,
    getClearProps: clearButton.getClearProps,
    getDisclosureProps: disclosure.getDisclosureProps,
    getOptionProps: option.getOptionProps,
    getOptionState: option.getOptionState,
    getGroupProps: group.getGroupProps,
    getGroupLabelProps: group.getGroupLabelProps,
    hasSelectedItem: () => controlled.hasSelectedItem(),
    isOpen: () => isOpen,
    setIsOpen,
    isCustomValue,
    getHighlightedIndex: () => highlightedIndex,
    setHighlightedIndex,
    getActiveItem: () => activeItem,
    setActiveItem,
    getOptionLinkProps: controlled.getOptionLinkProps,
    clear,
    getTabListProps: controlled.getTabListProps,
    getTabProps: controlled.getTabProps,
    getTabState: controlled.getTabState,
    select,
    open,
    blur,
    toggleOpen,
  } as unknown as
    | UseAutoCompleteUngroupedSingleNoActions<T>
    | UseAutoCompleteUngroupedMultipleNoActions<T>
    | UseAutoCompleteGroupedSingleNoActions<T>
    | UseAutoCompleteGroupedMultipleNoActions<T>
    | UseAutoCompleteUngroupedSingleWithActions<T>
    | UseAutoCompleteUngroupedMultipleWithActions<T>
    | UseAutoCompleteGroupedSingleWithActions<T>
    | UseAutoCompleteGroupedMultipleWithActions<T>;
}
