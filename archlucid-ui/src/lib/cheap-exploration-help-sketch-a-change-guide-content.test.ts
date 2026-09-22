import { describe, expect, it } from "vitest";

import {
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_ALIASES,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_DESK_ENTRY_ROWS,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_FORBIDDEN_LINK_MARKERS,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_GUIDE_HEADINGS,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_NEGATION_DRIFT_MARKERS,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_OVERVIEW_LEAD,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PAGE_SUBTITLE,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RECORD_PRACTICE_BODY,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RELATED_TOPICS,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SEAL_COMPARE_BULLETS,
} from "@/lib/cheap-exploration-help-sketch-a-change-guide-content";
import { CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_CLAIM_DISCIPLINE } from "@/lib/cheap-exploration-help-sketch-a-change-evidence-copy";

describe("cheap-exploration-help-sketch-a-change-guide-content (CE-019 / HEK Phase 2)", () => {
  it("dedupes subtitle from overview lead and keeps overview positive-only", () => {
    expect(CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PAGE_SUBTITLE).not.toBe(
      CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_OVERVIEW_LEAD,
    );
    for (const marker of CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_NEGATION_DRIFT_MARKERS.overviewMustNotContain) {
      expect(CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_OVERVIEW_LEAD.toLowerCase()).not.toContain(
        marker.toLowerCase(),
      );
    }
    expect(CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_CLAIM_DISCIPLINE).toContain(
      CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_NEGATION_DRIFT_MARKERS.claimMustContain,
    );
  });

  it("uses Record and Practice user labels while preserving stored career and rehearsal tokens", () => {
    expect(CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RECORD_PRACTICE_BODY).toMatch(/Record/);
    expect(CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RECORD_PRACTICE_BODY).toMatch(/Practice/);
    expect(CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RECORD_PRACTICE_BODY).toMatch(/career/);
    expect(CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RECORD_PRACTICE_BODY).toMatch(/rehearsal/);
    expect(CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RECORD_PRACTICE_BODY).not.toMatch(/\bCareer\b/);
    expect(CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RECORD_PRACTICE_BODY).not.toMatch(/\bRehearsal\b/);
  });

  it("reuses branch cap, Compare, and no-unseal constants in seal section", () => {
    const joined = CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SEAL_COMPARE_BULLETS.join(" ");
    expect(joined).toMatch(/R12/);
    expect(joined).toMatch(/two finalized signed packages/i);
    expect(joined).toMatch(/no unseal/i);
    expect(joined).toMatch(/What-if branch cap \(R12\)/);
    expect(joined).toMatch(/draft-to-draft Compare/i);
  });

  it("documents desk and palette entry without forbidden blob links", () => {
    for (const row of CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_DESK_ENTRY_ROWS) {
      for (const marker of CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_FORBIDDEN_LINK_MARKERS) {
        expect(row.detail).not.toContain(marker);
      }
    }
    expect(
      CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_DESK_ENTRY_ROWS.some((row) => row.surface.includes("Command palette")),
    ).toBe(true);
  });

  it("ships anchored guide headings for TOC and scroll-spy", () => {
    expect(CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_GUIDE_HEADINGS.length).toBeGreaterThanOrEqual(8);
    const ids = new Set(CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_GUIDE_HEADINGS.map((h) => h.id));
    expect(ids.size).toBe(CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_GUIDE_HEADINGS.length);
    expect(ids.has("help-sketch-a-change-desk-entry")).toBe(true);
    expect(ids.has("help-sketch-a-change-seal-compare")).toBe(true);
  });

  it("registers search aliases and related in-app help links", () => {
    expect(CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_ALIASES.length).toBeGreaterThanOrEqual(5);
    for (const topic of CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RELATED_TOPICS) {
      expect(topic.href.startsWith("/help/")).toBe(true);
      for (const marker of CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_FORBIDDEN_LINK_MARKERS) {
        expect(topic.href).not.toContain(marker);
      }
    }
  });
});
