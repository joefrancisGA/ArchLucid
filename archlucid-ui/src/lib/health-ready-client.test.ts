import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchHealthReadySummaryCached,
  invalidateHealthReadySummaryCache,
} from "@/lib/health-ready-client";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";

vi.mock("@/lib/fetch-health-ready", () => ({
  fetchHealthReadySummary: vi.fn(async () => ({
    status: "Healthy",
    entries: [],
  })),
}));

import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";

describe("fetchHealthReadySummaryCached", () => {
  beforeEach(async () => {
    resetOperatorQueryClientForTests();
    await invalidateHealthReadySummaryCache();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("dedupes concurrent reads into one upstream call", async () => {
    const [first, second] = await Promise.all([
      fetchHealthReadySummaryCached(),
      fetchHealthReadySummaryCached(),
    ]);

    expect(first).toEqual({ status: "Healthy", entries: [] });
    expect(second).toEqual(first);
    expect(fetchHealthReadySummary).toHaveBeenCalledTimes(1);
  });

  it("refetches when force is true", async () => {
    await fetchHealthReadySummaryCached();
    await fetchHealthReadySummaryCached({ force: true });

    expect(fetchHealthReadySummary).toHaveBeenCalledTimes(2);
  });
});
