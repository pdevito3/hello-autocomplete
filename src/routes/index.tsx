import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAutoComplete } from "../hooks/useAutoComplete";
import { cn } from "../utils";

export const Route = createFileRoute("/")({
  component: HomePage,
});

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

function BasicExample() {
  const [inputValue, setInputValue] = useState("");
  const [selectedValue, setSelectedValue] = useState<User | undefined>();
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<User | null>(null);

  useEffect(() => {
    if (selectedValue) {
      setInputValue(selectedValue.name);
    }
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
    onFilterAsync: async ({ searchTerm }) => {
      // console.log({ onFilterAsync: searchTerm });
      return users.filter((user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    },
    // onInputValueChange: (value) => {
    //   console.log({ onInputValueChange: value });
    // },
    asyncDebounceMs: 400,
  });

  return (
    <div className="max-w-md">
      <div className="relative">
        <label {...getLabelProps()}>Search users</label>
        <div {...getRootProps()}>
          <input
            {...getInputProps()}
            placeholder="Type to search..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {isOpen && (
            <ul
              {...getListProps()}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
            >
              {getItems().length === 0 ? (
                <li className="px-4 py-2 text-gray-500">No results found</li>
              ) : (
                <>
                  {getItems().map((user) => (
                    <li
                      key={user.id}
                      {...getOptionProps(user)}
                      className={cn(
                        getOptionProps(user).className,
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
                  ))}
                </>
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

function CustomRenderingExample() {
  const [inputValue, setInputValue] = useState("");
  const [selectedValue, setSelectedValue] = useState<User | undefined>();
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<User | null>(null);

  useEffect(() => {
    if (selectedValue) {
      setInputValue(selectedValue.name);
    }
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
    onFilterAsync: async ({ searchTerm }) => {
      return users.filter((user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    },
  });

  return (
    <div className="max-w-md">
      <div className="relative">
        <label {...getLabelProps()}>Search users with custom rendering</label>
        <div {...getRootProps()}>
          <input
            {...getInputProps()}
            placeholder="Type to search..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {isOpen && (
            <ul
              {...getListProps()}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
            >
              {getItems().length === 0 ? (
                <li className="px-4 py-2 text-gray-500">No results found</li>
              ) : (
                <>
                  {getItems().map((user) => (
                    <li
                      key={user.id}
                      {...getOptionProps(user)}
                      className={cn(
                        getOptionProps(user).className,
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
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </li>
                  ))}
                </>
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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          useAutoComplete Hook Demo
        </h1>

        <div className="bg-white shadow rounded-lg p-6 mb-8">
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
      </div>
    </div>
  );
}

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
