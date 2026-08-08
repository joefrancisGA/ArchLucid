import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PolicyPacksEvidenceOrientationStrip } from "@/app/(operator)/governance/policy-packs/_sections/PolicyPacksEvidenceOrientationStrip";
import { POLICY_PACKS_HUB_SOURCES } from "@/lib/policy-packs-hub-evidence-copy";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance-route-paths";

describe("PolicyPacksEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking the policy packs hub", () => {
    render(<PolicyPacksEvidenceOrientationStrip />);

    expect(screen.getByTestId("policy-packs-sources")).toBeInTheDocument();
    expect(screen.getByTestId("policy-packs-claim-discipline")).toBeInTheDocument();

    for (const link of POLICY_PACKS_HUB_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(POLICY_PACKS_HUB_SOURCES.some((link) => link.href === GOVERNANCE_POLICY_PACKS_PATH)).toBe(false);
  });
});
