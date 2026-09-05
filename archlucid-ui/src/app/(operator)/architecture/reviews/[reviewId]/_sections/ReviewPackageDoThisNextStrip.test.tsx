import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { SessionAiReadinessState } from "@/hooks/use-session-ai-readiness";
import { REVIEW_PRE_STAGE_FAILURE_INTACT_SUMMARY } from "@/lib/resolve-review-failure-recovery-guidance";

import { ReviewPackageDoThisNextStrip } from "./ReviewPackageDoThisNextStrip";

const readySessionAiReadiness: SessionAiReadinessState = {
  sessionMode: "Simulator",
  hostMode: "Simulator",
  hasDevOverride: false,
  isSessionReal: false,
  isLoading: false,
  isReady: true,
  blocksExecute: false,
  detail: null,
  availability: null,
  probeState: { status: "idle" },
  checkAvailability: vi.fn(),
};

const loadedReadySessionAiReadiness: SessionAiReadinessState = {
  sessionMode: "Real",
  hostMode: "Real",
  hasDevOverride: false,
  isSessionReal: true,
  isLoading: false,
  isReady: true,
  blocksExecute: false,
  detail: null,
  availability: {
    isAvailable: true,
    validated: true,
    aiSource: "managed-platform",
    summary: "ArchLucid-managed Azure OpenAI live probe succeeded.",
    asOfUtc: "2026-09-01T11:24:56.000Z",
    checks: [],
    debug: {},
  },
  probeState: {
    status: "loaded",
    result: {
      isAvailable: true,
      validated: true,
      aiSource: "managed-platform",
      summary: "ArchLucid-managed Azure OpenAI live probe succeeded.",
      asOfUtc: "2026-09-01T11:24:56.000Z",
      checks: [],
      debug: {},
    },
  },
  checkAvailability: vi.fn(),
};

const loadedUnavailableSessionAiReadiness: SessionAiReadinessState = {
  sessionMode: "Real",
  hostMode: "Real",
  hasDevOverride: false,
  isSessionReal: true,
  isLoading: false,
  isReady: false,
  blocksExecute: true,
  detail: "ArchLucid-managed AI is unavailable",
  availability: {
    isAvailable: false,
    validated: true,
    aiSource: "managed-platform",
    summary: "ArchLucid-managed AI is unavailable",
    asOfUtc: "2026-09-01T11:24:56.000Z",
    checks: [],
    debug: {},
  },
  probeState: {
    status: "loaded",
    result: {
      isAvailable: false,
      validated: true,
      aiSource: "managed-platform",
      summary: "ArchLucid-managed AI is unavailable",
      asOfUtc: "2026-09-01T11:24:56.000Z",
      checks: [],
      debug: {},
    },
  },
  checkAvailability: vi.fn(),
};

const loadedAvailableSessionAiReadiness: SessionAiReadinessState = {
  sessionMode: "Real",
  hostMode: "Real",
  hasDevOverride: false,
  isSessionReal: true,
  isLoading: false,
  isReady: true,
  blocksExecute: false,
  detail: null,
  availability: {
    isAvailable: true,
    validated: true,
    aiSource: "managed-platform",
    summary: "ArchLucid-managed AI is available",
    asOfUtc: "2026-09-01T11:24:56.000Z",
    checks: [],
    debug: {},
  },
  probeState: {
    status: "loaded",
    result: {
      isAvailable: true,
      validated: true,
      aiSource: "managed-platform",
      summary: "ArchLucid-managed AI is available",
      asOfUtc: "2026-09-01T11:24:56.000Z",
      checks: [],
      debug: {},
    },
  },
  checkAvailability: vi.fn(),
};

const failureRecoveryFixture = {
  headline: "Execution failed before the first pipeline stage",
  detail: "Missing Azure OpenAI deployment configuration",
  recoverySteps: [
    "Share the administrator handoff below with a workspace administrator — this account cannot change AI configuration.",
    "After your administrator confirms workspace AI setup, return here and click Re-run review.",
  ],
  suggestSupportTicket: false,
  severity: "error" as const,
  supportHref: "/help/report-a-problem",
  intactSummary:
    "Your submitted intake package was recorded. Processing stopped before the first pipeline stage — this is usually a configuration or infrastructure issue, not missing intake fields.",
  workspaceAiConfigurationSignal: {
    label: "Workspace AI configuration",
    detail: "Missing Azure OpenAI credentials or deployment config",
  },
  adminHandoff: {
    markdown: "Review ID: run-1\nFailure: Execution failed before the first pipeline stage",
    verificationLines: ["Connection probe passes on Administration → Model governance."],
  },
  submittedIntakeRecap: {
    fields: [{ label: "Review title", value: "ArchLucid" }],
    attachedFiles: ["ARCHITECTURE_HANDBOOK.docx"],
  },
};

