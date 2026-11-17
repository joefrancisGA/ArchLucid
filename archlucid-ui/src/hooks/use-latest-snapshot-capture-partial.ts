"use client";

import { useQuery } from "@tanstack/react-query";

import { resolveLatestSnapshotCaptureIsPartial } from "@/lib/product-line/resolve-latest-snapshot-capture-partial";

export function useLatestSnapshotCaptureIsPartial(enabled: boolean): boolean {
  const query = useQuery({
    queryKey: ["securenow", "latest-snapshot-capture-partial"],
    queryFn: resolveLatestSnapshotCaptureIsPartial,
    enabled,
    retry: false,
    staleTime: 60_000,
  });

  return query.data === true;
}