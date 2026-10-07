import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { config, proxy } from "./proxy";

describe("Next proxy matcher", () => {
  it("explicitly applies host gating to JSON API proxy paths", () => {
    expect(config.matcher).toContain("/api/proxy/:path*");
  });
});

describe("proxy demo-run alias redirect", () => {
  it("preserves query string when rewriting /runs alias paths", () => {
    const request = new NextRequest(
      "http://localhost:3000/runs/customer-intake-modernization-run/findings?src=email",
    );

    const response = proxy(request);

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/architecture/reviews/customer-intake-modernization/findings?src=email",
    );
  });
});
