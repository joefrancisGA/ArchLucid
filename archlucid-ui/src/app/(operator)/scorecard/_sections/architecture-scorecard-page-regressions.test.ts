import { describe, expect, it } from "vitest";

import { SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH } from "@/lib/sponsor-report-navigation";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

/**
 * Bundle guard for TB-1956–TB-1959: view tests in sibling modules.
 */
describe("architecture-scorecard sponsor-report regressions (TB-1959)", () => {
  it("contextual help maps architecture scorecard to pilot-roi-model (TB-1959)", () => {
    expect(pageHelpTopicForPathname(SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH)?.slug).toBe("pilot-roi-model");
  });
});
