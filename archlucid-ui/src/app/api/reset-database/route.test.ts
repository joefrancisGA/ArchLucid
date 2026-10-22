import { describe, expect, it } from "vitest";

import { maxDuration } from "@/app/api/reset-database/route";
import { PROXY_UPSTREAM_CATALOG_RESET_FETCH_TIMEOUT_MS } from "@/lib/server-fetch-timeouts";

describe("POST /api/reset-database", () => {
  it("allows the Next.js route to run for 10 minutes", () => {
    expect(maxDuration).toBe(600);
    expect(PROXY_UPSTREAM_CATALOG_RESET_FETCH_TIMEOUT_MS).toBe(600_000);
  });
});
