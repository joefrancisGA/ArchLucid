import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { PlatformBundledPolicyPacksEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  PLATFORM_BUNDLED_POLICY_PACKS_CANONICAL_PATH,
  PLATFORM_BUNDLED_POLICY_PACKS_FOLLOW_UPS_TITLE,
  PLATFORM_BUNDLED_POLICY_PACKS_SOURCES,
  PLATFORM_BUNDLED_POLICY_PACKS_SOURCES_INTRO,
} from "@/lib/platform-bundled-policy-packs-evidence-copy";

describe("platform-bundled-policy-packs-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(PLATFORM_BUNDLED_POLICY_PACKS_CANONICAL_PATH).toBe("/internal/platform-bundled-policy-packs");
  });

  it("renders operator Sources follow-ups without a claim-discipline callout", () => {
    render(<PlatformBundledPolicyPacksEvidenceOrientationStrip />);

    expect(screen.queryByTestId("platform-bundled-policy-packs-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(PLATFORM_BUNDLED_POLICY_PACKS_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("platform-bundled-policy-packs-sources");

    for (const link of PLATFORM_BUNDLED_POLICY_PACKS_SOURCES) {
      expectFollowUpLink(within(sources), link);
    }

    expect(
      within(sources).queryByRole("link", {
        name: new RegExp(`^${PLATFORM_BUNDLED_POLICY_PACKS_CANONICAL_PATH}$`, "i"),
      }),
    ).not.toBeInTheDocument();
  });

  it("labels follow-ups for accessibility parity", () => {
    render(<PlatformBundledPolicyPacksEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: PLATFORM_BUNDLED_POLICY_PACKS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
