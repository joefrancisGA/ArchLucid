import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  DemoPreviewFriendlyUnavailable,
  DemoPreviewMarketingBody,
  DemoPreviewNotAvailable,
} from "./DemoPreviewMarketingBody";
import { DemoPreviewHero } from "./_sections/DemoPreviewHero";
import { DemoPreviewResultAtAGlance } from "./_sections/DemoPreviewResultAtAGlance";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";
import { getShowcaseStaticDemoPayload, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

const fixture: DemoCommitPagePreviewResponse = {
  generatedUtc: "2026-04-01T12:00:00.000Z",
  isDemoData: true,
  demoStatusMessage: "demo tenant — replace before publishing",
  run: {
    runId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    projectId: "default",
    description: "Fixture",
    createdUtc: "2026-03-15T08:00:00Z",
  },
  authorityChain: {
    contextSnapshotId: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    graphSnapshotId: null,
    findingsSnapshotId: null,
    goldenManifestId: "cccccccccccccccccccccccccccccccc",
    decisionTraceId: null,
    artifactBundleId: null,
  },
  manifest: {
    manifestId: "cccccccccccccccccccccccccccccccc",
    runId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    createdUtc: "2026-03-15T08:05:00Z",
    manifestHash: "mh",
    ruleSetId: "rs",
    ruleSetVersion: "v1",
    decisionCount: 2,
    warningCount: 1,
    unresolvedIssueCount: 0,
    status: "Committed",
    operatorSummary: "2 decisions, 1 warnings, 0 unresolved issues, status Committed",
  },
  artifacts: [
    {
      artifactId: "dddddddddddddddddddddddddddddddd",
      artifactType: "docx",
      name: "Architecture brief",
      format: "binary",
      createdUtc: "2026-03-15T08:06:00Z",
      contentHash: "abc123",
    },
  ],
  pipelineTimeline: [
    {
      eventId: "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      occurredUtc: "2026-03-15T08:04:00Z",
      eventType: "Commit",
      actorUserName: "demo",
      correlationId: "corr-1",
    },
  ],
  runExplanation: {
    explanation: {
      rawText: "",
      structured: null,
      confidence: null,
      provenance: null,
      summary: "Summary",
      keyDrivers: [],
      riskImplications: [],
      costImplications: [],
      complianceImplications: [],
      detailedNarrative: "Narrative",
    },
    themeSummaries: ["Theme A", "Theme B"],
    overallAssessment: "Healthy",
    riskPosture: "Moderate",
    findingCount: 3,
    decisionCount: 2,
    unresolvedIssueCount: 0,
    complianceGapCount: 0,
    citations: [
      { kind: "Manifest", id: "m-1", label: "manifest" },
      { kind: "Finding", id: "f-1", label: "finding" },
    ],
  },
};

const showcasePayload = getShowcaseStaticDemoPayload(SHOWCASE_STATIC_DEMO_RUN_ID);

describe("Demo preview marketing body", () => {
  it("renders guided buyer walkthrough sections from showcase payload", () => {
    render(
      <>
        <DemoPreviewResultAtAGlance payload={showcasePayload} />
        <DemoPreviewMarketingBody payload={showcasePayload} />
      </>,
    );

    expect(screen.getByTestId("demo-preview-artifact-nav")).toBeInTheDocument();
    expect(screen.getByTestId("demo-preview-sponsor-conclusion")).toBeInTheDocument();
    expect(screen.getByTestId("demo-preview-result-at-a-glance")).toBeInTheDocument();
    expect(screen.queryByTestId("demo-preview-guided-callouts")).not.toBeInTheDocument();
    expect(screen.queryByText("How to read this walkthrough")).not.toBeInTheDocument();
    expect(screen.queryByText("Review summary")).not.toBeInTheDocument();
    expect(screen.getByTestId("demo-preview-signin-callout")).toBeInTheDocument();
    expect(screen.getByTestId("demo-preview-signup-cta")).toBeInTheDocument();
  });

  it("renders hero, result panel, artifact navigation, and lifecycle from fixture payload", () => {
    render(
      <>
        <DemoPreviewHero />
        <DemoPreviewResultAtAGlance payload={fixture} />
        <DemoPreviewMarketingBody payload={fixture} buyerAudienceChrome={false} />
      </>,
    );

    expect(screen.getByTestId("demo-preview-hero")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "See a finalized architecture review" })).toBeInTheDocument();
    expect(screen.getByTestId("demo-preview-result-at-a-glance")).toHaveTextContent("Review result at a glance");
    expect(screen.getByTestId("demo-preview-review-trail")).toBeInTheDocument();
    expect(screen.getByTestId("demo-preview-artifacts")).toBeInTheDocument();
    expect(screen.queryByText("Context snapshot ID")).not.toBeInTheDocument();
  });

  it("renders the not-available notice", () => {
    render(<DemoPreviewNotAvailable />);
    expect(screen.getByTestId("demo-preview-not-available")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /see it in 30 seconds/i })).toHaveAttribute("href", "/see-it");
  });

  it("renders customer-safe friendly unavailable with example links", () => {
    render(<DemoPreviewFriendlyUnavailable />);
    expect(screen.getByTestId("demo-preview-friendly-unavailable")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view example output/i })).toHaveAttribute(
      "href",
      "/showcase/customer-intake-modernization",
    );
  });

  it("does not render sponsor email banner or finalize controls", () => {
    render(<DemoPreviewMarketingBody payload={fixture} buyerAudienceChrome={false} />);

    expect(screen.queryByTestId("email-run-to-sponsor-banner")).toBeNull();
    expect(screen.queryByRole("button", { name: /finalize manifest/i })).toBeNull();
  });
});
