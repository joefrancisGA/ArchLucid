import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PolicyPacksWorkspaceSelectionSection } from "./PolicyPacksWorkspaceSelectionSection";

describe("PolicyPacksWorkspaceSelectionSection", () => {
  it("does not render an empty bordered list when assignments are missing", () => {
    render(
      <PolicyPacksWorkspaceSelectionSection
        canMutatePacks={false}
        registeredPackCount={2}
        items={[]}
        loading={false}
        togglingAssignmentId={null}
        togglingOrganizationRequiredAssignmentId={null}
        onToggle={() => undefined}
        onToggleOrganizationRequired={() => undefined}
      />,
    );

    expect(screen.getByTestId("policy-packs-workspace-selection-empty")).toHaveTextContent(/assignment/i);
    expect(screen.queryByTestId("policy-packs-workspace-selection-list")).toBeNull();
  });
});
