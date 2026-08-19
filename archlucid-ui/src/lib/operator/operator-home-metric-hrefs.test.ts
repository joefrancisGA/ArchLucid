import { describe, expect, it } from "vitest";

import {
  FIRST_REVIEW_GUIDE_PATH,
  ONBOARDING_OPTIONAL_SETUP_HEADING_ID,
} from "@/lib/first-review-guide-route";

import { OPERATOR_HOME_SETUP_READINESS_HREF } from "@/lib/operator/operator-home-metric-hrefs";

describe("operator-home-metric-hrefs", () => {
  it("deep-links setup readiness to optional workspace setup on the first-review guide", () => {
    expect(OPERATOR_HOME_SETUP_READINESS_HREF).toBe(
      `${FIRST_REVIEW_GUIDE_PATH}#${ONBOARDING_OPTIONAL_SETUP_HEADING_ID}`,
    );
  });
});
