import { describe, expect, it } from "vitest";

import { passThrough } from "./proxy-passthrough";

describe("passThrough comparison record id", () => {
  it("forwards X-ArchLucid-ComparisonRecordId from the upstream summary", async () => {
    const upstream = new Response("{}", {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-ArchLucid-ComparisonRecordId": "  cmp-1  ",
      },
    });
    const out = await passThrough(upstream);

    expect(out.headers.get("X-ArchLucid-ComparisonRecordId")).toBe("cmp-1");
  });
});