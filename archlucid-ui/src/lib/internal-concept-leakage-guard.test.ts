import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  BUYER_SALES_LED_PRICING_NOTE,
  FORBIDDEN_WORKSPACE_ADMIN_ACCESS_MESSAGE,
} from "@/lib/buyer/buyer-polish-copy";
import { RUNS_EMPTY } from "@/lib/empty-state-presets";
import {
  INTERNAL_CONCEPT_LEAKAGE_BANNED_PATTERNS,
  INTERNAL_CONCEPT_LEAKAGE_SURFACES,
} from "@/lib/internal-concept-leakage-surfaces";
import { resolveHelpTopicPermanentRedirect } from "@/lib/help/help-topic-permanent-redirects";
import {
  getProductDocumentationEntry,
  inAppHelpHref,
} from "@/lib/product-documentation-registry";

describe("internal concept leakage guard (IA-013)", () => {
  it("keeps customer-facing surfaces free of internal rank and version labels", () => {
    for (const relativePath of INTERNAL_CONCEPT_LEAKAGE_SURFACES) {
      const source = readFileSync(path.join(process.cwd(), relativePath), "utf8");

      for (const pattern of INTERNAL_CONCEPT_LEAKAGE_BANNED_PATTERNS) {
        expect(source, `${relativePath} must not contain "${pattern}"`).not.toContain(pattern);
      }
    }
  });

  it("uses role phrasing for workspace-admin forbidden states", () => {
    expect(FORBIDDEN_WORKSPACE_ADMIN_ACCESS_MESSAGE).toContain("workspace administrator");
    expect(FORBIDDEN_WORKSPACE_ADMIN_ACCESS_MESSAGE).not.toMatch(/Authority/i);
  });

  it("rewords sales-led pricing without version labels", () => {
    expect(BUYER_SALES_LED_PRICING_NOTE.toLowerCase()).not.toContain("v1");
    expect(BUYER_SALES_LED_PRICING_NOTE).toContain("guided evaluation");
  });

  it("maps folded help topic aliases to canonical slugs (TB-1258 / TB-1739 / Batch A)", () => {
    expect(resolveHelpTopicPermanentRedirect("creating-runs")).toBe("/help/review-guide");
    expect(resolveHelpTopicPermanentRedirect("starting-reviews")).toBe("/help/review-guide");
    expect(getProductDocumentationEntry("review-guide")?.title).toBe("Review guide");
    expect(getProductDocumentationEntry("creating-runs")).toBeNull();
    expect(getProductDocumentationEntry("starting-reviews")).toBeNull();
    expect(inAppHelpHref("review-guide")).toBe("/help/review-guide");
    expect(inAppHelpHref("starting-reviews")).toBe("/help/review-guide");
  });

  it("points runs empty-state help at the canonical review-guide slug", () => {
    expect(RUNS_EMPTY.helpTopicPath).toBe("review-guide");
  });
});
