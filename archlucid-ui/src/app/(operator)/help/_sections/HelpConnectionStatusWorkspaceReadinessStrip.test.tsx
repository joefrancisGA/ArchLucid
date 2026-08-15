import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpConnectionStatusWorkspaceReadinessStrip } from "@/app/(operator)/help/_sections/HelpConnectionStatusWorkspaceReadinessStrip";
import { CONNECTION_STATUS_HELP_READINESS_SECTION_TITLE } from "@/lib/connection-status-help-guide-content";
import type { ConnectionStatusHelpWorkspaceReadinessSnapshot } from "@/lib/use-connection-status-help-workspace-readiness";

function buildReadiness(
  overrides: Partial<ConnectionStatusHelpWorkspaceReadinessSnapshot> = {},
): ConnectionStatusHelpWorkspaceReadinessSnapshot {
  return {
    loading: false,
    loadFailed: false,
    loadForbidden: false,
    metrics: [
      {
        id: "connected",
        label: "Integrations connected",
        valueLabel: "2 of 5",
        statusKind: "ready",
        href: null,
      },
    ],
    workspaceScopeLabel: "Claims Intake",
    loadedAtUtc: "2026-07-10T12:00:00.000Z",
    reload: vi.fn(),
    ...overrides,
  };
}

describe("HelpConnectionStatusWorkspaceReadinessStrip", () => {
  it("renders workspace summary metrics when data loads", () => {
    render(<HelpConnectionStatusWorkspaceReadinessStrip readiness={buildReadiness()} />);

    expect(
      screen.getByRole("heading", { level: 2, name: CONNECTION_STATUS_HELP_READINESS_SECTION_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Claims Intake/)).toBeInTheDocument();
    expect(screen.getByText(/Jul 10, 2026/i)).toBeInTheDocument();
    expect(screen.queryByText(/As of now/i)).toBeNull();
    expect(screen.getByText("Integrations connected")).toBeInTheDocument();
    expect(screen.getByText("2 of 5")).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("renders load failure with retry instead of hiding the section", () => {
    const reload = vi.fn();

    render(
      <HelpConnectionStatusWorkspaceReadinessStrip
        readiness={buildReadiness({ loadFailed: true, metrics: [], workspaceScopeLabel: null, reload })}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: CONNECTION_STATUS_HELP_READINESS_SECTION_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("help-connection-status-workspace-readiness-failed")).toHaveTextContent(
      /could not be loaded/i,
    );

    fireEvent.click(screen.getByTestId("help-connection-status-workspace-readiness-retry"));

    expect(reload).toHaveBeenCalledTimes(1);
  });
});
