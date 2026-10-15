import { describe, expect, it } from "vitest";

import {
  resolvePolicyPacksHelpSources,
  SECURENOW_POLICY_PACKS_HELP_SOURCES,
} from "@/lib/policy/policy-packs-help-evidence-copy";

describe("policy packs help evidence copy SecureNow", () => {
  it("points follow-ups at compliance operator routes", () => {
    expect(resolvePolicyPacksHelpSources("security")).toEqual(SECURENOW_POLICY_PACKS_HELP_SOURCES);
    expect(resolvePolicyPacksHelpSources("security").some((source) => source.href.includes("/architecture/reviews"))).toBe(
      false,
    );
  });
});
