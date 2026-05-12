import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureRequestWizardHelpDrawer } from "@/components/wizard/ArchitectureRequestWizardHelpDrawer";

describe("ArchitectureRequestWizardHelpDrawer", () => {
  it("opens a side panel with documentation links", () => {
    render(<ArchitectureRequestWizardHelpDrawer />);

    fireEvent.click(screen.getByTestId("architecture-wizard-help-drawer-trigger"));

    expect(screen.getByRole("dialog", { name: /documentation/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /^view doc$/i }).length).toBeGreaterThanOrEqual(4);
  });
});
