import { useDebouncedValue } from "@/hooks/use-debounced-value";
import React, { useCallback, useEffect, useRef } from "react";

export function useFiltering<T>(
  inputValue: string,
  setItems: React.Dispatch<React.SetStateAction<T[]>>,
  abortControllerRef: React.RefObject<AbortController | null>,
  onFilterAsync?: (params: {
    searchTerm: string;
    signal: AbortSignal;
  }) => Promise<T[]>,
  asyncDebounceMs: number = 0
) {
  const onFilterAsyncRef = useRef(onFilterAsync);
  useEffect(() => {
    onFilterAsyncRef.current = onFilterAsync;
  }, [onFilterAsync]);

  const debouncedAsyncOperation = useCallback(
    async (value: string) => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      try {
        const filterFn = onFilterAsyncRef.current;
        if (filterFn) {
          const results = await filterFn({
            searchTerm: value,
            signal: abortControllerRef.current!.signal,
          });
          setItems(results);
        }
      } catch (err) {
        if (!(err instanceof Error && err.name === "AbortError"))
          console.error(err);
      }
    },
    [abortControllerRef, setItems]
  );

  const [debouncedInputValue] = useDebouncedValue(inputValue, asyncDebounceMs);
  useEffect(() => {
    if (onFilterAsyncRef.current) debouncedAsyncOperation(debouncedInputValue);
  }, [debouncedInputValue, debouncedAsyncOperation]);
}
