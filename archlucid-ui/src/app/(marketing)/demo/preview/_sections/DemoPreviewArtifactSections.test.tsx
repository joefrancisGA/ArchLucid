import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";

import {
  DemoPreviewEvidenceGraphSection,
  DemoPreviewGovernanceSection,
} from "./DemoPreviewArtifactSections";

function samplePayload(): DemoCommitPagePreviewResponse {
  return {
    run: { runId: SHOWCASE_STATIC_DEMO_RUN_ID, description: "Sample review" },
    manifest: {
      manifestId: "manifest-1",
      decisionCount: 2,
      warningCount: 1,
      unresolvedIssueCount: 0,
    },
    runExplanation: {
      citations: [{ kind: "context", id: "c1", label: "Intake diagram" }],
    },
  };
}

describe("DemoPreviewArtifactSections operator deep-link gating", () => {
  it("routes evidence graph CTA through sign-in when operator deep links are gated", () => {
    const evidenceGraphPath = `/insights/evidence-graph?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;
    const expectedHref = `/auth/signin?returnUrl=${encodeURIComponent(evidenceGraphPath)}`;

    render(
      <DemoPreviewEvidenceGraphSection
        payload={samplePayload()}
        operatorDeepLinksAvailable={false}
      />,
    );

    expect(screen.getByRole("link", { name: "View evidence graph" })).toHaveAttribute("href", expectedHref);
  });

  it("routes approval CTA through sign-in when operator deep links are gated", () => {
    const approvalPath = `/governance/approval-queue?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;
    const expectedHref = `/auth/signin?returnUrl=${encodeURIComponent(approvalPath)}`;

    render(<DemoPreviewGovernanceSection payload={samplePayload()} operatorDeepLinksAvailable={false} />);

    expect(screen.getByRole("link", { name: "View approval" })).toHaveAttribute("href", expectedHref);
  });

  it("keeps direct operator deep links when anonymous visitors may open them", () => {
    const evidenceGraphPath = `/insights/evidence-graph?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

    render(
      <DemoPreviewEvidenceGraphSection
        payload={samplePayload()}
        operatorDeepLinksAvailable
      />,
    );

    expect(screen.getByRole("link", { name: "View evidence graph" })).toHaveAttribute("href", evidenceGraphPath);
  });
});
