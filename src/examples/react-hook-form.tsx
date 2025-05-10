import { fruits, type Fruit } from "@/datasets/fruit";
import { Check, XIcon } from "@/svgs";
import { cn } from "@/utils";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useAutoComplete } from "../hooks/use-autocomplete";

interface AutocompleteProps<T> {
  value?: T;
  onChange: (value: T | undefined) => void;
  items: T[];
  label: string;
  itemToString: (item: T) => string;
  onClear?: () => void;
}

export function ControllableAutocomplete<T>({
  value,
  onChange,
  items,
  label,
  itemToString,
  onClear,
}: AutocompleteProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    getRootProps,
    getLabelProps,
    getInputProps,
    getListProps,
    getOptionProps,
    getOptionState,
    getClearProps,
    hasSelectedItem,
    getItems,
  } = useAutoComplete<T>({
    items,
    state: {
      selectedValue: value,
      setSelectedValue: onChange,
      isOpen,
      setIsOpen,
      label,
    },
    asyncDebounceMs: 300,
    onFilterAsync: async ({ searchTerm }) =>
      items.filter((item) =>
        itemToString(item).toLowerCase().includes(searchTerm.toLowerCase())
      ),
    itemToString,
    // onClear: () => {
    //   // TODO why does RHF need to do this??? built in undefined doesn't fully fly when controlled?
    //   onChange("" as unknown as T);
    // },
    onClear,
  });

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
              getItems().map((item, index) => (
                <li
                  key={index}
                  {...getOptionProps(item)}
                  className={cn(
                    "px-4 py-2 cursor-pointer flex justify-between",
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

type FormValues = {
  fruit?: Fruit;
};

export function ReactHookFormExample() {
  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { fruit: undefined },
  });

  const onSubmit = (data: FormValues) => {
    console.log("Submitted:", data.fruit);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
      <Controller
        name="fruit"
        control={control}
        render={({ field }) => (
          <ControllableAutocomplete<Fruit>
            value={field.value}
            onChange={field.onChange}
            // RHF needs onChange to set to null not undefined
            onClear={() => {
              field.onChange(null);
            }}
            items={fruits}
            label="Fruit"
            itemToString={(f) => f.label}
          />
        )}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? "Saving…" : "Submit"}
      </button>
    </form>
  );
}
