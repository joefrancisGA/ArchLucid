import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ADMIN_DIAGNOSTICS_HELP_PAGE_TITLE } from "@/lib/admin-diagnostics-help-page-copy";
import {
  ADMIN_DIAGNOSTICS_HELP_INBOUND_LABEL,
  ADMIN_DIAGNOSTICS_HELP_TITLE_HONESTY_SOURCE_FILES,
  BANNED_ADMIN_DIAGNOSTICS_HELP_CUSTOMER_TITLE_PATTERNS,
  sourceContainsBannedAdminDiagnosticsHelpCustomerTitle,
  sourceDeclaresCanonicalAdminDiagnosticsHelpTitle,
} from "@/lib/admin-diagnostics-help-title-honesty-surfaces";
import { getHelpCenterDisplay, getHelpCenterTier } from "@/lib/help/help-center-catalog";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { resolveProductDocumentationContentKind } from "@/lib/product-documentation-content-kinds";

function readTitleHonestySource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("admin-diagnostics help title/tier honesty (TB-1610, TB-1611)", () => {
  it("classifies admin-diagnostics as product-help with canonical buyer title", () => {
    const entry = getProductDocumentationEntry("admin-diagnostics");

    expect(entry).not.toBeNull();
    expect(entry?.title).toBe(ADMIN_DIAGNOSTICS_HELP_PAGE_TITLE);
    expect(entry?.audience).toBe("operator");
    expect(resolveProductDocumentationContentKind("admin-diagnostics")).toBe("product-help");
    expect(getHelpCenterTier(entry!)).toBe("product");
    expect(getHelpCenterDisplay(entry!).title).toBe(ADMIN_DIAGNOSTICS_HELP_PAGE_TITLE);
  });

  it("keeps listed inbound surfaces on canonical platform-health title without engineering diagnostics jargon", () => {
    for (const relativePath of ADMIN_DIAGNOSTICS_HELP_TITLE_HONESTY_SOURCE_FILES) {
      const source = readTitleHonestySource(relativePath);

      expect(sourceContainsBannedAdminDiagnosticsHelpCustomerTitle(source), relativePath).toBe(false);
      expect(sourceDeclaresCanonicalAdminDiagnosticsHelpTitle(source), relativePath).toBe(true);
    }
  });

  it("documents banned admin-diagnostics customer title patterns for reviewers", () => {
    expect(BANNED_ADMIN_DIAGNOSTICS_HELP_CUSTOMER_TITLE_PATTERNS.length).toBeGreaterThan(0);
    expect(ADMIN_DIAGNOSTICS_HELP_INBOUND_LABEL).toBe(ADMIN_DIAGNOSTICS_HELP_PAGE_TITLE);
  });
});
