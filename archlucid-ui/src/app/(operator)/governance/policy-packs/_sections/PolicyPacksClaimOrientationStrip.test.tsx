import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { POLICY_PACKS_HUB_CLAIM_DISCIPLINE } from "@/lib/policy/policy-packs-hub-evidence-copy";

import { PolicyPacksClaimOrientationStrip } from "./PolicyPacksClaimOrientationStrip";
import { POLICY_PACKS_CLAIM_HEADING } from "./policy-packs-page-copy";

describe("PolicyPacksClaimOrientationStrip", () => {
  it("renders claim heading and discipline copy", () => {
    render(<PolicyPacksClaimOrientationStrip />);

    expect(screen.getByText(POLICY_PACKS_CLAIM_HEADING)).toBeInTheDocument();
    expect(screen.getByText(POLICY_PACKS_HUB_CLAIM_DISCIPLINE)).toBeInTheDocument();
  });
});
