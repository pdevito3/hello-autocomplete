import { fruits, type Fruit } from "@/datasets/fruit";
import { Check, XIcon } from "@/svgs";
import { cn } from "@/utils";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useAutoComplete } from "../hooks/use-autocomplete";

type FormValues = {
  fruit?: Fruit;
};

interface AutocompleteProps<T> {
  /** the currently selected value */
  value?: T;
  /** call when a new value is selected (or cleared via `undefined`) */
  onChange: (value: T | undefined) => void;
  items: T[];
  label: string;
  /** how to render an item as a string */
  itemToString: (item: T) => string;
}

function Autocomplete<T extends { value: string; label: string }>({
  value,
  onChange,
  items,
  label,
  itemToString,
}: AutocompleteProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<T | null>(null);

  const {
    getRootProps,
    getLabelProps,
    getInputProps,
    getListProps,
    getOptionProps,
    getOptionState,
    getClearProps,
    hasSelectedItem,
    getSelectedItem,
    getItems,
  } = useAutoComplete<T>({
    items,
    state: {
      selectedValue: value,
      setSelectedValue: onChange,
      isOpen,
      setIsOpen,
      activeItem,
      setActiveItem,
      label,
    },
    asyncDebounceMs: 300,
    onFilterAsync: async ({ searchTerm }) =>
      items.filter((item) =>
        itemToString(item).toLowerCase().includes(searchTerm.toLowerCase())
      ),
    itemToString,
    onClear: () => {
      // TODO why do i need to do this??? seems like the built in undefined doesn't fully fly when controlled?
      onChange("" as unknown as T);
    },
  });

  console.log({ selected: getSelectedItem() });

  return (
    <div className="relative">
      <label {...getLabelProps()} className="block mb-1">
        {label}
      </label>
      <div {...getRootProps()} className="relative">
        <input
          {...getInputProps()}
          placeholder={`Search ${label.toLowerCase()}…`}
          className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {hasSelectedItem() && (
          <button
            type="button"
            {...getClearProps()}
            className="absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none"
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
              <li className="px-4 py-2 text-gray-500">
                No {label.toLowerCase()} found
              </li>
            ) : (
              getItems().map((item) => (
                <li
                  key={item.value}
                  {...getOptionProps(item)}
                  className={cn(
                    "px-4 py-2 cursor-pointer hover:bg-gray-100 flex justify-between",
                    getOptionState(item).isActive && "bg-gray-100"
                  )}
                >
                  <span>{itemToString(item)}</span>
                  {getOptionState(item).isSelected && <Check />}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

export function FruitForm() {
  const { control, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: { fruit: undefined },
  });
  const selectedFruit = watch("fruit");
  const onSubmit = (data: FormValues) => console.log("Submitted:", data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
      <Controller
        name="fruit"
        control={control}
        render={({ field }) => (
          <Autocomplete
            {...field}
            items={fruits}
            label="Fruit"
            itemToString={(f) => f.label}
          />
        )}
      />

      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Submit
      </button>

      {selectedFruit && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-500">Selected Fruit:</h3>
          <p className="text-sm text-gray-900">Label: {selectedFruit.label}</p>
          <p className="text-sm text-gray-900">Value: {selectedFruit.value}</p>
        </div>
      )}

      {/* <div className="p-4 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium text-gray-500">
          Current selection on Form:
        </h3>
        <p
          className={`mt-2 ${
            selectedFruit ? "text-gray-900" : "text-gray-500"
          }`}
        >
          {selectedFruit?.label ?? "None"}
        </p>
      </div>

      <div className="p-4 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium text-gray-500">
          Current selection on State:
        </h3>
        <p
          className={cn(
            "mt-2",
            getSelectedItem() ? "text-gray-900" : "text-gray-500"
          )}
        >
          {getSelectedItem()?.label ?? "None"}
        </p>
      </div> */}
    </form>
  );
}
