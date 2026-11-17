import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchCollectionRuns } from "@/lib/collection-runs-api";

describe("fetchCollectionRuns", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(["", '{"items":[]}', '[{"runId":"run-1"},null]'])(
    "rejects a malformed successful collection history response (%j)",
    async (body) => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body)));

      await expect(fetchCollectionRuns()).rejects.toThrow("Invalid collection history response.");
    },
  );

  it("returns an empty list when the API explicitly returns an empty array", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("[]")));

    await expect(fetchCollectionRuns()).resolves.toEqual([]);
  });
});
