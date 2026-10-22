import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { POLICY_PACKS_HUB_FOLLOW_UPS_TITLE } from "@/lib/policy/policy-packs-hub-evidence-copy";
import { PolicyPacksClaimOrientationStrip } from "./PolicyPacksClaimOrientationStrip";

describe("PolicyPacksClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<PolicyPacksClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("policy-packs-hub-sources")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: POLICY_PACKS_HUB_FOLLOW_UPS_TITLE })).toBeInTheDocument();
  });
});
