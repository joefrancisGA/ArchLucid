import { describe, expect, it } from "vitest";

import {
  SHOWCASE_HOME_SAMPLE_FINDING_PREVIEW_COUNT,
  SHOWCASE_HOME_SAMPLE_FINDINGS,
  showcaseHomeSampleFindingsAlignWithShowcaseRun,
} from "@/lib/showcase-home-sample-findings";
import { SHOWCASE_HOME_AHA_MOMENT } from "@/lib/showcase-home-aha-moment";
import {
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_SPINE_COUNTS,
} from "@/lib/showcase-static-demo";

describe("showcase-home-sample-findings (TB-353)", () => {
  it("exposes three buyer-safe preview findings aligned with the showcase primary finding", () => {
    expect(SHOWCASE_HOME_SAMPLE_FINDING_PREVIEW_COUNT).toBe(3);
    expect(SHOWCASE_HOME_SAMPLE_FINDINGS[0]?.id).toBe(SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID);
    expect(SHOWCASE_HOME_SAMPLE_FINDINGS[0]?.title).toBe(SHOWCASE_HOME_AHA_MOMENT.title);
    expect(showcaseHomeSampleFindingsAlignWithShowcaseRun()).toBe(true);
    expect(SHOWCASE_HOME_SAMPLE_FINDING_PREVIEW_COUNT).toBeLessThanOrEqual(
      SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount,
    );
  });
});
