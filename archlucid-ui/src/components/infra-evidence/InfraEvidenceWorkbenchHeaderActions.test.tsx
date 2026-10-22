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
  it("keeps page shortcut tips out of the workbench header", () => {
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

    expect(screen.queryByTestId("infra-resource-explorer-page-shortcuts")).not.toBeInTheDocument();
    expect(screen.getByText(/page help/)).toBeInTheDocument();
  });
});
