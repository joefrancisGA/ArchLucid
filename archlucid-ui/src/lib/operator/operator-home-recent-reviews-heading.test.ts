import { describe, expect, it } from "vitest";

import {
  BUYER_HOME_REVIEWS_SECTION_HEADING,
  OPERATOR_HOME_RECENT_REVIEWS_HEADING,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_HOME_RECENT_REVIEWS_HEADING as reexportedHeading } from "@/lib/operator/operator-home-recent-reviews-heading";

describe("operator home recent reviews heading (TB-347)", () => {
  it("uses Recent reviews as the canonical string in both shell copy aliases", () => {
    expect(OPERATOR_HOME_RECENT_REVIEWS_HEADING).toBe("Recent reviews");
    expect(BUYER_HOME_REVIEWS_SECTION_HEADING).toBe(OPERATOR_HOME_RECENT_REVIEWS_HEADING);
    expect(reexportedHeading).toBe(OPERATOR_HOME_RECENT_REVIEWS_HEADING);
  });
});
