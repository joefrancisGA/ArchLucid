import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
        label: "Integrations connected",
        valueLabel: "2 of 5",
        statusKind: "ready",
        href: "/administration/connection-status",
      },
    ],
    workspaceScopeLabel: "This workspace",
    loadedAtUtc: "2026-07-10T12:00:00Z",
    reload: () => undefined,
    ...overrides,
  };
}

describe("HelpConnectionStatusWorkspaceReadinessStrip", () => {
  it("renders workspace summary metrics when data loads", () => {
    render(<HelpConnectionStatusWorkspaceReadinessStrip readiness={buildReadiness()} />);

    expect(
      screen.getByRole("heading", { level: 2, name: CONNECTION_STATUS_HELP_READINESS_SECTION_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByText("Integrations connected")).toBeInTheDocument();
    expect(screen.getByText("2 of 5")).toBeInTheDocument();
  });

  it("silently omits the strip when load fails", () => {
    const { container } = render(
      <HelpConnectionStatusWorkspaceReadinessStrip readiness={buildReadiness({ loadFailed: true })} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
