import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    /** Rank cues are omitted in buyer-polished shell; pin full-operator for unit coverage. */
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

import {
  alertOperatorToolingOperatorRankLine,
  alertsInboxRankOperatorLine,
  auditLogRankOperatorLine,
  governanceResolutionRankOperatorLine,
} from "@/lib/enterprise-controls-context-copy";

import {
  AlertOperatorToolingRankCue,
  AlertsInboxRankCue,
  AuditLogRankCue,
  EnterpriseExecutePlusPageCue,
  GovernanceDashboardReaderActionCue,
  GovernanceResolutionRankCue,
} from "./EnterpriseControlsContextHints";

describe("EnterpriseControlsContextHints (page-level rank cues)", () => {
  it("GovernanceResolutionRankCue renders operator-oriented line outside shell provider (default Admin rank)", () => {
    render(<GovernanceResolutionRankCue />);

    expect(screen.getByRole("note")).toHaveTextContent(governanceResolutionRankOperatorLine);
  });

  it("GovernanceDashboardReaderActionCue renders nothing outside shell provider (default Admin rank)", () => {
    const { container } = render(<GovernanceDashboardReaderActionCue />);

    expect(container.querySelector('[role="note"]')).toBeNull();
  });

  it("EnterpriseExecutePlusPageCue renders message outside shell provider (default Admin rank)", () => {
    render(<EnterpriseExecutePlusPageCue message="Operator-only test line." />);

    expect(screen.getByText("Operator-only test line.")).toBeInTheDocument();
  });

  it("AlertsInboxRankCue renders operator triage line outside shell provider (default Admin rank)", () => {
    render(<AlertsInboxRankCue />);

    expect(screen.getByRole("note")).toHaveTextContent(alertsInboxRankOperatorLine);
  });

  it("AuditLogRankCue renders investigation line outside shell provider (default Admin rank)", () => {
    render(<AuditLogRankCue />);

    expect(screen.getByRole("note")).toHaveTextContent(auditLogRankOperatorLine);
  });

  it("AlertOperatorToolingRankCue renders operator line outside shell provider (default Admin rank)", () => {
    render(<AlertOperatorToolingRankCue />);

    // Match `enterprise-controls-context-copy.ts` (operator line is short prose — avoid duplicate regex matchers).
    expect(screen.getByRole("note")).toHaveTextContent(alertOperatorToolingOperatorRankLine);
  });
});
