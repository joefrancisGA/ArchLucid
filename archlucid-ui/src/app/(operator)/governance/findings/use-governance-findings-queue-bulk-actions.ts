"use client";

import { useCallback, useState } from "react";

export function useGovernanceFindingsQueueBulkActions(options: { readonly refresh: () => void }) {
  const { refresh } = options;
  const [selectedFindingIds, setSelectedFindingIds] = useState<ReadonlySet<string>>(() => new Set());

  const onBulkApplied = useCallback(() => {
    setSelectedFindingIds(new Set());
    refresh();
  }, [refresh]);

  return {
    selectedFindingIds,
    onSelectionChange: setSelectedFindingIds,
    onBulkApplied,
  };
}
