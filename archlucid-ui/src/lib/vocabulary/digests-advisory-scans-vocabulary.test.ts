import { describe, expect, it } from "vitest";

import {
  DIGESTS_ADVISORY_SCANS_ADVISORY_LINK,
  DIGESTS_ADVISORY_SCANS_COMPACT_LINE,
  DIGESTS_ADVISORY_SCANS_DIGESTS_LINK,
  DIGESTS_ADVISORY_SCANS_HEADING,
  DIGESTS_ADVISORY_SCANS_WHY_TWO,
  buildDigestsAdvisoryScansVocabulary,
  resolveDigestsAdvisoryScansPeerLink,
} from "@/lib/vocabulary/digests-advisory-scans-vocabulary";
import { ADVISORY_SCANS_HREF } from "@/lib/advisory-scans-route";
import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";

describe("digests-advisory-scans-vocabulary (TB-2314)", () => {
  it("explains digest content cadence vs advisory scan production", () => {
    const model = buildDigestsAdvisoryScansVocabulary();

    expect(model.heading).toBe(DIGESTS_ADVISORY_SCANS_HEADING);
    expect(model.whyTwo).toBe(DIGESTS_ADVISORY_SCANS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("cadence");
    expect(model.whyTwo.toLowerCase()).toContain("advisory");
    expect(model.compactLine).toBe(DIGESTS_ADVISORY_SCANS_COMPACT_LINE);

    expect(model.digestsLink).toEqual(DIGESTS_ADVISORY_SCANS_DIGESTS_LINK);
    expect(model.digestsLink.href).toBe(DIGESTS_HUB_PATH);
    expect(model.advisoryScansLink).toEqual(DIGESTS_ADVISORY_SCANS_ADVISORY_LINK);
    expect(model.advisoryScansLink.href).toBe(ADVISORY_SCANS_HREF);
  });

  it("resolves the peer surface from digests and advisory-scans", () => {
    expect(resolveDigestsAdvisoryScansPeerLink("digests")).toEqual(
      DIGESTS_ADVISORY_SCANS_ADVISORY_LINK,
    );

    expect(resolveDigestsAdvisoryScansPeerLink("advisory-scans")).toEqual(
      DIGESTS_ADVISORY_SCANS_DIGESTS_LINK,
    );
  });
});
