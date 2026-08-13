import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buyerPolishedShellVitestOverride,
  extendBuyerPolishedShellVitestMock,
} from "@/testing/buyer-polished-shell-vitest-override";

vi.mock("@/lib/demo-ui-env", async (importOriginal) =>
  extendBuyerPolishedShellVitestMock(importOriginal),
);

import { applyBuyerPolishedGoldenManifestSummaryHighlights } from "@/lib/buyer/buyer-golden-manifest-summary-highlights";

const FIXTURE_LINE =
  "Fixture highlight alpha — cost increased from 100 to 120 with higher isolation in the target run.";

describe("applyBuyerPolishedGoldenManifestSummaryHighlights", () => {
  beforeEach(() => {
    buyerPolishedShellVitestOverride.value = null;
  });

  afterEach(() => {
    buyerPolishedShellVitestOverride.value = null;
    vi.unstubAllEnvs();
  });

  it("rewrites fixture copy only in buyer-polished env", () => {
    buyerPolishedShellVitestOverride.value = false;
    vi.stubEnv("NEXT_PUBLIC_OPERATOR_EXPERIENCE", "operator");

    const raw = [FIXTURE_LINE, "One decision updated between base and target manifests."];

    expect(applyBuyerPolishedGoldenManifestSummaryHighlights(raw)).toEqual(raw);
  });

  it("maps seeded fixture line when buyer-polished shell is active", () => {
    buyerPolishedShellVitestOverride.value = true;
    vi.stubEnv("NEXT_PUBLIC_OPERATOR_EXPERIENCE", "");
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");

    const raw = [FIXTURE_LINE];

    expect(applyBuyerPolishedGoldenManifestSummaryHighlights(raw)).toEqual([
      "Estimated monthly platform operating cost increased with stronger isolation in the updated review.",
    ]);
  });
});
