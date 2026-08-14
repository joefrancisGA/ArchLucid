import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { OperatorHomeDisclosureSection } from "@/components/operator-home/OperatorHomeDisclosureSection";
import { OPERATOR_HOME_ADVANCED_GUIDANCE_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS } from "@/lib/operator/operator-home-disclosure-storage";
import { OPERATOR_HOME_CARD_SECTION_HEADING } from "@/lib/design-tokens";

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

  it("renders slim-density card titles at the same scale as peer overview cards (TB-347)", () => {
    render(
      <OperatorHomeDisclosureSection
        title={OPERATOR_HOME_ADVANCED_GUIDANCE_TITLE}
        titleId="operator-home-advanced-guidance-heading"
        sectionTestId="disclosure-slim-title-test"
        storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.advancedGuidance}
        defaultExpanded={false}
        density="slim"
        collapsedSummary="Collapsed summary"
      >
        <p>Expanded body</p>
      </OperatorHomeDisclosureSection>,
    );

    const heading = screen.getByRole("heading", { level: 2, name: OPERATOR_HOME_ADVANCED_GUIDANCE_TITLE });

    expect(heading.className).toContain("font-semibold");
    expect(heading.className).toContain("text-[15px]");
    expect(heading.className).toContain("tracking-tight");
    expect(OPERATOR_HOME_CARD_SECTION_HEADING).toContain("tracking-tight");
    expect(heading.className).not.toContain("text-xs");
  });

  it("auto-expands when location hash matches titleId", () => {
    window.location.hash = "#operator-home-advanced-guidance-heading";

    render(
      <OperatorHomeDisclosureSection
        title={OPERATOR_HOME_ADVANCED_GUIDANCE_TITLE}
        titleId="operator-home-advanced-guidance-heading"
        sectionTestId="disclosure-hash-expand-test"
        storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.advancedGuidance}
        defaultExpanded={false}
        autoExpandOnHashMatch
        collapsedSummary="Collapsed summary"
      >
        <p>Expanded body</p>
      </OperatorHomeDisclosureSection>,
    );

    expect(screen.getByText("Expanded body")).toBeInTheDocument();
  });

  it("keeps collapsed sections closed before hydration when defaultExpanded is false", () => {
    render(
      <OperatorHomeDisclosureSection
        title="Advanced guidance"
        sectionTestId="disclosure-collapsed-test"
        storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.advancedGuidance}
        defaultExpanded={false}
        collapsedSummary="Collapsed summary"
      >
        <p>Expanded body</p>
      </OperatorHomeDisclosureSection>,
    );

    expect(screen.queryByText("Expanded body")).not.toBeInTheDocument();
    expect(screen.getByText("Collapsed summary")).toBeInTheDocument();
  });
});
