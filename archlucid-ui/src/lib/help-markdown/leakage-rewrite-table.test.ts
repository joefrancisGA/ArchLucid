import { describe, expect, it } from "vitest";

import {
  applyLeakageRewriteTable,
  applyLeakageRewriteTableThenCleanup,
} from "./leakage-rewrite-table";
import { PROCUREMENT_LEAKAGE_REWRITES } from "./contributor-leakage-rewrite-tables";
import { stripProcurementContributorLeakage } from "./contributor-leakage";

describe("applyLeakageRewriteTable", () => {
  it("applies rules in order", () => {
    const result = applyLeakageRewriteTable("alpha beta", [
      { pattern: /alpha/g, replacement: "one" },
      { pattern: /one beta/g, replacement: "done" },
    ]);

    expect(result).toBe("done");
  });

  it("collapses blank runs when using cleanup helper", () => {
    const result = applyLeakageRewriteTableThenCleanup("a\n\n\n\nb\n", [
      { pattern: /a/g, replacement: "a" },
    ]);

    expect(result).toBe("a\n\nb");
  });
});

describe("PROCUREMENT_LEAKAGE_REWRITES", () => {
  it("matches stripProcurementContributorLeakage doc-path rewrites", () => {
    const source = "See V1_SCOPE.md and SECURITY.md plus infra/terraform-entra/";
    const tableOnly = applyLeakageRewriteTable(source, PROCUREMENT_LEAKAGE_REWRITES);
    const viaExport = stripProcurementContributorLeakage(source);

    expect(tableOnly).toContain("product scope");
    expect(tableOnly).toContain("security documentation");
    expect(tableOnly).toContain("hosted identity samples");
    expect(viaExport).toContain("product scope");
  });
});
