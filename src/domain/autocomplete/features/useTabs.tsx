import { useCallback } from "react";
import type { Tab, TabState } from "../types";

export function useTabs<T>({
  activeTabIndex,
  items,
  tabs,
  setActiveTabIndex,
  handleKeyDown,
}: {
  activeTabIndex: number;
  items: T[];
  tabs: Tab<T>[];
  setActiveTabIndex: (index: number) => void;
  handleKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
}) {
  const getTabProps = useCallback(
    (tab: Tab<T>, index: number) => ({
      role: "tab",
      id: `autocomplete-tab-${tab.key}`,
      "aria-selected": index === activeTabIndex || undefined,
      tabIndex: index === activeTabIndex ? 0 : -1,
      onClick: () => setActiveTabIndex(index),
      onKeyDown: handleKeyDown,
      ...tab.tabProps,
    }),
    [activeTabIndex, handleKeyDown, setActiveTabIndex]
  );

  const getTabListProps = useCallback(
    () => ({
      role: "tablist",
      "data-tablist": true,
    }),
    []
  );

  const getTabState = useCallback(
    (tab: Tab<T>): TabState => ({
      isSelected: tab.key === tabs[activeTabIndex].key,
      isDisabled: false,
      itemCount: items.filter((item) => (tab.filter ? tab.filter(item) : true))
        .length,
    }),
    [activeTabIndex, items, tabs]
  );

  return { getTabProps, getTabListProps, getTabState };
}
