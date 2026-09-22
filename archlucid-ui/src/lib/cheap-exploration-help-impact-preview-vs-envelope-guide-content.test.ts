import { describe, expect, it } from "vitest";

import {
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_ALIASES,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_COMPARISON_ROWS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_FORBIDDEN_LINK_MARKERS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_GUIDE_HEADINGS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_MODE_RELATION_BODY,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_NEGATION_DRIFT_MARKERS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OPEN_WORKSPACE_PATHS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OVERVIEW_LEAD,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PAGE_SUBTITLE,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RECORD_PRACTICE_BODY,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_LINKS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TECHNICAL_IDENTIFIERS,
} from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-guide-content";
import { CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CLAIM_DISCIPLINE } from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-evidence-copy";

describe("cheap-exploration-help-impact-preview-vs-envelope-guide-content (CE-020 / EIM Phase 1)", () => {
  it("dedupes subtitle from overview lead and keeps overview positive-only", () => {
    expect(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PAGE_SUBTITLE).not.toBe(
      CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OVERVIEW_LEAD,
    );
    expect(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PAGE_SUBTITLE).not.toMatch(/CE-020|SN-007|ADR 0092/);
    for (const marker of CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_NEGATION_DRIFT_MARKERS.overviewMustNotContain) {
      expect(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OVERVIEW_LEAD.toLowerCase()).not.toContain(
        marker.toLowerCase(),
      );
    }
    expect(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CLAIM_DISCIPLINE).toContain(
      CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_NEGATION_DRIFT_MARKERS.claimMustContain,
    );
    expect(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CLAIM_DISCIPLINE).toMatch(/sealed review record/i);
    expect(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CLAIM_DISCIPLINE).not.toMatch(/Sources package/i);
  });

  it("uses Record and Practice user labels while preserving stored career and rehearsal tokens", () => {
    const joined = CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_COMPARISON_ROWS.map((r) => r.sketchAChange).join(
      " ",
    );
    expect(joined).toMatch(/Record/);
    expect(joined).toMatch(/Practice/);
    expect(joined).toMatch(/career/);
    expect(joined).toMatch(/rehearsal/);
    expect(joined).not.toMatch(/\bCareer\b/);
    expect(joined).not.toMatch(/\bRehearsal\b/);
  });

  it("defines R12 once in technical mapping and merges Compare use cells", () => {
    const compareRow = CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_COMPARISON_ROWS.find(
      (row) => row.aspect === "Compare use",
    );
    expect(compareRow?.impactPreview).toBe(compareRow?.sketchAChange);
    expect(
      CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TECHNICAL_IDENTIFIERS.some((row) => row.id === "R12"),
    ).toBe(true);
    expect(
      CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_COMPARISON_ROWS.some((row) =>
        /R12/i.test(`${row.impactPreview} ${row.sketchAChange}`),
      ),
    ).toBe(false);
  });

  it("avoids banned job jargon and defines spawn lock in applicability copy", () => {
    expect(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_MODE_RELATION_BODY).not.toMatch(/\bjob\b/i);
    expect(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RECORD_PRACTICE_BODY).not.toMatch(/\bjob\b/i);
    expect(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OVERVIEW_LEAD.toLowerCase()).toContain("cheap envelope");
  });

  it("uses real workspace routes for open paths", () => {
    for (const path of CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OPEN_WORKSPACE_PATHS) {
      expect(path.helpHref.startsWith("/help/")).toBe(true);
      expect(path.workspaceHref.startsWith("/")).toBe(true);
      expect(path.workspaceHref).not.toMatch(/^\/help\//);
      for (const marker of CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_FORBIDDEN_LINK_MARKERS) {
        expect(path.helpHref).not.toContain(marker);
        expect(path.workspaceHref).not.toContain(marker);
      }
    }
  });

  it("ships anchored guide headings for TOC and scroll-spy without contrasted-paths or where-to-go-next", () => {
    const ids = new Set(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_GUIDE_HEADINGS.map((h) => h.id));
    expect(ids.size).toBe(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_GUIDE_HEADINGS.length);
    expect(ids.has("help-impact-preview-vs-envelope-comparison")).toBe(true);
    expect(ids.has("help-impact-preview-vs-envelope-contrasted-paths")).toBe(false);
    expect(ids.has("help-impact-preview-vs-envelope-where-to-go-next")).toBe(false);
    expect(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_GUIDE_HEADINGS.length).toBeLessThanOrEqual(7);
  });

  it("dedupes merged related links", () => {
    const hrefs = CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_LINKS.map((link) => link.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("registers search aliases without resurrecting Career blocked labels", () => {
    expect(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_ALIASES.length).toBeGreaterThanOrEqual(5);
    const joined = CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_ALIASES.join(" ").toLowerCase();
    expect(joined).not.toContain("career blocked");
    expect(joined).toContain("spawn lock");
  });
});
