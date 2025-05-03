import { Check, XIcon } from "@/svgs";
import { useAutoComplete } from "../hooks/use-autocomplete";
import { cn } from "../utils";

export function CustomEntryExample({
  allowsCustomValue = true,
}: {
  allowsCustomValue?: boolean;
}) {
  const languages = ["JavaScript", "TypeScript", "Python", "Ruby"];

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
    isOpen,
    isCustomValue,
    getSelectedItem,
  } = useAutoComplete<string>({
    items: languages,
    allowsCustomValue,
    state: { label: "Choose or add a language" },
    asyncDebounceMs: 200,
    onFilterAsync: async ({ searchTerm }) =>
      languages.filter((lang) =>
        lang.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    itemToString: (lang) => lang,
  });

  const items = getItems() as string[];

  return (
    <div className="max-w-md">
      <label {...getLabelProps()} className="block mb-1">
        Choose or add a language
      </label>
      <div {...getRootProps()} className="relative">
        <input
          {...getInputProps()}
          placeholder="Type or add..."
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {hasSelectedItem() && (
          <button
            {...getClearProps()}
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XIcon />
          </button>
        )}

        {isOpen() && (
          <ul
            {...getListProps()}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {items.map((lang) => (
              <li
                key={lang}
                {...getOptionProps(lang)}
                className={cn(
                  "px-4 py-2 cursor-pointer hover:bg-gray-100",
                  getOptionState(lang).isActive && "bg-gray-100"
                )}
              >
                <div className="flex items-center justify-between">
                  {isCustomValue(lang) ? `Add "${lang}"` : lang}
                  {getOptionState(lang).isSelected && <Check />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {getSelectedItem() && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-500">Selected:</h3>
          <p className="mt-1 text-sm text-gray-900">
            {getSelectedItem() as string}
          </p>
        </div>
      )}
    </div>
  );
}
