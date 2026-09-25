import { describe, expect, it } from "vitest";

import {
  assertEvidenceSourceInspectHelpStoredEvidenceGuideLinksAllowed,
  collectEvidenceSourceInspectHelpStoredEvidenceGuideHrefs,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_APPLICABILITY_WORKING,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_AUDIT_BODY,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CITATION_BODY,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CONTROLS_BODY,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_DOWNLOAD_ONLY_BODY,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_FORBIDDEN_LINK_MARKERS,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_GUIDE_HEADINGS,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_OVERVIEW_LEAD,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PAGE_SUBTITLE,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PREVIEW_KEYBOARD_ROWS,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_RELATED_LINKS,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SAFETY_BODY,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TECHNICAL_REFERENCE_IDENTIFIERS,
  helpTopicSlugFromInAppHref,
} from "@/lib/evidence-source-inspect-help-stored-evidence-guide-content";
import { isHelpTopicExcludedForProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";

describe("evidence-source-inspect-help-stored-evidence-guide-content (ESI-08 / EIN Phase 1)", () => {
  it("dedupes subtitle from overview lead and omits internal backlog id", () => {
    expect(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PAGE_SUBTITLE).not.toBe(
      EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_OVERVIEW_LEAD,
    );
    expect(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PAGE_SUBTITLE).not.toContain("ESI-08");
    expect(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PAGE_SUBTITLE).not.toMatch(/sealed package/i);
    expect(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CONTROLS_BODY).toMatch(/no separate Open button/i);
  });

  it("keeps sealed-record denial in the safety callout only above the fold", () => {
    expect(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SAFETY_BODY).toMatch(/sealed package ZIP/i);
    expect(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SAFETY_BODY.endsWith(".")).toBe(true);
    expect(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PAGE_SUBTITLE).not.toMatch(/sealed package/i);
  });

  it("removes engineering identifiers from proportional prose", () => {
    const prose = [
      EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_DOWNLOAD_ONLY_BODY,
      EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CITATION_BODY,
      EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_AUDIT_BODY,
      EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_APPLICABILITY_WORKING,
    ].join(" ");

    for (const identifier of EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TECHNICAL_REFERENCE_IDENTIFIERS) {
      expect(prose).not.toContain(identifier);
    }

    expect(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_APPLICABILITY_WORKING).not.toMatch(/FindingId/i);
  });

  it("lists each engineering identifier exactly once in technical reference", () => {
    expect(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TECHNICAL_REFERENCE_IDENTIFIERS).toHaveLength(6);
    expect(new Set(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TECHNICAL_REFERENCE_IDENTIFIERS).size).toBe(6);
  });

  it("documents verified preview keyboard paths", () => {
    const serialized = EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PREVIEW_KEYBOARD_ROWS.map((row) => row.keys).join(" ");
    expect(serialized).toMatch(/Enter or Space/i);
    expect(serialized).toMatch(/Tab/i);
    expect(serialized).toMatch(/Escape/i);
  });

  it("uses in-app help links only on related navigation rows", () => {
    for (const link of EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_RELATED_LINKS) {
      expect(link.href.startsWith("/help/") || link.href.startsWith("/architecture/")).toBe(true);
      for (const marker of EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_FORBIDDEN_LINK_MARKERS) {
        expect(link.href).not.toContain(marker);
      }
    }
  });

  it("does not link to excluded help topics for architecture render lines", () => {
    const hrefs = collectEvidenceSourceInspectHelpStoredEvidenceGuideHrefs();
    const unique = new Set(hrefs);
    expect(unique.size).toBe(hrefs.length);

    for (const href of hrefs) {
      const slug = helpTopicSlugFromInAppHref(href);
      if (slug !== null) {
        expect(isHelpTopicExcludedForProductLine(slug, "architecture")).toBe(false);
      }
    }

    expect(() => assertEvidenceSourceInspectHelpStoredEvidenceGuideLinksAllowed("architecture")).not.toThrow();
  });

  it("ships anchored guide headings for TOC and scroll-spy", () => {
    expect(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_GUIDE_HEADINGS.length).toBeLessThanOrEqual(10);
    const ids = new Set(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_GUIDE_HEADINGS.map((h) => h.id));
    expect(ids.size).toBe(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_GUIDE_HEADINGS.length);
    expect(ids.has("help-inspect-stored-evidence-citation-only")).toBe(true);
    expect(ids.has("help-inspect-stored-evidence-related-topics")).toBe(true);
    expect(ids.has("help-inspect-stored-evidence-purpose-links")).toBe(false);
  });
});
