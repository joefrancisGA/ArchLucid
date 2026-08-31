import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReviewPackageDoThisNextStrip } from "./ReviewPackageDoThisNextStrip";

vi.mock("@/components/CommitRunButton", () => ({
  CommitRunButton: () => <button type="button">Finalize review</button>,
}));

describe("ReviewPackageDoThisNextStrip", () => {
  it("renders sentence and link CTA", () => {
    render(
      <ReviewPackageDoThisNextStrip
        runId="run-1"
        hasGoldenManifest={false}
        commitBlockedReason={null}
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

  it("renders failure recovery details when assessment failed", () => {
    render(
      <ReviewPackageDoThisNextStrip
        runId="run-1"
        hasGoldenManifest={false}
        commitBlockedReason={null}
        next={{
          kind: "rerun-review",
          sentence: "Assessment failed — follow the recovery steps below, then re-run the review with the same intake.",
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
          },
        }}
      />,
    );

    expect(screen.getByTestId("review-package-failure-recovery")).toBeInTheDocument();
    expect(screen.getByTestId("review-package-failure-headline")).toHaveTextContent(
      "Execution failed before the first pipeline stage",
    );
    expect(screen.getByTestId("review-package-failure-detail")).toHaveTextContent(
      "Missing Azure OpenAI deployment configuration",
    );
    expect(screen.getByTestId("review-package-workspace-ai-signal")).toHaveTextContent(
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
    expect(screen.getByTestId("review-package-failure-recovery-steps")).toHaveTextContent("administrator handoff");
    expect(screen.queryByTestId("review-package-failure-support-hint")).toBeNull();
    expect(screen.getByRole("link", { name: "Re-run review" })).toBeInTheDocument();
  });

  it("renders outline evidence CTA and secondary sponsor link when demoted", () => {
    render(
      <ReviewPackageDoThisNextStrip
        runId="run-1"
        hasGoldenManifest
        commitBlockedReason={null}
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
