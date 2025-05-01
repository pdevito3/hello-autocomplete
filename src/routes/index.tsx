import {
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAutoComplete } from "../hooks/useAutoComplete";
import { cn } from "../utils";

export const Route = createFileRoute("/")({ component: HomePage });

interface User {
  id: number;
  name: string;
  email: string;
}

const users: User[] = [
  { id: 1, name: "John Doe", email: "john@deer.com" },
  { id: 2, name: "Jane Smith", email: "jane@deer.com" },
  { id: 3, name: "Bob Johnson", email: "bob@auth.com" },
  { id: 4, name: "Alice Brown", email: "alice@auth.com" },
  { id: 5, name: "Charlie Wilson", email: "charlie@example.com" },
];

// React Query client
const queryClient = new QueryClient();
// Basic autocomplete example
function BasicExample() {
  const [inputValue, setInputValue] = useState("");
  const [selectedValue, setSelectedValue] = useState<User | undefined>();
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<User | null>(null);

  const {
    getRootProps,
    getLabelProps,
    getInputProps,
    getListProps,
    getOptionProps,
    getOptionState,
    getItems,
    getClearProps,
    hasSelectedItem,
  } = useAutoComplete({
    items: users,
    state: {
      inputValue,
      setInputValue,
      selectedValue,
      setSelectedValue,
      isOpen,
      setIsOpen,
      activeItem,
      setActiveItem,
      label: "Search users",
    },
    asyncDebounceMs: 300,
    onFilterAsync: async ({ searchTerm }) =>
      users.filter((u) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    itemToString: (u) => u.name,
  });

  return (
    <div className="max-w-md">
      <div className="relative">
        <label {...getLabelProps()}>Search users</label>
        <div {...getRootProps()} className="relative">
          <input
            {...getInputProps()}
            placeholder="Type to search..."
            className="w-full px-3 py-2 border rounded-md border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {hasSelectedItem() && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none bg-transparent"
              {...getClearProps()}
            >
              <XIcon />
            </button>
          )}

          {isOpen && (
            <ul
              {...getListProps()}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
            >
              {getItems().length === 0 ? (
                <li className="px-4 py-2 text-gray-500">No results found</li>
              ) : (
                getItems().map((user) => (
                  <li
                    key={user.id}
                    {...getOptionProps(user)}
                    className={cn(
                      "px-4 py-2 cursor-pointer hover:bg-gray-100",
                      getOptionState(user).isActive && "bg-gray-100"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      {user.name}
                      {getOptionState(user).isSelected && (
                        <Check className="text-blue-500" />
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>
      {selectedValue && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-500">Selected User:</h3>
          <div className="mt-2">
            <p className="text-sm text-gray-900">Name: {selectedValue.name}</p>
            <p className="text-sm text-gray-900">
              Email: {selectedValue.email}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Custom rendering example
function CustomRenderingExample() {
  const [inputValue, setInputValue] = useState("");
  const [selectedValue, setSelectedValue] = useState<User | undefined>();
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<User | null>(null);

  const {
    getRootProps,
    getLabelProps,
    getInputProps,
    getListProps,
    getOptionProps,
    getOptionState,
    getItems,
  } = useAutoComplete({
    items: users,
    state: {
      inputValue,
      setInputValue,
      selectedValue,
      setSelectedValue,
      isOpen,
      setIsOpen,
      activeItem,
      setActiveItem,
      label: "Search users with custom rendering",
    },
    labelSrOnly: true,
    onFilterAsync: async ({ searchTerm }) =>
      users.filter((u) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    itemToString: (u) => u.name,
  });

  return (
    <div className="max-w-md">
      <div className="relative">
        <label {...getLabelProps()}>Search users with custom rendering</label>
        <div {...getRootProps()}>
          <input
            {...getInputProps()}
            placeholder="Type to search..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {isOpen && (
            <ul
              {...getListProps()}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
            >
              {getItems().length === 0 ? (
                <li className="px-4 py-2 text-gray-500">No results found</li>
              ) : (
                getItems().map((user) => (
                  <li
                    key={user.id}
                    {...getOptionProps(user)}
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
                ))
              )}
            </ul>
          )}
        </div>
      </div>
      {selectedValue && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-500">Selected User:</h3>
          <div className="mt-2">
            <p className="text-sm text-gray-900">Name: {selectedValue.name}</p>
            <p className="text-sm text-gray-900">
              Email: {selectedValue.email}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Mock users for infinite example
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

// Main page component wrapping all examples
export default function HomePage() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Basic Example
            </h2>
            <BasicExample />
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Custom Rendering
            </h2>
            <CustomRenderingExample />
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Infinite Autocomplete
            </h2>
            <InfiniteAutocompleteExample />
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
}

// Check icon component
function Check({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-4 h-4", className)}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-4 h-4", className)}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
