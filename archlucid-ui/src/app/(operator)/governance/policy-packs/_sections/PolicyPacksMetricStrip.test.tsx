import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PolicyPacksMetricStrip } from "./PolicyPacksMetricStrip";
import { POLICY_PACKS_EFFECTIVE_LAYERS_NOT_LOADED_LINE } from "@/lib/policy/policy-packs-workspace-status-copy";

describe("PolicyPacksMetricStrip", () => {
  it("shows not loaded helper when effective set is null even with workspace assignments", () => {
    render(
      <PolicyPacksMetricStrip
        buyerPolishedShell={false}
        packCount={3}
        workspaceAssignmentCount={2}
        effective={null}
        selectedPackSummary={undefined}
      />,
    );

    expect(screen.getByText("Not loaded")).toBeInTheDocument();
    expect(screen.getByTestId("policy-packs-effective-layers-helper")).toHaveTextContent(
      POLICY_PACKS_EFFECTIVE_LAYERS_NOT_LOADED_LINE,
    );
    expect(screen.queryByText("Resolved for current scope")).not.toBeInTheDocument();
  });
});
