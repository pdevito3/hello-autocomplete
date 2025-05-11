import React from "react";
import type { Group, GroupingOptions } from "../types";

export function useGrouping<T>(items: T[], grouping?: GroupingOptions<T>[]) {
  // Normalize the grouping definitions array
  const groupingOptions = React.useMemo(
    () => (Array.isArray(grouping) ? grouping : grouping ? [grouping] : []),
    [grouping]
  );

  // Recursively create nested groups exactly as in the original hook
  const createGroups = React.useCallback(
    (itemsToGroup: T[], level = 0): Group<T>[] => {
      if (level >= groupingOptions.length) return [];
      const { key: propKey, label: propLabel } = groupingOptions[level];
      const map = itemsToGroup.reduce<Record<string, T[]>>((acc, item) => {
        const raw = item[propKey];
        const k = String(raw ?? "");
        (acc[k] ??= []).push(item);
        return acc;
      }, {});

      return Object.entries(map).map(([groupKey, groupItems]) => {
        const sub = createGroups(groupItems, level + 1);
        const grp: Group<T> = {
          key: groupKey,
          items: groupItems,
          label: propLabel,
          listProps: {
            role: "group",
            "aria-label": propLabel,
            "data-group": true,
            "data-group-key": groupKey,
            "data-group-level": level.toString(),
            "data-has-subgroups": sub.length > 0 ? "true" : undefined,
          },
          header: {
            label: groupKey,
            headingProps: {
              role: "presentation",
              "data-group-label": true,
              "data-group-key": groupKey,
            },
          },
        };
        if (sub.length) grp.groups = sub;
        return grp;
      });
    },
    [groupingOptions]
  );

  // Flatten nested groups back to a flat list
  const flattenGroups = React.useCallback((groupsList: Group<T>[]): T[] => {
    return groupsList.reduce<T[]>((acc, grp) => {
      if (grp.groups && grp.groups.length) {
        return acc.concat(flattenGroups(grp.groups));
      }
      return acc.concat(grp.items);
    }, []);
  }, []);

  // Compute grouped structure and flattened items
  const grouped = React.useMemo(
    () => (groupingOptions.length ? createGroups(items) : []),
    [items, groupingOptions, createGroups]
  );

  const flattened = React.useMemo(
    () => (groupingOptions.length ? flattenGroups(grouped) : items),
    [grouped, groupingOptions.length, flattenGroups, items]
  );

  return { grouped, flattened };
}
