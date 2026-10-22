import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpFindingsWorkspaceReadinessStrip } from "@/app/(operator)/help/_sections/HelpFindingsWorkspaceReadinessStrip";
import {
  FINDINGS_HELP_READINESS_FORBIDDEN_MESSAGE,
  FINDINGS_HELP_READINESS_LABELS,
  FINDINGS_HELP_READINESS_SECTION_TITLE,
  FINDINGS_HELP_WORKSPACE_SCOPE_FALLBACK_LABEL,
} from "@/lib/findings/findings-help-guide-content";
import type { FindingsHelpWorkspaceReadinessSnapshot } from "@/lib/use-findings-help-workspace-readiness";

function buildMetric(
  label: string,
  valueLabel: string,
  href: string,
): FindingsHelpWorkspaceReadinessSnapshot["openFindings"] {
  return {
    label,
    valueLabel,
    statusKind: valueLabel === "0" ? "neutral" : "needs-attention",
    href,
  };
}

function buildReadiness(
  overrides: Partial<FindingsHelpWorkspaceReadinessSnapshot> = {},
): FindingsHelpWorkspaceReadinessSnapshot {
  return {
    loading: false,
    loadFailed: false,
    loadForbidden: false,
    openFindings: buildMetric(
      FINDINGS_HELP_READINESS_LABELS.openFindings,
      "2",
      "/governance/findings?filter=open",
    ),
    criticalAndError: buildMetric(
      FINDINGS_HELP_READINESS_LABELS.criticalAndError,
      "1",
      "/governance/findings?filter=critical-error",
    ),
    awaitingDecision: buildMetric(
      FINDINGS_HELP_READINESS_LABELS.awaitingDecision,
      "1",
      "/governance/findings?filter=needs-decision",
    ),
    recentlyResolved: buildMetric(
      FINDINGS_HELP_READINESS_LABELS.recentlyResolved,
      "3",
      "/governance/findings?filter=remediated-recent",
    ),
    workspaceScopeLabel: FINDINGS_HELP_WORKSPACE_SCOPE_FALLBACK_LABEL,
    loadedAtUtc: "2026-07-10T12:00:00Z",
    reload: vi.fn(),
    ...overrides,
  };
}

describe("HelpFindingsWorkspaceReadinessStrip", () => {
  it("renders attributed heading, scope, status tags, and deep links", () => {
    render(<HelpFindingsWorkspaceReadinessStrip readiness={buildReadiness()} />);

    expect(
      screen.getByRole("heading", { level: 2, name: FINDINGS_HELP_READINESS_SECTION_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByText(/This workspace · As of/)).toBeInTheDocument();
    expect(screen.getByText(FINDINGS_HELP_READINESS_LABELS.openFindings)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    const openLink = screen.getByRole("link", { name: /Open findings/i });
    expect(openLink).toHaveAttribute("href", "/governance/findings?filter=open");
  });

  it("shows retry when load fails", () => {
    const reload = vi.fn();

    render(
      <HelpFindingsWorkspaceReadinessStrip
        readiness={buildReadiness({
          loadFailed: true,
          openFindings: buildMetric(FINDINGS_HELP_READINESS_LABELS.openFindings, "Unavailable", "/governance/findings"),
          criticalAndError: buildMetric(
            FINDINGS_HELP_READINESS_LABELS.criticalAndError,
            "Unavailable",
            "/governance/findings",
          ),
          awaitingDecision: buildMetric(
            FINDINGS_HELP_READINESS_LABELS.awaitingDecision,
            "Unavailable",
            "/governance/findings",
          ),
          recentlyResolved: buildMetric(
            FINDINGS_HELP_READINESS_LABELS.recentlyResolved,
            "Unavailable",
            "/governance/findings",
          ),
          workspaceScopeLabel: null,
          reload,
        })}
      />,
    );

    fireEvent.click(screen.getByTestId("help-findings-workspace-readiness-retry"));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("shows forbidden guidance without retry or as-of stamp", () => {
    render(
      <HelpFindingsWorkspaceReadinessStrip
        readiness={buildReadiness({
          loadForbidden: true,
          workspaceScopeLabel: null,
          loadedAtUtc: "2026-07-10T12:00:00Z",
        })}
      />,
    );

    expect(screen.getByTestId("help-findings-workspace-readiness-forbidden")).toHaveTextContent(
      FINDINGS_HELP_READINESS_FORBIDDEN_MESSAGE,
    );
    expect(screen.queryByTestId("help-findings-workspace-readiness-retry")).not.toBeInTheDocument();
    expect(screen.queryByText(/As of/)).not.toBeInTheDocument();
  });

  it("sets aria-busy while loading", () => {
    render(
      <HelpFindingsWorkspaceReadinessStrip
        readiness={buildReadiness({ loading: true, loadedAtUtc: null, workspaceScopeLabel: null })}
      />,
    );

    expect(screen.getByTestId("help-findings-workspace-readiness")).toHaveAttribute("aria-busy", "true");
  });
});
