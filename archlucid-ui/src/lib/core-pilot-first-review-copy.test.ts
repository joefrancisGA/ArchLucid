import { describe, expect, it } from "vitest";

import {
  CORE_PILOT_ADVANCED_TOOLS_DEFERRAL_NOTE,
  CORE_PILOT_FIRST_REVIEW_HEADING,
  CORE_PILOT_FIRST_REVIEW_HEADING_COMPACT,
  CORE_PILOT_FIRST_REVIEW_MINIMIZED_BUTTON,
  CORE_PILOT_FIRST_SESSION_GUIDANCE_BULLETS,
  CORE_PILOT_WORKFLOW_SUMMARY_LINE,
} from "./core-pilot-first-review-copy";

/**
 * Locks buyer-first Core Pilot chrome (“architecture review” in UI). See docs/CORE_PILOT.md (first-session checklist).
 */
describe("core-pilot-first-review-copy (buyer first-run)", () => {
  it("uses outcome-first governed packaging language in primary heading", () => {
    expect(CORE_PILOT_FIRST_REVIEW_HEADING).toMatch(/governed/i);
    expect(CORE_PILOT_FIRST_REVIEW_HEADING).toMatch(/architecture review package/i);
    expect(CORE_PILOT_FIRST_REVIEW_HEADING).not.toMatch(/\brun\b/i);
  });

  it("keeps compact checklist label", () => {
    expect(CORE_PILOT_FIRST_REVIEW_HEADING_COMPACT).toContain("checklist");
  });

  it("summarizes the four-step flow with buyer concepts", () => {
    expect(CORE_PILOT_WORKFLOW_SUMMARY_LINE).toMatch(/create architecture review/i);
    expect(CORE_PILOT_WORKFLOW_SUMMARY_LINE).toMatch(/pipeline runs/i);
    expect(CORE_PILOT_WORKFLOW_SUMMARY_LINE).toMatch(/finalize/i);
    expect(CORE_PILOT_WORKFLOW_SUMMARY_LINE).toMatch(/review package/i);
  });

  it("labels the minimized first-review control consistently", () => {
    expect(CORE_PILOT_FIRST_REVIEW_MINIMIZED_BUTTON.toLowerCase()).toContain("checklist");
    expect(CORE_PILOT_FIRST_REVIEW_MINIMIZED_BUTTON.toLowerCase()).toContain("first");
  });

  it("keeps first-session guidance as four plain steps without manifest or Operate jargon", () => {
    expect(CORE_PILOT_FIRST_SESSION_GUIDANCE_BULLETS).toHaveLength(4);

    for (const bullet of CORE_PILOT_FIRST_SESSION_GUIDANCE_BULLETS) {
      expect(bullet.length).toBeGreaterThan(36);
      expect(bullet.length).toBeLessThan(400);
      expect(bullet.toLowerCase()).not.toMatch(/\bmanifest\b/);
      expect(bullet.toLowerCase()).not.toMatch(/\boperate\b/);
    }

    expect(CORE_PILOT_FIRST_SESSION_GUIDANCE_BULLETS.some((b) => b.toLowerCase().includes("finalize"))).toBe(true);
    expect(CORE_PILOT_FIRST_SESSION_GUIDANCE_BULLETS.some((b) => b.toLowerCase().includes("pipeline"))).toBe(true);
    expect(CORE_PILOT_FIRST_SESSION_GUIDANCE_BULLETS.some((b) => b.includes("Proof sendability"))).toBe(false);
  });

  it("defers advanced tools in a separate disclosure line", () => {
    expect(CORE_PILOT_ADVANCED_TOOLS_DEFERRAL_NOTE.toLowerCase()).toMatch(/compare|replay|graph/);
    expect(CORE_PILOT_ADVANCED_TOOLS_DEFERRAL_NOTE.toLowerCase()).toMatch(/show more/);
  });
});
