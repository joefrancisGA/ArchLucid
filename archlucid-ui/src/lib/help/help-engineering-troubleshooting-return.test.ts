import { describe, expect, it } from "vitest";

import {
  buildEngineeringTroubleshootingHelpReturnTo,
  buildEngineeringTroubleshootingRelatedGuideHref,
} from "@/lib/help/help-engineering-troubleshooting-return";

describe("help-engineering-troubleshooting-return", () => {
  it("builds canonical returnTo targets for related guides", () => {
    expect(buildEngineeringTroubleshootingHelpReturnTo()).toBe("/help/engineering-troubleshooting");
    expect(buildEngineeringTroubleshootingRelatedGuideHref("/help/cli-usage")).toBe(
      "/help/cli-usage?returnTo=%2Fhelp%2Fengineering-troubleshooting",
    );
    expect(buildEngineeringTroubleshootingRelatedGuideHref("/help/troubleshooting?tab=common")).toBe(
      "/help/troubleshooting?tab=common&returnTo=%2Fhelp%2Fengineering-troubleshooting",
    );
  });
});
