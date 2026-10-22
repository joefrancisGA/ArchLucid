import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: ({ triggerText }: { triggerText?: string }) => (
    <button type="button" data-testid="page-contextual-help-button">
      {triggerText ?? "Home"}
    </button>
  ),
}));

vi.mock("@/components/operator-home/OperatorHomeWorkingPrimaryCta", () => ({
  OperatorHomeWorkingPrimaryCta: () => <div data-testid="operator-home-working-primary-cta" />,
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({
    isWorkingMode: false,
  }),
}));

const requestRefresh = vi.fn();

vi.mock("@/lib/operator/operator-home-refresh-context", () => ({
  useOperatorHomeRefresh: () => ({
    refreshing: false,
    lastRefreshedAt: new Date(),
    requestRefresh,
  }),
}));

import { OperatorHomePageHeader } from "@/app/(operator)/_sections/OperatorHomePageHeader";
import { operatorHomePageSubtitle } from "@/lib/operator/operator-home-page-copy";

describe("OperatorHomePageHeader", () => {
  it("renders Home title, resume primary, data-currency metadata beside refresh, and Help trigger", () => {
    requestRefresh.mockReset();

    render(
      <OperatorHomePageHeader
        subtitle={operatorHomePageSubtitle(false)}
        workspaceLabel="Claims Intake Workspace"
      />,
    );

    expect(screen.getByTestId("operator-home-page-title")).toHaveTextContent("Home");
    expect(screen.getByTestId("operator-home-page-subtitle")).toHaveTextContent("Claims Intake Workspace");
    expect(screen.getByTestId("operator-home-working-primary-cta")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-data-currency")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toHaveTextContent("Help");
    expect(screen.getByTestId("operator-home-data-currency")).toContainElement(
      screen.getByTestId("operator-home-refresh-button"),
    );

    fireEvent.click(screen.getByTestId("operator-home-refresh-button"));

    expect(requestRefresh).toHaveBeenCalledTimes(1);
  });
});
