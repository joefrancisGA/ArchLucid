import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArchitecturesHubHeaderActions } from "./ArchitecturesHubHeaderActions";

const navigate = vi.fn();

vi.mock("@/hooks/use-create-architecture-navigation", () => ({
  useCreateArchitectureNavigation: () => ({
    navigate,
    isNavigating: false,
    loadingLabel: "Opening…",
  }),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: () => <button type="button">Help</button>,
}));

describe("ArchitecturesHubHeaderActions", () => {
  beforeEach(() => {
    navigate.mockReset();
  });

  it("shows a primary Create architecture CTA in the header (TB-1446)", () => {
    render(<ArchitecturesHubHeaderActions />);

    const createButton = screen.getByTestId("architectures-page-create");

    expect(createButton).toHaveTextContent("Create architecture");
    expect(createButton.className).toContain("al-primary-action-bg");
    expect(screen.getByRole("button", { name: "Help" })).toBeInTheDocument();
  });
});
