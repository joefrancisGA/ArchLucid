import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { POLICY_PACK_DETAIL_CLAIM_DISCIPLINE } from "@/lib/policy/policy-pack-detail-evidence-copy";
import { POLICY_PACK_DETAIL_CLAIM_HEADING } from "@/lib/policy/policy-pack-detail-page-copy";

import { PolicyPackDetailClaimOrientationStrip } from "./PolicyPackDetailClaimOrientationStrip";

describe("PolicyPackDetailClaimOrientationStrip", () => {
  it("renders claim discipline heading and body", () => {
    render(<PolicyPackDetailClaimOrientationStrip />);

    expect(screen.getByText(POLICY_PACK_DETAIL_CLAIM_HEADING)).toBeInTheDocument();
    expect(screen.getByTestId("policy-pack-detail-claim-discipline").textContent).toContain(
      POLICY_PACK_DETAIL_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("policy-pack-detail-sources")).toBeInTheDocument();
  });
});
