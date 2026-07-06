import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FocusedPilotPolicyPackAppliedCallout } from "@/components/wizard/FocusedPilotPolicyPackAppliedCallout";

describe("FocusedPilotPolicyPackAppliedCallout", () => {
  it("lists focused pilot policy packs applied automatically", () => {
    render(<FocusedPilotPolicyPackAppliedCallout />);

    expect(screen.getByTestId("focused-pilot-policy-pack-applied-callout")).toBeTruthy();
    expect(screen.getByText(/ArchLucid default standards applied automatically/i)).toBeTruthy();
    expect(
      screen.getByText(
        /For your first review, ArchLucid evaluates against its default Security Architecture Baseline and FinOps & Cloud Cost Optimization standards/i,
      ),
    ).toBeTruthy();
    expect(screen.getByText("Security Architecture Baseline")).toBeTruthy();
    expect(screen.getByText("FinOps & Cloud Cost Optimization")).toBeTruthy();
  });
});
