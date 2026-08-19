import { describe, expect, it } from "vitest";

import {
  PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_COMPACT_LINE,
  PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_FIRST_REVIEW_LINK,
  PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_GETTING_STARTED_LINK,
  PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_HEADING,
  PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_PILOT_GUIDE_LINK,
  PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_WHY_THREE,
  buildPilotGuideGettingStartedFirstReviewVocabulary,
  resolvePilotGuideGettingStartedFirstReviewLink,
  resolvePilotGuideGettingStartedFirstReviewPeerLinks,
} from "@/lib/vocabulary/pilot-guide-getting-started-first-review-vocabulary";
import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import { GETTING_STARTED_HELP_PATH } from "@/lib/getting-started-help-guide-content";
import { PILOT_GUIDE_HELP_PATH } from "@/lib/pilot-guide-help-guide-content";

describe("pilot-guide-getting-started-first-review-vocabulary (TB-2322)", () => {
  it("explains pilot prep vs product orientation vs first-review path", () => {
    const model = buildPilotGuideGettingStartedFirstReviewVocabulary();

    expect(model.heading).toBe(PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_HEADING);
    expect(model.whyThree).toBe(PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_WHY_THREE);
    expect(model.whyThree.toLowerCase()).toContain("pilot");
    expect(model.whyThree.toLowerCase()).toContain("orientation");
    expect(model.compactLine).toBe(PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_COMPACT_LINE);

    expect(model.pilotGuideLink.href).toBe(PILOT_GUIDE_HELP_PATH);
    expect(model.gettingStartedLink.href).toBe(GETTING_STARTED_HELP_PATH);
    expect(model.firstArchitectureReviewLink.href).toBe(FIRST_ARCHITECTURE_REVIEW_HELP_PATH);
  });

  it("resolves current and peer links for each triad surface", () => {
    expect(resolvePilotGuideGettingStartedFirstReviewLink("pilot-guide")).toEqual(
      PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_PILOT_GUIDE_LINK,
    );

    const peers = resolvePilotGuideGettingStartedFirstReviewPeerLinks("pilot-guide");
    expect(peers).toEqual([
      PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_GETTING_STARTED_LINK,
      PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_FIRST_REVIEW_LINK,
    ]);

    expect(resolvePilotGuideGettingStartedFirstReviewPeerLinks("getting-started")).toHaveLength(2);
    expect(resolvePilotGuideGettingStartedFirstReviewPeerLinks("first-architecture-review")).toHaveLength(
      2,
    );
  });
});
