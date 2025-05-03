import { Check, XIcon } from "@/svgs";
import { useAutoComplete } from "../hooks/use-autocomplete";
import { cn } from "../utils";

interface LinkItem {
  id: number;
  name: string;
  url: string;
}

const links: LinkItem[] = [
  { id: 1, name: "Google", url: "https://www.google.com" },
  { id: 2, name: "GitHub", url: "https://github.com" },
  { id: 3, name: "Twitter", url: "https://twitter.com" },
  { id: 4, name: "Stack Overflow", url: "https://stackoverflow.com" },
  { id: 5, name: "MDN Web Docs", url: "https://developer.mozilla.org" },
];

export function LinkOptionsExample() {
  const {
    getRootProps,
    getLabelProps,
    getInputProps,
    getListProps,
    getOptionProps,
    getOptionLinkProps,
    getOptionState,
    getItems,
    getClearProps,
    hasSelectedItem,
    isOpen,
    getSelectedItem,
  } = useAutoComplete<LinkItem>({
    items: links,
    getOptionLink: (item) => item.url,
    state: {
      label: "Search links",
    },
    asyncDebounceMs: 300,
    onFilterAsync: async ({ searchTerm }) =>
      links.filter((link) =>
        link.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    itemToString: (link) => link.name,
  });

  return (
    <div className="max-w-md">
      <div className="relative">
        <label {...getLabelProps()}>Search links</label>
        <div {...getRootProps()} className="relative">
          <input
            {...getInputProps()}
            placeholder="Type to search..."
            className="w-full px-3 py-2 border rounded-md border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {hasSelectedItem() && (
            <button
              type="button"
              {...getClearProps()}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none bg-transparent"
            >
              <XIcon />
            </button>
          )}

          {isOpen() && (
            <ul
              {...getListProps()}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
            >
              {getItems().length === 0 ? (
                <li className="px-4 py-2 text-gray-500">No results found</li>
              ) : (
                getItems().map((link) => (
                  <li
                    key={link.id}
                    {...getOptionProps(link)}
                    className={cn(
                      "px-4 py-2 cursor-pointer hover:bg-gray-100",
                      getOptionState(link).isActive && "bg-gray-100"
                    )}
                  >
                    <a
                      {...getOptionLinkProps(link)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between w-full"
                    >
                      <span>{link.name}</span>
                      {getOptionState(link).isSelected && (
                        <Check className="text-blue-500" />
                      )}
                    </a>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>

      {getSelectedItem() && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-500">Selected Link:</h3>
          <div className="mt-2">
            <p className="text-sm text-gray-900">
              Name: {getSelectedItem()!.name}
            </p>
            <p className="text-sm text-blue-600 underline">
              URL:{" "}
              <a
                href={getSelectedItem()!.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {getSelectedItem()!.url}
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
