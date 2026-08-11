import { describe, expect, it } from "vitest";

import {
  CORE_PILOT_HELP_CANONICAL_PATH,
  CORE_PILOT_HELP_SOURCES,
} from "@/lib/core-pilot-help-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  CORE_PILOT_HELP_RELATED_GUIDES,
  corePilotHelpRelatedGuides,
} from "@/lib/core-pilot-help-related-guides";

describe("corePilotHelpRelatedGuides", () => {
  it("TB-1382: exposes at most three job-matched related guides", () => {
    const guides = corePilotHelpRelatedGuides();

    expect(guides).toHaveLength(3);
    expect(guides).toEqual([...CORE_PILOT_HELP_RELATED_GUIDES]);
    expect(guides.map((guide) => guide.label)).toEqual([
      "Evidence intake",
      "Pilot guide",
      "Troubleshooting",
    ]);
  });

  it("TB-1382: prefers evidence intake, pilot guide, and troubleshooting", () => {
    const hrefs = corePilotHelpRelatedGuides().map((guide) => guide.href);

    expect(hrefs).toEqual([
      inAppHelpHref("evidence-intake"),
      inAppHelpHref("pilot-guide"),
      inAppHelpHref("troubleshooting"),
    ]);
  });

  it("never self-links back to the first-architecture-review help topic", () => {
    const hrefs = corePilotHelpRelatedGuides().map((guide) => guide.href);

    expect(hrefs).not.toContain(CORE_PILOT_HELP_CANONICAL_PATH);
    expect(CORE_PILOT_HELP_SOURCES.some((source) => source.href === CORE_PILOT_HELP_CANONICAL_PATH)).toBe(
      false,
    );
  });
});
