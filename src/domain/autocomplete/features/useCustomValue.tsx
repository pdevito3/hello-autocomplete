import { useCallback } from "react";

export function useCustomValue<T>(
  items: T[],
  inputValue: string,
  itemToString: (item: T) => string,
  allowsCustomValue: boolean
) {
  const isCustomValue = useCallback(
    (item: T) => {
      return (
        allowsCustomValue &&
        inputValue.trim() !== "" &&
        itemToString(item) === inputValue &&
        !items.some((it) => itemToString(it) === inputValue)
      );
    },
    [allowsCustomValue, inputValue, itemToString, items]
  );

  return { isCustomValue };
}
