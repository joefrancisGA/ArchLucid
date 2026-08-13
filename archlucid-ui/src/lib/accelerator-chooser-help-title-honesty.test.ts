import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ACCELERATOR_CHOOSER_HELP_PAGE_TITLE } from "@/lib/accelerator-chooser-help-page-copy";
import {
  ACCELERATOR_CHOOSER_HELP_INBOUND_LABEL,
  ACCELERATOR_CHOOSER_HELP_TITLE_HONESTY_SOURCE_FILES,
  BANNED_ACCELERATOR_CHOOSER_HELP_CUSTOMER_TITLE_PATTERNS,
  sourceContainsBannedAcceleratorChooserHelpCustomerTitle,
  sourceDeclaresCanonicalAcceleratorChooserHelpTitle,
} from "@/lib/accelerator-chooser-help-title-honesty-surfaces";
import { getHelpCenterDisplay, getHelpCenterTier } from "@/lib/help/help-center-catalog";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { resolveProductDocumentationContentKind } from "@/lib/product-documentation-content-kinds";

function readTitleHonestySource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("accelerator-chooser help title/tier honesty (TB-1605)", () => {
  it("classifies accelerator-chooser as product-help with canonical buyer title", () => {
    const entry = getProductDocumentationEntry("accelerator-chooser");

    expect(entry).not.toBeNull();
    expect(entry?.title).toBe(ACCELERATOR_CHOOSER_HELP_PAGE_TITLE);
    expect(entry?.audience).toBe("operator");
    expect(resolveProductDocumentationContentKind("accelerator-chooser")).toBe("product-help");
    expect(getHelpCenterTier(entry!)).toBe("product");
    expect(getHelpCenterDisplay(entry!).title).toBe(ACCELERATOR_CHOOSER_HELP_PAGE_TITLE);
  });

  it("keeps listed inbound surfaces on canonical starter-proof title without engineering chooser jargon", () => {
    for (const relativePath of ACCELERATOR_CHOOSER_HELP_TITLE_HONESTY_SOURCE_FILES) {
      const source = readTitleHonestySource(relativePath);

      expect(sourceContainsBannedAcceleratorChooserHelpCustomerTitle(source), relativePath).toBe(false);
      expect(sourceDeclaresCanonicalAcceleratorChooserHelpTitle(source), relativePath).toBe(true);
    }
  });

  it("documents banned accelerator-chooser customer title patterns for reviewers", () => {
    expect(BANNED_ACCELERATOR_CHOOSER_HELP_CUSTOMER_TITLE_PATTERNS.length).toBeGreaterThan(0);
    expect(ACCELERATOR_CHOOSER_HELP_INBOUND_LABEL).toBe(ACCELERATOR_CHOOSER_HELP_PAGE_TITLE);
  });
});
