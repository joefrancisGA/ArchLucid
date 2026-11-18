"use client";

import { useQuery } from "@tanstack/react-query";

import { resolveLatestPartialCaptureSnapshotId } from "@/lib/product-line/resolve-latest-partial-capture-snapshot-id";

export function useLatestPartialCaptureSnapshotId(enabled: boolean): string | null {
  const query = useQuery({
    queryKey: ["securenow", "latest-partial-capture-snapshot-id"],
    queryFn: resolveLatestPartialCaptureSnapshotId,
    enabled,
    retry: false,
    staleTime: 60_000,
  });

  // An unknown cache value is not a valid evidence snapshot ID.
  const id = typeof query.data === "string" ? query.data.trim() : "";

  return id.length > 0 ? id : null;
}