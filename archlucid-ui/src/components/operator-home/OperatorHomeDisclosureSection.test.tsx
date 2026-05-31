import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { OperatorHomeDisclosureSection } from "@/components/operator-home/OperatorHomeDisclosureSection";
import { OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS } from "@/lib/operator-home-disclosure-storage";

afterEach(() => {
  localStorage.clear();
});

describe("OperatorHomeDisclosureSection", () => {
  it("toggles content with chevron and persists preference", () => {
    render(
      <OperatorHomeDisclosureSection
        title="Workspace readiness"
        sectionTestId="disclosure-test"
        storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.workspaceReadiness}
        defaultExpanded={true}
        collapsedSummary="Collapsed summary"
      >
        <p>Expanded body</p>
      </OperatorHomeDisclosureSection>,
    );

    expect(screen.getByText("Expanded body")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Collapse Workspace readiness" }));

    expect(screen.queryByText("Expanded body")).not.toBeInTheDocument();
    expect(screen.getByText("Collapsed summary")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Expand Workspace readiness" }));

    expect(screen.getByText("Expanded body")).toBeInTheDocument();
  });
});
