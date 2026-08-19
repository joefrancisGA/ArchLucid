import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { MutatingInWorkspaceChip } from "@/components/MutatingInWorkspaceChip";
import { MUTATING_IN_WORKSPACE_CHIP_PREFIX } from "@/lib/mutating-in-workspace-chip";
import {
  clearOperatorScopeStorage,
  writeOperatorScopeToStorage,
} from "@/lib/operator/operator-scope-storage";

describe("MutatingInWorkspaceChip (TB-2220)", () => {
  beforeEach(() => {
    clearOperatorScopeStorage();
  });

  it("renders the chip with an explicit workspace label", () => {
    render(<MutatingInWorkspaceChip workspaceScopeLabel="Claims Intake" />);

    const chip = screen.getByTestId("mutating-in-workspace-chip");
    expect(chip).toHaveAttribute("data-prefix", MUTATING_IN_WORKSPACE_CHIP_PREFIX);
    expect(chip).toHaveTextContent(`${MUTATING_IN_WORKSPACE_CHIP_PREFIX}: Claims Intake`);
    expect(screen.getByTestId("mutating-in-workspace-chip-tag")).toBeInTheDocument();
  });

  it("adopts the stored workspace label after mount", async () => {
    writeOperatorScopeToStorage({
      tenantId: "t1",
      workspaceId: "w1",
      projectId: "p1",
      workspaceLabel: "Acme Payments Workspace",
      projectLabel: "Core",
    });

    render(<MutatingInWorkspaceChip />);

    await waitFor(() => {
      expect(screen.getByTestId("mutating-in-workspace-chip")).toHaveTextContent(
        `${MUTATING_IN_WORKSPACE_CHIP_PREFIX}: Acme Payments`,
      );
    });
  });
});