vi.mock("@/components/CommitRunButton", () => ({
  CommitRunButton: () => <button type="button">Finalize review</button>,
}));

vi.mock("@/components/reviews/WorkspaceAiAvailabilityPanel", () => ({
  WorkspaceAiAvailabilityPanel: (props: {
    readonly workspaceAiSignal: { readonly label: string; readonly detail: string };
  }) => (
    <div data-testid="review-package-workspace-ai-availability-panel">{props.workspaceAiSignal.detail}</div>
  ),
}));

describe("ReviewPackageDoThisNextStrip", () => {
  it("renders sentence and link CTA", () => {
    render(
      <ReviewPackageDoThisNextStrip
        runId="run-1"
        hasGoldenManifest={false}
        commitBlockedReason={null}
        sessionAiReadiness={readySessionAiReadiness}
        next={{
          kind: "add-evidence",
          sentence: "Evidence is still thin — add architecture evidence before expecting full findings.",
          actionLabel: "Add evidence",
          href: "/architecture/reviews/run-1?reviewTab=evidence",
        }}
      />,
    );

    expect(screen.getByTestId("review-package-do-this-next-strip")).toBeInTheDocument();
    expect(screen.getByTestId("review-package-do-this-next-sentence")).toHaveTextContent("Evidence is still thin");
    expect(screen.getByRole("link", { name: "Add evidence" })).toHaveAttribute(
      "href",
      "/architecture/reviews/run-1?reviewTab=evidence",
    );
  });

  it("shows automatic-check recovery steps while the live probe is pending", () => {
    render(
      <ReviewPackageDoThisNextStrip
        runId="run-1"
        hasGoldenManifest={false}
        commitBlockedReason={null}
        sessionAiReadiness={readySessionAiReadiness}
        next={{
          kind: "rerun-review",
          sentence:
            "Execution failed before the first pipeline stage — this is usually platform AI availability, not missing intake fields. Follow the steps below, then re-run the review.",
          actionLabel: "Re-run review",
          href: "/architecture/reviews/new?path=guided-intake&rerun=run-1",
          failureRecovery: {
            headline: "Execution failed before the first pipeline stage",
            detail: "Missing Azure OpenAI deployment configuration",
            recoverySteps: [
              "Share the administrator handoff below with a workspace administrator — this account cannot change AI configuration.",
              "After your administrator confirms workspace AI setup, return here and click Re-run review.",
            ],
            suggestSupportTicket: false,
            severity: "error",
            supportHref: "/help/report-a-problem",
            intactSummary: REVIEW_PRE_STAGE_FAILURE_INTACT_SUMMARY,
            workspaceAiConfigurationSignal: {
              label: "Workspace AI configuration",
              detail: "Missing Azure OpenAI credentials or deployment config",
            },
            adminHandoff: {
              markdown: "Review ID: run-1\nFailure: Execution failed before the first pipeline stage",
              verificationLines: ["Connection probe passes on Administration → Model governance."],
            },
            submittedIntakeRecap: {
              fields: [{ label: "Review title", value: "ArchLucid" }],
              attachedFiles: ["ARCHITECTURE_HANDBOOK.docx"],
            },
          },
        }}
      />,
    );

    expect(screen.getByTestId("review-package-failure-recovery-steps")).toHaveTextContent(
      "Checking live AI availability automatically",
    );
    expect(screen.getByTestId("review-package-do-this-next-sentence")).toHaveTextContent(
      "checking platform AI availability automatically",
    );
    expect(screen.getByTestId("review-package-do-this-next-sentence")).not.toHaveTextContent(
      "usually platform AI availability",
    );
  });

  it("renders failure recovery details when assessment failed", () => {
    render(
      <ReviewPackageDoThisNextStrip
        runId="run-1"
        hasGoldenManifest={false}
        commitBlockedReason={null}
        sessionAiReadiness={loadedUnavailableSessionAiReadiness}
        next={{
          kind: "rerun-review",
          sentence:
            "Execution failed before the first pipeline stage — this is usually platform AI availability, not missing intake fields. Follow the steps below, then re-run the review.",
          actionLabel: "Re-run review",
          href: "/architecture/reviews/new?path=guided-intake&rerun=run-1",
          failureRecovery: {
            headline: "Execution failed before the first pipeline stage",
            detail: "Missing Azure OpenAI deployment configuration",
            recoverySteps: [
              "Share the administrator handoff below with a workspace administrator — this account cannot change AI configuration.",
              "After your administrator confirms workspace AI setup, return here and click Re-run review.",
            ],
            suggestSupportTicket: false,
            severity: "error",
            supportHref: "/help/report-a-problem",
            intactSummary: REVIEW_PRE_STAGE_FAILURE_INTACT_SUMMARY,
            workspaceAiConfigurationSignal: {
              label: "Workspace AI configuration",
              detail: "Missing Azure OpenAI credentials or deployment config",
            },
            adminHandoff: {
              markdown: "Review ID: run-1\nFailure: Execution failed before the first pipeline stage",
              verificationLines: ["Connection probe passes on Administration → Model governance."],
            },
            submittedIntakeRecap: {
              fields: [{ label: "Review title", value: "ArchLucid" }],
              attachedFiles: ["ARCHITECTURE_HANDBOOK.docx"],
            },
          },
        }}
      />,
    );

    expect(screen.getByTestId("review-package-failure-recovery")).toBeInTheDocument();
    expect(screen.getByTestId("review-package-do-this-next-sentence")).toHaveTextContent(
      "Execution failed before the first pipeline stage",
    );
    expect(screen.getByTestId("review-package-failure-detail")).toHaveTextContent(
      "Missing Azure OpenAI deployment configuration",
    );
    expect(screen.getByTestId("review-package-workspace-ai-availability-panel")).toHaveTextContent(
      "Missing Azure OpenAI credentials or deployment config",
    );
    expect(screen.getByTestId("review-package-failure-intact")).toHaveTextContent("submitted intake package");
    expect(screen.getByTestId("review-package-admin-handoff")).toHaveTextContent(
      "Share with your workspace administrator",
    );
    expect(screen.getByTestId("review-package-submitted-intake-recap")).toHaveTextContent("ArchLucid");
    expect(screen.getByTestId("review-package-submitted-intake-recap")).toHaveTextContent(
      "ARCHITECTURE_HANDBOOK.docx",
    );
    expect(screen.getByTestId("review-package-failure-recovery-steps")).toHaveTextContent(
      "administrator handoff",
    );
    expect(screen.queryByTestId("review-package-failure-support-hint")).toBeNull();
    expect(screen.getByTestId("review-package-do-this-next-action")).toHaveTextContent("Re-run review");
  });

  it("renders in-place rerun button when live AI is ready", () => {
    render(
      <ReviewPackageDoThisNextStrip
        runId="run-1"
        hasGoldenManifest={false}
        commitBlockedReason={null}
        sessionAiReadiness={loadedReadySessionAiReadiness}
        next={{
          kind: "rerun-review",
          sentence:
            "Execution failed before the first pipeline stage — this is usually platform AI availability, not missing intake fields. Follow the steps below, then re-run the review.",
          actionLabel: "Re-run review",
          href: "/architecture/reviews/new?path=guided-intake&rerun=run-1",
          failureRecovery: {
            headline: "Execution failed before the first pipeline stage",
            detail: "unknown agent: invalid operator",
            recoverySteps: ["Click Re-run review."],
            suggestSupportTicket: false,
            severity: "error",
            supportHref: "/help/report-a-problem",
            intactSummary: REVIEW_PRE_STAGE_FAILURE_INTACT_SUMMARY,
            workspaceAiConfigurationSignal: {
              label: "Workspace AI configuration",
              detail: "Review failure pattern suggests ArchLucid-managed AI may be unavailable.",
            },
          },
        }}
      />,
    );

    expect(screen.getByTestId("review-package-re-run-review")).toBeInTheDocument();
    expect(screen.getByTestId("review-package-do-this-next-sentence")).toHaveTextContent(
      "platform AI is ready for this session",
    );
    expect(screen.getByTestId("review-package-do-this-next-sentence")).not.toHaveTextContent(
      "usually platform AI availability",
    );
  });

  it("disables rerun CTA when live AI blocks execute", () => {
    render(
      <ReviewPackageDoThisNextStrip
        runId="run-1"
        hasGoldenManifest={false}
        commitBlockedReason={null}
        sessionAiReadiness={loadedUnavailableSessionAiReadiness}
        next={{
          kind: "rerun-review",
          sentence:
            "Execution failed before the first pipeline stage — this is usually platform AI availability, not missing intake fields. Follow the steps below, then re-run the review.",
          actionLabel: "Re-run review",
          href: "/architecture/reviews/new?path=guided-intake&rerun=run-1",
          failureRecovery: {
            headline: "Execution failed before the first pipeline stage",
            detail: "Missing Azure OpenAI deployment configuration",
            recoverySteps: [
              "Share the administrator handoff below with a workspace administrator — this account cannot change AI configuration.",
              "After your administrator confirms workspace AI setup, return here and click Re-run review.",
            ],
            suggestSupportTicket: false,
            severity: "error",
            supportHref: "/help/report-a-problem",
            intactSummary: REVIEW_PRE_STAGE_FAILURE_INTACT_SUMMARY,
            workspaceAiConfigurationSignal: {
              label: "Workspace AI configuration",
              detail: "Missing Azure OpenAI credentials or deployment config",
            },
            adminHandoff: {
              markdown: "Review ID: run-1\nFailure: Execution failed before the first pipeline stage",
              verificationLines: ["Connection probe passes on Administration → Model governance."],
            },
            submittedIntakeRecap: {
              fields: [{ label: "Review title", value: "ArchLucid" }],
              attachedFiles: ["ARCHITECTURE_HANDBOOK.docx"],
            },
          },
        }}
      />,
    );

    expect(screen.queryByTestId("review-package-re-run-review")).toBeNull();
    expect(screen.getByTestId("review-package-do-this-next-action")).toHaveTextContent("Re-run review");
  });

  it("hides What to do when the live probe succeeded and only re-run is required", () => {
    render(
      <ReviewPackageDoThisNextStrip
        runId="run-1"
        hasGoldenManifest={false}
        commitBlockedReason={null}
        sessionAiReadiness={loadedAvailableSessionAiReadiness}
        next={{
          kind: "rerun-review",
          sentence:
            "Execution failed before the first pipeline stage — this is usually platform AI availability, not missing intake fields. Follow the steps below, then re-run the review.",
          actionLabel: "Re-run review",
          href: "/architecture/reviews/new?path=guided-intake&rerun=run-1",
          failureRecovery: failureRecoveryFixture,
        }}
      />,
    );

    expect(screen.queryByTestId("review-package-failure-recovery-steps")).toBeNull();
    expect(screen.getByTestId("review-package-do-this-next-sentence")).toHaveTextContent(
      "re-run the review to retry with the same intake",
    );
    expect(screen.getByTestId("review-package-re-run-review")).toBeInTheDocument();
    expect(screen.queryByTestId("review-package-do-this-next-action")).toBeNull();
  });

  it("renders outline evidence CTA and secondary sponsor link when demoted", () => {
    render(
      <ReviewPackageDoThisNextStrip
        runId="run-1"
        hasGoldenManifest
        commitBlockedReason={null}
        sessionAiReadiness={readySessionAiReadiness}
        next={{
          kind: "send-to-sponsor",
          sentence:
            "This package is finalized, but none of its 4 open findings have linked evidence — review evidence coverage before sharing with a sponsor.",
          actionLabel: "Review evidence coverage",
          href: "/architecture/reviews/run-1?reviewTab=evidence",
          buttonVariant: "outline",
          secondaryAction: {
            label: "Send to sponsor",
            href: "/architecture/reviews/run-1?reviewTab=review-package#sponsor-handoff",
          },
        }}
      />,
    );

    expect(screen.getByRole("link", { name: "Review evidence coverage" })).toBeInTheDocument();
    const sponsorAction = screen.getByTestId("review-package-do-this-next-secondary-action");
    expect(sponsorAction).toHaveTextContent("Send to sponsor");
    expect(sponsorAction.className).toContain("border-neutral-300");
  });
});
