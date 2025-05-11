export type Placement = "top" | "bottom" | "left" | "right";
export type Mode = "single" | "multiple";

export interface GroupingOptions<T> {
  /** property name on item to group by */
  key: keyof T;
  /** optional aria-label or overall label for group list */
  label: string;
}

export interface Group<T> {
  /** unique identifier for this group (the group-by value) */
  key: string;
  /** items in this group (always entire set even if nested groups) */
  items: T[];
  /** optional sub-groups for further levels of grouping */
  groups?: Group<T>[];
  /** aria-label for the group's list container */
  label: string;

  /** allow any `data-*` on the <ul> */
  listProps: React.HTMLAttributes<HTMLUListElement> & {
    [key: `data-${string}`]: string | boolean | undefined;
  };

  header: {
    /** text to render as the group's heading */
    label: string;

    /** allow any `data-*` on the <span> */
    headingProps: React.HTMLAttributes<HTMLSpanElement> & {
      [key: `data-${string}`]: string | boolean | undefined;
    };
  };
}

// ----------------------------------------------------------------
// New: ActionItem type to represent “action” entries in the list
// ----------------------------------------------------------------
export interface ActionItem {
  /** marker so we can detect these at runtime */
  __isAction?: true;
  /** text to render for this action */
  label: string;
  /** what to do when it’s “selected” */
  onAction: () => void;
  /** placement: top or bottom of the list (default bottom) */
  placement?: "top" | "bottom";
  /** if true, only render when the list of real items is empty */
  showWhenEmpty?: boolean;
}

export interface Tab<T> {
  /** unique key for this tab */
  key: string;
  /** text to render on the tab */
  label: string;
  /** filter to apply before other filtering */
  filter?: (item: T) => boolean;
  /** optional custom props for the tab button */
  tabProps?: React.HTMLAttributes<HTMLButtonElement>;
}

export interface AutocompleteState<T> {
  inputValue?: string;
  setInputValue?: (value: string) => void;
  selectedValue?: T;
  setSelectedValue?: (value: T | undefined) => void;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  /** one or more levels of grouping definitions */
  grouping?: GroupingOptions<T>[];
  defaultValue?: T;

  activeItem?: T | null;
  setActiveItem?: (item: T | null) => void;
  /** index of the currently highlighted option */
  highlightedIndex?: number | null;
  /** callback to set the highlighted option index */
  setHighlightedIndex?: (index: number | null) => void;
  label?: string;
}

export interface UseAutoCompleteOptions<T> {
  /** 'single' for one selection, 'multiple' for multiple */
  mode?: Mode;
  state?: AutocompleteState<T>;
  defaultOpen?: boolean;
  labelSrOnly?: boolean;
  placement?: Placement;
  asyncDebounceMs?: number;
  /** enable selecting values that aren’t in the list */
  allowsCustomValue?: boolean;
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
  onSelectValue?: (value: T) => void;
  onCustomValueAsync?: (params: {
    value: string;
    signal: AbortSignal;
  }) => Promise<void>;
  /** called when the clear button is clicked */
  onClear?: () => void;

  /** return true for items that should be rendered and treated as disabled */
  isItemDisabled?: (item: T) => boolean;
  /**
   * derive link props for an option.
   * Can return a string (will be used as href)
   * or an object of props (e.g. { to, params, search } for a router Link).
   */
  getOptionLink?: (
    item: T
  ) => string | Partial<Record<string, unknown>> | undefined;
  /**
   * zero or more “action” entries that appear alongside your normal items,
   * can be clicked or keyboard‑selected to run `onAction()`
   */
  actions?: ActionItem[];
  /** whether the combo box allows the menu to open even when the item collection is empty */
  allowsEmptyCollection?: boolean;

  /** zero or more tabs for pre‐filtering items */
  tabs?: Tab<T>[];
  /** key of the tab to select by default */
  defaultTabKey?: string;
}

export interface OptionState {
  isActive: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  isAction: boolean;
}

export interface TabState {
  isSelected: boolean;
  isDisabled: boolean;
  itemCount: number;
}

// ----------------------------------------------------------------
// 1) Define two distinct return types:
//    - NoActions → getItems(): T[]
//    - WithActions → getItems(): Array<T|ActionItem>
// ----------------------------------------------------------------

export interface UseAutoCompleteReturnNoActions<T> {
  getItems: () => T[];
  getSelectedItem: () => T | T[] | undefined;
  hasActiveItem: () => boolean;
  isFocused: () => boolean;
  getRootProps: () => React.HTMLAttributes<HTMLDivElement> & {
    ref: React.Ref<HTMLDivElement>;
  } & { [key: `data-${string}`]: string | boolean | undefined };
  getListProps: () => React.HTMLAttributes<HTMLUListElement> & {
    ref: React.Ref<HTMLUListElement>;
  };
  getLabelProps: () => React.LabelHTMLAttributes<HTMLLabelElement>;
  getInputProps: () => React.InputHTMLAttributes<HTMLInputElement> & {
    [key: `data-${string}`]: string | boolean | undefined;
  };
  getClearProps: () => React.ButtonHTMLAttributes<HTMLButtonElement> & {
    [key: `data-${string}`]: string | boolean | undefined;
  };
  getDisclosureProps: () => React.ButtonHTMLAttributes<HTMLButtonElement> & {
    [key: `data-${string}`]: string | boolean | undefined;
  };
  getOptionProps: (
    item: T | ActionItem
  ) => React.LiHTMLAttributes<HTMLLIElement>;

