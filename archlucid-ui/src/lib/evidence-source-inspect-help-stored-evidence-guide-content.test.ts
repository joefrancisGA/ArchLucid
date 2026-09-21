import { describe, expect, it } from "vitest";

import { EVIDENCE_SOURCE_INSPECT_PREVIEW_DIALOG_HONESTY } from "@/lib/evidence-source-inspect-sealed-honesty";
import {
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_AUDIT_BODY,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CONTROLS_BODY,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_FORBIDDEN_LINK_MARKERS,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_GUIDE_HEADINGS,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_OVERVIEW_LEAD,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PAGE_SUBTITLE,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PURPOSE_LINKS,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SAFETY_BODY,
} from "@/lib/evidence-source-inspect-help-stored-evidence-guide-content";

describe("evidence-source-inspect-help-stored-evidence-guide-content (ESI-08 / EIN Phase 2)", () => {
  it("dedupes subtitle from overview lead and corrects Open vs file-name preview copy", () => {
    expect(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PAGE_SUBTITLE).not.toBe(
      EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_OVERVIEW_LEAD,
    );
    expect(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CONTROLS_BODY).toMatch(/no separate Open button/i);
    expect(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CONTROLS_BODY).not.toMatch(
      /Open and Download controls/i,
    );
  });

  it("includes canonical sealed-record denial and audit identifiers", () => {
    expect(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SAFETY_BODY).toContain(
      EVIDENCE_SOURCE_INSPECT_PREVIEW_DIALOG_HONESTY,
    );
    expect(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_AUDIT_BODY).toMatch(/ReadAuthority/);
    expect(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_AUDIT_BODY).toMatch(/EvidenceSourceOpened/);
    expect(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_AUDIT_BODY).not.toMatch(/SealedPackageOpened/i);
  });

  it("uses in-app help links only on purpose navigation rows", () => {
    for (const link of EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PURPOSE_LINKS) {
      expect(link.href.startsWith("/help/") || link.href.startsWith("/architecture/")).toBe(true);
      for (const marker of EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_FORBIDDEN_LINK_MARKERS) {
        expect(link.href).not.toContain(marker);
      }
    }
  });

  it("ships anchored guide headings for TOC and scroll-spy", () => {
    expect(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_GUIDE_HEADINGS.length).toBeGreaterThanOrEqual(10);
    const ids = new Set(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_GUIDE_HEADINGS.map((h) => h.id));
    expect(ids.size).toBe(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_GUIDE_HEADINGS.length);
    expect(ids.has("help-inspect-stored-evidence-citation-only")).toBe(true);
    expect(ids.has("help-inspect-stored-evidence-purpose-links")).toBe(true);
  });
});
