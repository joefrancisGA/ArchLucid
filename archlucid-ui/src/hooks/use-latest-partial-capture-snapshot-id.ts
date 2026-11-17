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

  const id = query.data?.trim() ?? "";

  return id.length > 0 ? id : null;
}