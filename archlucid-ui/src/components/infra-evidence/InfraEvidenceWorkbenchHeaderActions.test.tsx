import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/infrastructure/resources",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
}));

import { InfraEvidenceWorkbenchHeaderActions } from "@/components/infra-evidence/InfraEvidenceWorkbenchHeaderActions";

describe("InfraEvidenceWorkbenchHeaderActions", () => {
  it("renders shortcut disclosure entries when shortcuts are provided", () => {
    render(
      <InfraEvidenceWorkbenchHeaderActions
        shortcutsTestId="infra-resource-explorer-page-shortcuts"
        shortcuts={[
          {
            key: "enter",
            label: "Apply filters",
            description: "Submit the resource explorer filter form",
          },
        ]}
      />,
    );

    expect(screen.getByTestId("infra-resource-explorer-page-shortcuts")).toBeInTheDocument();
    expect(screen.getByTestId("infra-resource-explorer-page-shortcuts-entry-enter")).toHaveTextContent("Apply filters");
  });
});
