import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperatorAttentionKindChip } from "@/components/operator/OperatorAttentionKindChip";
import { DESIGN_TOKENS } from "@/lib/design-tokens";
import {
  GOVERNANCE_ALERTS_PATH,
  GOVERNANCE_APPROVAL_QUEUE_PATH,
} from "@/lib/governance/governance-route-paths";

describe("OperatorAttentionKindChip", () => {
  it("uses the compact interactive chip shell for needs-action counts", () => {
    render(
      <OperatorAttentionKindChip
        kind="awaiting-approval"
        href={GOVERNANCE_APPROVAL_QUEUE_PATH}
        count={3}
        selected={false}
      />,
    );

    const chip = screen.getByTestId("operator-attention-kind-chip-awaiting-approval");
    expect(chip.className).toContain("min-h-8");
    expect(chip.className).toContain("py-1");
    expect(chip.className).not.toMatch(/py-1\.5/);
    expect(chip.className).not.toMatch(/text-lg/);
    expect(DESIGN_TOKENS.interactive.chip).toContain("min-h-8");
    expect(chip).toHaveTextContent("Awaiting approval");
    expect(chip).toHaveTextContent("(3)");
    expect(screen.queryByLabelText("Status: Awaiting approval")).not.toBeInTheDocument();
  });

  it("keeps idle chips on the same compact shell", () => {
    render(
      <OperatorAttentionKindChip
        kind="alerts"
        href={GOVERNANCE_ALERTS_PATH}
        count={0}
        selected={false}
      />,
    );

    const chip = screen.getByTestId("operator-attention-kind-chip-alerts");
    expect(chip.className).toContain("min-h-8");
    expect(chip.className).toContain("py-1");
    expect(chip).toHaveTextContent("Alerts");
    expect(chip).toHaveTextContent("(0)");
  });

  it("marks the selected chip as the current page", () => {
    render(
      <OperatorAttentionKindChip
        kind="awaiting-approval"
        href={GOVERNANCE_APPROVAL_QUEUE_PATH}
        count={3}
        selected={true}
      />,
    );

    expect(screen.getByTestId("operator-attention-kind-chip-awaiting-approval")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
