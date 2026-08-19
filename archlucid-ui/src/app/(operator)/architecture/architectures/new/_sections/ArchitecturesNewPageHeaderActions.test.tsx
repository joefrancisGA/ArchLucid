import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitecturesNewPageHeaderActions } from "./ArchitecturesNewPageHeaderActions";

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => (
    <button type="button" data-testid="page-contextual-help-button">
      Help
    </button>
  ),
}));

describe("ArchitecturesNewPageHeaderActions (TB-1458)", () => {
  it("renders contextual help in the page header actions", () => {
    render(<ArchitecturesNewPageHeaderActions />);

    expect(screen.getByTestId("architectures-new-page-header-actions")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
  });
});
