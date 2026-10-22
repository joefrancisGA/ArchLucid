import { describe, expect, it } from "vitest";

import { findProductLinksTargetingRedirectSources } from "@/lib/product-link-redirect-guard";

describe("product-link-redirect-guard (IA-012)", () => {
  it("does not ship product hrefs targeting next.config permanent redirect sources", () => {
    const violations = findProductLinksTargetingRedirectSources();

    expect(
      violations,
      violations.map((row) => `${row.relativePath}:${row.line} → ${row.href}`).join("\n"),
    ).toEqual([]);
  });
});
