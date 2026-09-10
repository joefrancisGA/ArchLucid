import { describe, expect, it } from "vitest";

import {
  HELP_HUB_CANONICAL_PATH,
  HELP_HUB_CLAIM_DISCIPLINE,
  HELP_HUB_FOLLOW_UPS_TITLE,
  HELP_HUB_ORIENTATION_SOURCES,
  HELP_HUB_ORIENTATION_SOURCES_INTRO,
  HELP_HUB_SOURCES,
} from "@/lib/help/help-hub-evidence-copy";

describe("help-hub-evidence-copy", () => {
  it("exports non-empty claim discipline and orientation Sources for HEL", () => {
    expect(HELP_HUB_FOLLOW_UPS_TITLE.length).toBeGreaterThan(0);
    expect(HELP_HUB_CLAIM_DISCIPLINE).toContain("Help Center");
    expect(HELP_HUB_ORIENTATION_SOURCES_INTRO.length).toBeGreaterThan(0);
    expect(HELP_HUB_SOURCES.length).toBeGreaterThan(0);
    expect(HELP_HUB_ORIENTATION_SOURCES.length).toBeGreaterThan(0);

    for (const link of HELP_HUB_ORIENTATION_SOURCES) {
      expect(link.href).not.toBe(HELP_HUB_CANONICAL_PATH);
    }
  });
});
