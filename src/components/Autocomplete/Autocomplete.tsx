import { useCallback, useEffect, useRef, useState } from "react";

export interface AutocompleteProps<T> {
  options: T[];
  value: T | null;
  onChange: (value: T | null) => void;
  getOptionLabel: (option: T) => string;
  renderOption?: (option: T) => React.ReactNode;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Autocomplete<T>({
  options,
  value,
  onChange,
  getOptionLabel,
  renderOption,
  placeholder = "Type to search...",
  className = "",
  disabled = false,
}: AutocompleteProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<T[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (value) {
      setInputValue(getOptionLabel(value));
    }
  }, [value, getOptionLabel]);

  const filterOptions = useCallback(
    (input: string) => {
      const normalized = input.toLowerCase();
      return options.filter((option) =>
        getOptionLabel(option).toLowerCase().includes(normalized)
      );
    },
    [options, getOptionLabel]
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    setFilteredOptions(filterOptions(newValue));
  };

  const handleOptionClick = (option: T) => {
    onChange(option);
    setIsOpen(false);
    setInputValue(getOptionLabel(option));
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setFilteredOptions(filterOptions(inputValue));
  };

  const handleInputBlur = () => {
    // Delay closing to allow click events on options
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {isOpen && filteredOptions.length > 0 && (
        <ul
          ref={listboxRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
          role="listbox"
        >
          {filteredOptions.map((option, index) => (
            <li
              key={getOptionLabel(option)}
              role="option"
              aria-selected={value === option}
              onClick={() => handleOptionClick(option)}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
            >
              {renderOption ? renderOption(option) : getOptionLabel(option)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
