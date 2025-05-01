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

  useEffect(() => {
    if (selectedValue) setInputValue(selectedValue.name);
  }, [selectedValue]);

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
      label: "Search users",
    },
    asyncDebounceMs: 300,
    onFilterAsync: async ({ searchTerm }) =>
      users.filter((u) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
  });

  return (
    <div className="max-w-md">
      <div className="relative">
        <label {...getLabelProps()}>Search users</label>
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

  useEffect(() => {
    if (selectedValue) setInputValue(selectedValue.name);
  }, [selectedValue]);

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

// Simulate a paged API that accepts a searchTerm
async function fetchServerPage(
  limit: number,
  offset: number = 0,
  searchTerm: string = ""
): Promise<{ rows: string[]; nextOffset: number }> {
  // generate dummy rows for this page
  const start = offset * limit;
  let rows = Array.from(
    { length: limit },
    (_, i) => `Async loaded row #${i + start}`
  );

  // simulate server‐side filtering
  if (searchTerm) {
    const lower = searchTerm.toLowerCase();
    rows = rows.filter((r) => r.toLowerCase().includes(lower));
  }

  // simulate network latency
  await new Promise((r) => setTimeout(r, 500));
  return { rows, nextOffset: offset + 1 };
}

export function InfiniteAutocompleteExample() {
  const [inputValue, setInputValue] = useState("");
  const [selectedValue, setSelectedValue] = useState<string | undefined>();
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);

  // <-- sync selection back into the input
  useEffect(() => {
    if (selectedValue !== undefined) {
      setInputValue(selectedValue);
    }
  }, [selectedValue]);

  // re‐runs and resets pages whenever inputValue changes
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["rows", inputValue],
    queryFn: ({ pageParam = 0 }) => fetchServerPage(10, pageParam, inputValue),
    getNextPageParam: (last) => last.nextOffset,
  });

  // flatten all pages into one array
  const allRows = useMemo(
    () => data?.pages.flatMap((d) => d.rows) ?? [],
    [data?.pages]
  );

  // virtualization setup
  const parentRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allRows.length + 1 : allRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  });

  // auto‐load next page when you scroll to the bottom
  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();
    if (
      lastItem &&
      lastItem.index >= allRows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    rowVirtualizer.getVirtualItems(),
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    allRows.length,
  ]);

  // wire up the autocomplete to the filtered rows
  const {
    getRootProps,
    getLabelProps,
    getInputProps,
    getListProps,
    getOptionProps,
    getOptionState,
  } = useAutoComplete<string>({
    state: {
      inputValue,
      setInputValue,
      selectedValue,
      setSelectedValue,
      isOpen,
      setIsOpen,
      activeItem,
      setActiveItem,
      label: "Infinite Autocomplete",
    },
    items: allRows,
  });

  return (
    <div className="relative max-w-md">
      <label {...getLabelProps()}>Infinite Autocomplete</label>
      <div {...getRootProps()}>
        <input
          {...getInputProps()}
          placeholder="Type to filter…"
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {isOpen && (
          <div
            {...getListProps()}
            ref={parentRef}
            className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg h-80 overflow-auto"
          >
            {isLoading ? (
              <div className="p-4">Loading...</div>
            ) : isError ? (
              <div className="p-4 text-red-500">
                Error: {(error as Error).message}
              </div>
            ) : (
              rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const idx = virtualRow.index;
                const isLoader = idx > allRows.length - 1;
                const key = isLoader ? `loader-${idx}` : allRows[idx];
                const style = {
                  position: "absolute" as const,
                  top: virtualRow.start,
                  height: virtualRow.size,
                  width: "100%",
                };

                if (isLoader) {
                  return (
                    <div
                      key={key}
                      style={style}
                      className="flex items-center justify-center"
                    >
                      {hasNextPage ? "Loading more…" : "End of list"}
                    </div>
                  );
                }

                const item = allRows[idx];
                return (
                  <div
                    key={item}
                    {...getOptionProps(item)}
                    style={style}
                    className={cn(
                      "px-4 py-2 cursor-pointer",
                      getOptionState(item).isActive && "bg-gray-100"
                    )}
                  >
                    {item}
                  </div>
                );
              })
            )}
          </div>
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
