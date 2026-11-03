import { afterEach, describe, expect, it } from "vitest";

import {
  getOperatorQueryClient,
  resetOperatorQueryClientForTests,
} from "@/lib/query/operator-query-client";

describe("operator query client test isolation", () => {
  afterEach(() => {
    resetOperatorQueryClientForTests();
  });

  it("evicts cached tenant data and releases the previous client", () => {
    const queryKey = ["tenant", "tenant-a", "findings"] as const;
    const previous = getOperatorQueryClient();
    previous.setQueryData(queryKey, { findings: [{ id: "finding-a" }] });
    expect(previous.getQueryCache().getAll()).toHaveLength(1);

    resetOperatorQueryClientForTests();

    // Dropping the singleton without clearing leaves cached data and its GC
    // timer alive for the configured five-minute inactive-query window.
    expect(previous.getQueryCache().getAll()).toHaveLength(0);
    const next = getOperatorQueryClient();
    expect(next).not.toBe(previous);
    expect(next.getQueryData(queryKey)).toBeUndefined();
  });
});
