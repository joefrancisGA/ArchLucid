import { fireEvent, render, screen, within } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import { QuickDecisionSummary } from "./QuickDecisionSummary";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useRouter: (): { refresh: () => void } => ({ refresh: (): void => {} }),
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  listItsmFindingCorrelations: vi.fn().mockResolvedValue({ correlations: [] }),
  createItsmOutboundIssue: vi.fn(),
}));

vi.mock("@/lib/use-itsm-native-create-enabled", () => ({
  useItsmNativeCreateEnabled: () => true,
}));

expect.extend(toHaveNoViolations);

describe("QuickDecisionSummary", () => {
  it("shows empty state when there are no findings", () => {
    render(<QuickDecisionSummary runId="run-1" findings={[]} />);

    expect(screen.getByText("No findings to act on")).toBeInTheDocument();
  });

  it("shows create-home in-progress empty state before stages complete", () => {
    render(
      <QuickDecisionSummary
        runId="run-1"
        findings={[]}
        packageCommitted={false}
        analysisStagesComplete={false}
        workspaceCardMode
      />,
    );

    expect(screen.getByTestId("quick-decision-create-home-in-progress-empty")).toBeInTheDocument();
    expect(screen.queryByText("No findings to act on")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View assessment progress on the Activity tab/i })).toHaveAttribute(
      "href",
      expect.stringContaining("archTab=activity"),
    );
    expect(screen.getByRole("link", { name: /Open clarifications/i })).toHaveAttribute(
      "href",
      expect.stringContaining("archTab=clarifications"),
    );
  });

  it("invokes create-home navigation callbacks from in-progress empty state", () => {
    const onNavigateActivity = vi.fn();
    const onNavigateClarifications = vi.fn();

    render(
      <QuickDecisionSummary
        runId="run-1"
        findings={[]}
        packageCommitted={false}
        analysisStagesComplete={false}
        workspaceCardMode
        onNavigateActivity={onNavigateActivity}
        onNavigateClarifications={onNavigateClarifications}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /View assessment progress on the Activity tab/i }));
    fireEvent.click(screen.getByRole("button", { name: /Open clarifications/i }));

    expect(onNavigateActivity).toHaveBeenCalledTimes(1);
    expect(onNavigateClarifications).toHaveBeenCalledTimes(1);
  });

  it("shows create-home finalize-eligible empty state when stages complete", () => {
    render(
      <QuickDecisionSummary
        runId="run-1"
        findings={[]}
        packageCommitted={false}
        analysisStagesComplete
        workspaceCardMode
      />,
    );

    expect(screen.getByTestId("quick-decision-create-home-finalize-empty")).toBeInTheDocument();
    expect(screen.queryByText("No findings to act on")).not.toBeInTheDocument();
  });

  it("does not treat a filtered-empty list as create-home zero findings", () => {
    render(
      <QuickDecisionSummary
        runId="run-1"
        findings={[]}
        sourceFindingsCount={2}
        packageCommitted={false}
        analysisStagesComplete={false}
        workspaceCardMode
        confidenceVisibility={{
          showLowConfidence: false,
          onShowLowConfidenceChange: () => undefined,
          hiddenByConfidenceCount: 2,
          managedExternally: true,
        }}
      />,
    );

    expect(screen.queryByTestId("quick-decision-create-home-in-progress-empty")).not.toBeInTheDocument();
    expect(screen.getByText("No findings match the current filters.")).toBeInTheDocument();
  });

  it("buyer-polished shell summarizes finalized posture when headline lists findings but quick rows are empty", () => {
    render(
      <QuickDecisionSummary
        runId="run-1"
        findings={[]}
        buyerPolishedShell
        headlineFindingCount={9}
        headlineWarningCount={1}
      />,
    );

    expect(
      screen.getByText(
        /This finalized review records 9 findings with no unresolved blocking issues\. One monitored PHI minimization risk remains in this review record—review severity and controls below\./,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("No findings to act on")).not.toBeInTheDocument();
  });

  it("renders top three by severity with links to finding detail", () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "f-low",
        title: "Low title",
        recommendation: "Later.",
        severityValue: 0,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
      },
      {
        findingId: "f-high",
        title: "High title",
        recommendation: "Fix immediately. Then verify.",
        severityValue: 2,
        findingOrder: 1,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
      },
      {
        findingId: "f-critical",
        title: "Critical title",
        recommendation: "Stop rollout.",
        severityValue: 3,
        findingOrder: 2,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
      },
      {
        findingId: "f-extra",
        title: "Extra",
        recommendation: "Extra.",
        severityValue: 1,
        findingOrder: 3,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
      },
    ];

    render(<QuickDecisionSummary runId="run-abc" findings={findings} />);

    const findingDetailLinks = screen.getAllByRole("link").filter((el) => {
      const href = el.getAttribute("href") ?? "";

      return href.includes("/architecture/reviews/run-abc/findings/") && !href.includes("/insights/evidence-graph");
    });

    expect(findingDetailLinks).toHaveLength(3);
    expect(findingDetailLinks.map((el) => el.getAttribute("href"))).toEqual([
      "/architecture/reviews/run-abc/findings/f-critical",
      "/architecture/reviews/run-abc/findings/f-high",
      "/architecture/reviews/run-abc/findings/f-extra",
    ]);
    // List links must not prefetch finding detail RSC (each prefetch would call GET …/inspect).
    expect(findingDetailLinks.every((el) => el.getAttribute("data-prefetch") !== "true")).toBe(true);

    expect(screen.getByText("Fix immediately.")).toBeInTheDocument();
    expect(screen.getAllByTestId("itsm-sync-jira")).toHaveLength(3);
    expect(screen.getAllByTestId("itsm-sync-servicenow")).toHaveLength(3);
  });

  it("segregates advisory notes from policy violations", () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "f-blocking",
        title: "Custom policy breach",
        recommendation: "Fix before commit.",
        severityValue: 3,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
      },
      {
        findingId: "f-advisory",
        title: "Enable MFA for all users.",
        recommendation: "Baseline guidance.",
        severityValue: 1,
        findingOrder: 1,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "Advisory",
      },
    ];

    render(<QuickDecisionSummary runId="run-tier" findings={findings} />);

    expect(screen.getByTestId("quick-decision-policy-violations")).toBeInTheDocument();
    expect(screen.getByTestId("quick-decision-advisory-notes")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Custom policy breach/i })).toBeInTheDocument();
    expect(screen.getAllByTestId("ai-output-governance-label-governed").length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: /Enable MFA for all users/i })).not.toBeInTheDocument();
  });

  it("shows View evidence graph link when synthetic evidence ref count is present", () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "f1",
        title: "Risk",
        recommendation: "Mitigate.",
        severityValue: 2,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        evidenceRefCount: 1,
        confidenceLevel: "Medium",
        enforcementTier: "PolicyViolation",
      },
    ];

    render(<QuickDecisionSummary runId="run-z" findings={findings} />);

    const ev = screen.getByTestId("finding-evidence-link-chip");

    expect(ev).toBeInTheDocument();
    expect(ev.getAttribute("href") ?? "").toContain("/insights/evidence-graph?");
    expect(ev.getAttribute("href") ?? "").toContain("runId=run-z");
  });

  it("has no serious axe violations", async () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "f1",
        title: "Issue one",
        recommendation: "Do thing.",
        severityValue: 3,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
      },
    ];

    const { container } = render(<QuickDecisionSummary runId="run-z" findings={findings} />);

    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows blocking low-confidence findings by default in workspace mode", () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "f-blocking-low",
        title: "Blocking low-confidence finding",
        recommendation: "Disposition before approval.",
        severityValue: 2,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
        confidenceLevel: "Low",
      },
      {
        findingId: "f-hidden-low",
        title: "Hidden low-confidence finding",
        recommendation: "Verify first.",
        severityValue: 1,
        findingOrder: 1,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "Advisory",
        confidenceLevel: "Low",
      },
    ];

    render(<QuickDecisionSummary runId="run-blocking-low" findings={findings} workspaceCardMode />);

    expect(screen.getByTestId("finding-workspace-card-f-blocking-low")).toBeInTheDocument();
    expect(screen.queryByTestId("finding-workspace-card-f-hidden-low")).not.toBeInTheDocument();
    expect(screen.getByTestId("quick-decision-low-confidence-hidden-hint")).toHaveTextContent(
      "1 low-confidence finding hidden",
    );
  });

  it("hides low-confidence findings by default and reveals them when toggled", () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "f-trusted",
        title: "Trusted finding",
        recommendation: "Fix now.",
        severityValue: 3,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
        confidenceLevel: "High",
      },
      {
        findingId: "f-low",
        title: "Low confidence finding",
        recommendation: "Verify first.",
        severityValue: 3,
        findingOrder: 1,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "Advisory",
        confidenceLevel: "Low",
      },
    ];

    render(<QuickDecisionSummary runId="run-conf" findings={findings} />);

    expect(screen.getByRole("link", { name: /Trusted finding/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Low confidence finding/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("quick-decision-low-confidence-hidden-hint")).toHaveTextContent(
      "1 low-confidence finding hidden",
    );

    fireEvent.click(screen.getByTestId("quick-decision-show-low-confidence"));

    expect(screen.getByTestId("quick-decision-low-confidence-section")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Low confidence finding/i })).toBeInTheDocument();
    expect(screen.getByTestId("quick-decision-low-confidence-f-low")).toBeInTheDocument();
  });

  it("shows an Evidence gap tag for findings with no evidence refs, snippets, or policy-rule citation", () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "f-no-evidence",
        title: "Unproven finding",
        recommendation: "Verify manually.",
        severityValue: 2,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
      },
    ];

    render(<QuickDecisionSummary runId="run-gap" findings={findings} />);

    expect(screen.getByTestId("finding-evidence-gap-f-no-evidence")).toHaveTextContent("Evidence gap");
  });

  it("omits the Evidence gap tag once a finding has linked evidence", () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "f-proven",
        title: "Proven finding",
        recommendation: "Fix it.",
        severityValue: 2,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
        evidenceRefCount: 2,
      },
    ];

    render(<QuickDecisionSummary runId="run-proven" findings={findings} />);

    expect(screen.queryByTestId("finding-evidence-gap-f-proven")).not.toBeInTheDocument();
  });

  it("renders owner and review-status when present on the finding", () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "f-owned",
        title: "Owned finding",
        recommendation: "Track to close.",
        severityValue: 1,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
        assignedToUserId: "reviewer@example.com",
        humanReviewStatus: 1,
      },
    ];

    render(<QuickDecisionSummary runId="run-owned" findings={findings} />);

    expect(screen.getByTestId("finding-owner-f-owned")).toHaveTextContent("Owner: reviewer@example.com");
    expect(screen.getByTestId("finding-review-status-f-owned")).toHaveTextContent("Pending review");
  });

  it("omits owner and review-status rows when the finding has neither", () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "f-unowned",
        title: "Unowned finding",
        recommendation: "No owner yet.",
        severityValue: 1,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
      },
    ];

    render(<QuickDecisionSummary runId="run-unowned" findings={findings} />);

    expect(screen.queryByTestId("finding-owner-f-unowned")).not.toBeInTheDocument();
    expect(screen.queryByTestId("finding-review-status-f-unowned")).not.toBeInTheDocument();
  });

  it("workspace mode elevates the primary finding and collapses integrations", () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "f-high",
        title: "High title",
        recommendation: "Fix immediately. Then verify.",
        severityValue: 2,
        findingOrder: 1,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
        evidenceRefCount: 2,
      },
      {
        findingId: "f-low",
        title: "Low title",
        recommendation: "Later.",
        severityValue: 0,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
      },
    ];

    render(<QuickDecisionSummary runId="run-workspace" findings={findings} workspaceCardMode />);

    const primaryCard = screen.getByTestId("finding-workspace-card-f-high");

    expect(primaryCard).toBeInTheDocument();
    expect(primaryCard).toHaveAttribute("data-finding-workspace-primary", "true");
    expect(within(primaryCard).getByRole("heading", { name: "High title" })).toBeInTheDocument();
    expect(screen.getByText("Additional findings (1)")).toBeInTheDocument();
    expect(screen.queryByTestId("findings-itsm-export-toolbar")).not.toBeInTheDocument();
    expect(within(primaryCard).getByText("Create work item / Integrations")).toBeInTheDocument();
    expect(within(primaryCard).getByTestId("itsm-sync-jira")).not.toBeVisible();
  });

  it("hides work-item integrations before package commit on create-home", () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "f-high",
        title: "High title",
        recommendation: "Fix immediately.",
        severityValue: 2,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
      },
    ];

    render(
      <QuickDecisionSummary
        runId="run-create"
        findings={findings}
        workspaceCardMode
        packageCommitted={false}
        providerNeutralWorkItems
        architectureWorkItemContext={{
          architectureName: "Test architecture",
          architectureOverview: "Overview",
          ownerLabel: "Owner",
        }}
      />,
    );

    const primaryCard = screen.getByTestId("finding-workspace-card-f-high");

    fireEvent.click(within(primaryCard).getByText("Supporting detail"));

    expect(within(primaryCard).queryByText("Create work item / Integrations")).not.toBeInTheDocument();
    expect(within(primaryCard).queryByTestId("finding-itsm-sync-f-high")).not.toBeInTheDocument();
    expect(screen.queryByTestId("itsm-sync-jira")).not.toBeInTheDocument();
  });

  it("workspace mode exposes integrations inside collapsed supporting detail", async () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "f-high",
        title: "High title",
        recommendation: "Fix immediately.",
        severityValue: 2,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
      },
    ];

    render(<QuickDecisionSummary runId="run-workspace" findings={findings} workspaceCardMode />);

    const primaryCard = screen.getByTestId("finding-workspace-card-f-high");

    fireEvent.click(within(primaryCard).getByText("Supporting detail"));
    fireEvent.click(within(primaryCard).getByText("Create work item / Integrations"));

    expect(within(primaryCard).getByTestId("finding-itsm-sync-f-high")).toBeInTheDocument();
    expect(within(primaryCard).getByTestId("itsm-sync-jira")).toBeVisible();
  });

  it("workspace rows size severity and status tags uniformly against the finding title", () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "f-high",
        title: "High title",
        recommendation: "Fix immediately.",
        severityValue: 2,
        findingOrder: 1,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
      },
      {
        findingId: "f-low",
        title: "Low title",
        recommendation: "Later.",
        severityValue: 0,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
      },
    ];

    render(<QuickDecisionSummary runId="run-workspace" findings={findings} workspaceCardMode />);

    const tags = [
      ...within(screen.getByTestId("finding-workspace-card-f-high")).getAllByText(/^(High|Open|Policy violation)$/),
      ...within(screen.getByTestId("finding-workspace-card-f-low")).getAllByText(/^(Low|Open|Policy violation)$/),
    ];

    expect(tags.length).toBeGreaterThan(0);

    for (const tag of tags) {
      expect(tag.className).toContain("text-xs");
    }
  });
});
