import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureRequestWizardHelpDrawer } from "@/components/wizard/ArchitectureRequestWizardHelpDrawer";

describe("ArchitectureRequestWizardHelpDrawer", () => {
  it("opens a side panel with documentation links", () => {
    render(<ArchitectureRequestWizardHelpDrawer />);

    fireEvent.click(screen.getByTestId("architecture-wizard-help-drawer-trigger"));

    expect(screen.getByRole("dialog", { name: /documentation/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /^view in help$/i }).length).toBeGreaterThanOrEqual(4);
  });

  it("does not link wizard help to eng API contracts (TB-1387)", () => {
    render(<ArchitectureRequestWizardHelpDrawer />);

    fireEvent.click(screen.getByTestId("architecture-wizard-help-drawer-trigger"));

    for (const link of screen.getAllByRole("link", { name: /^view in help$/i })) {
      expect(link.getAttribute("href")).not.toContain("governance-api-contracts");
    }

    expect(screen.queryByText(/HTTP API contracts/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Integration readiness/i)).toBeInTheDocument();
  });
});