  getOptionState: (item: T) => OptionState;
  getGroupProps: (group: Group<T>) => React.HTMLAttributes<HTMLUListElement>;
  getGroupLabelProps: (
    group: Group<T>
  ) => React.HTMLAttributes<HTMLSpanElement>;
  hasSelectedItem: () => boolean;
  isOpen: () => boolean;
  setIsOpen: (open: boolean) => void;
  isCustomValue: (item: T) => boolean;
  getHighlightedIndex: () => number | null;
  setHighlightedIndex: (i: number | null) => void;
  getActiveItem: () => T | null;
  setActiveItem: (item: T | null) => void;
  getOptionLinkProps: (
    item: T
  ) => React.AnchorHTMLAttributes<HTMLAnchorElement> & { role: "option" };
  clear: () => void;
  /** props for the tab list container */
  getTabListProps: () => React.HTMLAttributes<HTMLDivElement>;
  /** props for an individual tab */
  getTabProps: (
    tab: Tab<T>,
    index: number
  ) => React.HTMLAttributes<HTMLButtonElement>;
  getTabState: (tab: Tab<T>) => TabState;
}

export interface UseAutoCompleteReturnWithActions<T> {
  getItems: () => Array<T | ActionItem>;
  getSelectedItem: () => T | T[] | undefined;
  hasActiveItem: () => boolean;
  isFocused: () => boolean;
  getRootProps: () => React.HTMLAttributes<HTMLDivElement> & {
    ref: React.Ref<HTMLDivElement>;
  } & { [key: `data-${string}`]: string | boolean | undefined };
  getListProps: () => React.HTMLAttributes<HTMLUListElement> & {
    ref: React.Ref<HTMLUListElement>;
  };
  getLabelProps: () => React.LabelHTMLAttributes<HTMLLabelElement>;
  getInputProps: () => React.InputHTMLAttributes<HTMLInputElement> & {
    [key: `data-${string}`]: string | boolean | undefined;
  };
  getClearProps: () => React.ButtonHTMLAttributes<HTMLButtonElement> & {
    [key: `data-${string}`]: string | boolean | undefined;
  };
  getDisclosureProps: () => React.ButtonHTMLAttributes<HTMLButtonElement> & {
    [key: `data-${string}`]: string | boolean | undefined;
  };
  getOptionProps: (
    item: T | ActionItem
  ) => React.LiHTMLAttributes<HTMLLIElement>;
  getOptionState: (item: T | ActionItem) => OptionState;
  getGroupProps: (group: Group<T>) => React.HTMLAttributes<HTMLUListElement>;
  getGroupLabelProps: (
    group: Group<T>
  ) => React.HTMLAttributes<HTMLSpanElement>;
  hasSelectedItem: () => boolean;
  isOpen: () => boolean;
  setIsOpen: (open: boolean) => void;
  isCustomValue: (item: T) => boolean;
  getHighlightedIndex: () => number | null;
  setHighlightedIndex: (i: number | null) => void;
  getActiveItem: () => T | ActionItem | null;
  setActiveItem: (item: T | ActionItem | null) => void;
  getOptionLinkProps: (
    item: T
  ) => React.AnchorHTMLAttributes<HTMLAnchorElement> & { role: "option" };
  clear: () => void;
  /** props for the tab list container */
  getTabListProps: () => React.HTMLAttributes<HTMLDivElement>;
  /** props for an individual tab */
  getTabProps: (
    tab: Tab<T>,
    index: number
  ) => React.HTMLAttributes<HTMLButtonElement>;
  getTabState: (tab: Tab<T>) => TabState;
}

// ——————————————————————————————
// No‐actions variants: getItems(): T[]
// ——————————————————————————————

export type UseAutoCompleteUngroupedSingleNoActions<T> = Omit<
  UseAutoCompleteReturnNoActions<T>,
  "getItems" | "getSelectedItem"
> & {
  getItems: () => T[];
  getSelectedItem: () => T | undefined;
};

export type UseAutoCompleteUngroupedMultipleNoActions<T> = Omit<
  UseAutoCompleteReturnNoActions<T>,
  "getItems" | "getSelectedItem"
> & {
  getItems: () => T[];
  getSelectedItem: () => T[];
};

// grouped versions:
export type UseAutoCompleteGroupedSingleNoActions<T> = Omit<
  UseAutoCompleteReturnNoActions<T>,
  "getItems" | "getSelectedItem"
> & {
  getItems: () => Group<T>[];
  getSelectedItem: () => T | undefined;
};

export type UseAutoCompleteGroupedMultipleNoActions<T> = Omit<
  UseAutoCompleteReturnNoActions<T>,
  "getItems" | "getSelectedItem"
> & {
  getItems: () => Group<T>[];
  getSelectedItem: () => T[];
};

// ——————————————————————————————
// With‐actions variants: getItems(): Array<T|ActionItem>
// ——————————————————————————————

export type UseAutoCompleteUngroupedSingleWithActions<T> = Omit<
  UseAutoCompleteReturnWithActions<T>,
  "getItems" | "getSelectedItem"
> & {
  getItems: () => Array<T | ActionItem>;
  getSelectedItem: () => T | undefined;
};

export type UseAutoCompleteUngroupedMultipleWithActions<T> = Omit<
  UseAutoCompleteReturnWithActions<T>,
  "getItems" | "getSelectedItem"
> & {
  getItems: () => Array<T | ActionItem>;
  getSelectedItem: () => T[];
};

// grouped versions:
export type UseAutoCompleteGroupedSingleWithActions<T> = Omit<
  UseAutoCompleteReturnWithActions<T>,
  "getItems" | "getSelectedItem"
> & {
  getItems: () => Group<T>[];
  getSelectedItem: () => T | undefined;
};

export type UseAutoCompleteGroupedMultipleWithActions<T> = Omit<
  UseAutoCompleteReturnWithActions<T>,
  "getItems" | "getSelectedItem"
> & {
  getItems: () => Group<T>[];
  getSelectedItem: () => T[];
};
