import type { User } from "@/datasets/users";
import { Check } from "@/svgs";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAutoComplete } from "../hooks/use-autocomplete";
import { cn } from "../utils";

const mockUsers: User[] = Array.from({ length: 80 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
}));

// Simulate a paged API that accepts a searchTerm
async function fetchUserPage(
  limit: number,
  offset: number = 0,
  searchTerm: string = ""
): Promise<{ rows: User[]; nextOffset: number }> {
  let filtered = mockUsers;
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
    );
  }
  const start = offset * limit;
  const rows = filtered.slice(start, start + limit);
  // simulate network latency
  await new Promise((r) => setTimeout(r, 500));
  return { rows, nextOffset: offset + 1 };
}

export function InfiniteAutocompleteExample() {
  const [filter, setFilter] = useState("");
  const [selectedValue, setSelectedValue] = useState<User | undefined>();
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<User | null>(null);

  // React Query: re‐runs & resets when `filter` changes
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["users", filter],
    queryFn: ({ pageParam = 0 }) => fetchUserPage(20, pageParam, filter),
    getNextPageParam: (last) =>
      last.rows.length === 20 ? last.nextOffset : undefined,
  });

  const allUsers = useMemo(
    () => data?.pages.flatMap((d) => d.rows) ?? [],
    [data?.pages]
  );

  // virtualizer setup
  const parentRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allUsers.length + 1 : allUsers.length,
    getScrollElement: () => parentRef.current,
    getItemKey: useCallback(
      (index: number) => {
        if (index > allUsers.length - 1) {
          return `loader-${index}`;
        }
        return allUsers[index].id;
      },
      [allUsers]
    ),
    estimateSize: () => 50,
    overscan: 5,
  });

  // auto‐load next page on scroll end
  useEffect(() => {
    const items = rowVirtualizer.getVirtualItems();
    const lastItem = items[items.length - 1];
    if (
      lastItem &&
      lastItem.index >= allUsers.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [rowVirtualizer.getVirtualItems(), hasNextPage, isFetchingNextPage]);

  // wire up autocomplete so typing drives `filter`
  const {
    getRootProps,
    getLabelProps,
    getInputProps,
    getListProps,
    getOptionProps,
    getOptionState,
  } = useAutoComplete<User>({
    state: {
      inputValue: filter,
      setInputValue: setFilter,
      selectedValue,
      setSelectedValue,
      isOpen,
      setIsOpen,
      activeItem,
      setActiveItem,
      label: "Search users",
    },
    items: allUsers,
    itemToString: (u) => u.name,
    asyncDebounceMs: 300,
    onFilterAsync: async ({ searchTerm }) => {
      // update the React Query filter
      setFilter(searchTerm);
      // return allUsers so hook’s internal list stays in sync
      return allUsers;
    },
  });

  return (
    <div className="relative max-w-md">
      <label {...getLabelProps()}>Search users</label>
      <div {...getRootProps()}>
        <input
          {...getInputProps()}
          placeholder="Type to filter users…"
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {isOpen && (
          <ul
            {...getListProps()}
            ref={parentRef}
            className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg h-80 overflow-auto"
          >
            {isLoading ? (
              <p className="p-4">Loading...</p>
            ) : isError ? (
              <p className="p-4 text-red-500">
                Error: {(error as Error).message}
              </p>
            ) : (
              rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const idx = virtualRow.index;
                const isLoader = idx > allUsers.length - 1;
                const key = isLoader ? `loader-${idx}` : allUsers[idx].id;
                const style = {
                  position: "absolute" as const,
                  top: virtualRow.start,
                  width: "100%",
                };

                if (isLoader) {
                  return (
                    <p
                      key={key}
                      style={style}
                      className="flex items-center justify-center"
                    >
                      {hasNextPage ? "Loading more…" : "End of users"}
                    </p>
                  );
                }

                const user = allUsers[idx];
                return (
                  <li
                    key={user.id}
                    {...getOptionProps(user)}
                    style={style}
                    className={cn(
                      "px-4 py-2 cursor-pointer hover:bg-gray-100",
                      getOptionState(user).isActive && "bg-gray-100"
                    )}
                  >
                    <div>
                      <div className="font-medium flex">
                        <p className="flex-1">{user.name}</p>
                        {getOptionState(user).isSelected && (
                          <Check className="text-blue-500" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </li>
                  // <div
                  //   key={user.id}
                  //   {...getOptionProps(user)}
                  //   style={style}
                  //   className={cn(
                  //     "px-4 py-2 cursor-pointer",
                  //     getOptionState(user).isActive && "bg-gray-100"
                  //   )}
                  // >
                  //   <div className="flex justify-between">
                  //     {user.name}
                  //     {getOptionState(user).isSelected && (
                  //       <Check className="text-blue-500" />
                  //     )}
                  //   </div>
                  //   <div className="text-sm text-gray-500">{user.email}</div>
                  // </div>
                );
              })
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
