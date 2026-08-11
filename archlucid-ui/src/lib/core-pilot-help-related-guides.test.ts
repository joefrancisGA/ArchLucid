import { describe, expect, it } from "vitest";

import {
  CORE_PILOT_HELP_CANONICAL_PATH,
  CORE_PILOT_HELP_SOURCES,
} from "@/lib/core-pilot-help-evidence-copy";
import {
  CORE_PILOT_HELP_DEPTH_GUIDES,
  CORE_PILOT_HELP_IN_PRODUCT_CHECKLIST_LABEL,
  CORE_PILOT_HELP_PRIMARY_ACTIONS,
} from "@/lib/core-pilot-help-guide-content";
import { corePilotHelpRelatedGuides } from "@/lib/core-pilot-help-related-guides";

describe("corePilotHelpRelatedGuides", () => {
  it("keeps curated depth guides first", () => {
    const guides = corePilotHelpRelatedGuides();
    const leading = guides.slice(0, CORE_PILOT_HELP_DEPTH_GUIDES.length);

    expect(leading).toEqual([...CORE_PILOT_HELP_DEPTH_GUIDES]);
  });

  it("adds follow-up Sources the page does not already link", () => {
    const hrefs = corePilotHelpRelatedGuides().map((guide) => guide.href);

    expect(hrefs).toContain("/integrations/cloud-connections");
    expect(hrefs.some((href) => href.includes("getting-started"))).toBe(true);
  });

  it("drops Sources already reachable from a page CTA", () => {
    const hrefs = corePilotHelpRelatedGuides().map((guide) => guide.href);

    expect(hrefs).not.toContain(CORE_PILOT_HELP_PRIMARY_ACTIONS.startReview.href);
    expect(hrefs).not.toContain(CORE_PILOT_HELP_PRIMARY_ACTIONS.troubleshooting.href);
  });

  it("dedupes by href so a curated label wins over the Source label", () => {
    const guides = corePilotHelpRelatedGuides();
    const hrefs = guides.map((guide) => guide.href);

    expect(new Set(hrefs).size).toBe(hrefs.length);

    expect(guides.some((guide) => guide.label === CORE_PILOT_HELP_IN_PRODUCT_CHECKLIST_LABEL)).toBe(true);
    expect(guides.some((guide) => guide.label === "First review guide")).toBe(false);
    expect(guides.some((guide) => guide.label === "First review guide in the product")).toBe(false);
  });

  it("TB-1335: related guide labels name distinct jobs", () => {
    const labels = corePilotHelpRelatedGuides().map((guide) => guide.label);

    expect(labels).toContain("Pilot guide");
    expect(labels).toContain(CORE_PILOT_HELP_IN_PRODUCT_CHECKLIST_LABEL);
    expect(labels.filter((label) => /first review guide/i.test(label))).toHaveLength(0);
  });

  it("never self-links back to the first-architecture-review help topic", () => {
    const hrefs = corePilotHelpRelatedGuides().map((guide) => guide.href);

    expect(hrefs).not.toContain(CORE_PILOT_HELP_CANONICAL_PATH);
    expect(CORE_PILOT_HELP_SOURCES.some((source) => source.href === CORE_PILOT_HELP_CANONICAL_PATH)).toBe(
      false,
    );
  });
});
