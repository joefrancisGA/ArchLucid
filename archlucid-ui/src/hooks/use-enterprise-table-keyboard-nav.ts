import { useCallback, useState, type KeyboardEvent } from "react";

export type UseEnterpriseTableKeyboardNavOptions = {
  readonly rowCount: number;
  readonly onActivateRow: (index: number) => void;
};

export type UseEnterpriseTableKeyboardNavResult = {
  readonly focusedRowIndex: number;
  readonly onTableKeyDown: (event: KeyboardEvent) => void;
  readonly isRowFocused: (index: number) => boolean;
};

/** j/k row focus and Enter activation for dense enterprise finding tables. */
export function useEnterpriseTableKeyboardNav(
  options: UseEnterpriseTableKeyboardNavOptions,
): UseEnterpriseTableKeyboardNavResult {
  const [focusedRowIndex, setFocusedRowIndex] = useState(0);

  const onTableKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (options.rowCount <= 0) {
        return;
      }

      if (event.key === "j" || event.key === "ArrowDown") {
        event.preventDefault();
        setFocusedRowIndex((index) => Math.min(options.rowCount - 1, index + 1));

        return;
      }

      if (event.key === "k" || event.key === "ArrowUp") {
        event.preventDefault();
        setFocusedRowIndex((index) => Math.max(0, index - 1));

        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        options.onActivateRow(focusedRowIndex);
      }
    },
    [focusedRowIndex, options],
  );

  const isRowFocused = useCallback((index: number) => index === focusedRowIndex, [focusedRowIndex]);

  return {
    focusedRowIndex,
    onTableKeyDown,
    isRowFocused,
  };
}
