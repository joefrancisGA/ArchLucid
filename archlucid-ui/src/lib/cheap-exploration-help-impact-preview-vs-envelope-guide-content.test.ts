import { describe, expect, it } from "vitest";

import {
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_ALIASES,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_COMPARISON_ROWS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CONTRASTED_PATHS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_FORBIDDEN_LINK_MARKERS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_GUIDE_HEADINGS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_NEGATION_DRIFT_MARKERS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OVERVIEW_LEAD,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PAGE_SUBTITLE,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_R12_BODY,
} from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-guide-content";
import { CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CLAIM_DISCIPLINE } from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-evidence-copy";

describe("cheap-exploration-help-impact-preview-vs-envelope-guide-content (CE-020 / EIM Phase 2)", () => {
  it("dedupes subtitle from overview lead and keeps overview positive-only", () => {
    expect(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PAGE_SUBTITLE).not.toBe(
      CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OVERVIEW_LEAD,
    );
    for (const marker of CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_NEGATION_DRIFT_MARKERS.overviewMustNotContain) {
      expect(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OVERVIEW_LEAD.toLowerCase()).not.toContain(
        marker.toLowerCase(),
      );
    }
    expect(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CLAIM_DISCIPLINE).toContain(
      CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_NEGATION_DRIFT_MARKERS.claimMustContain,
    );
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

  it("resolves R12 and draft-to-draft Compare honesty", () => {
    expect(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_R12_BODY).toMatch(/R12/);
    expect(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_R12_BODY).toMatch(/two finalized signed packages/i);
    expect(
      CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_COMPARISON_ROWS.some((row) =>
        /draft-to-draft Compare/i.test(`${row.impactPreview} ${row.sketchAChange}`),
      ),
    ).toBe(true);
  });

  it("uses in-app help and workspace links for contrasted paths", () => {
    for (const path of CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CONTRASTED_PATHS) {
      expect(path.helpHref.startsWith("/help/")).toBe(true);
      expect(path.workspaceHref.startsWith("/")).toBe(true);
      for (const marker of CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_FORBIDDEN_LINK_MARKERS) {
        expect(path.helpHref).not.toContain(marker);
        expect(path.workspaceHref).not.toContain(marker);
      }
    }
  });

  it("ships anchored guide headings for TOC and scroll-spy", () => {
    expect(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_GUIDE_HEADINGS.length).toBeGreaterThanOrEqual(8);
    const ids = new Set(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_GUIDE_HEADINGS.map((h) => h.id));
    expect(ids.size).toBe(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_GUIDE_HEADINGS.length);
    expect(ids.has("help-impact-preview-vs-envelope-comparison")).toBe(true);
    expect(ids.has("help-impact-preview-vs-envelope-contrasted-paths")).toBe(true);
  });

  it("registers search aliases without resurrecting Career blocked labels", () => {
    expect(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_ALIASES.length).toBeGreaterThanOrEqual(5);
    const joined = CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_ALIASES.join(" ").toLowerCase();
    expect(joined).not.toContain("career blocked");
  });
});
