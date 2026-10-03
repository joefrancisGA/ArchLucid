import { describe, expect, it } from "vitest";

import { config } from "./proxy";

describe("Next proxy matcher", () => {
  it("explicitly applies host gating to JSON API proxy paths", () => {
    expect(config.matcher).toContain("/api/proxy/:path*");
  });
});
