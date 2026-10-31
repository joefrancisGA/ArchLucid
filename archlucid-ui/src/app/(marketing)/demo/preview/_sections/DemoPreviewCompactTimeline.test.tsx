import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DemoPreviewCompactTimeline } from "@/app/(marketing)/demo/preview/_sections/DemoPreviewCompactTimeline";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";
import type { PipelineTimelineItem } from "@/types/authority";

vi.mock("@/components/AuthorityPipelineTimeline", () => ({
  AuthorityPipelineTimeline: () => <div data-testid="mock-pipeline-timeline" />,
}));

const pipelineItems: PipelineTimelineItem[] = [
  {
    eventId: "evt-1",
    eventType: "RunCreated",
    occurredUtc: "2026-01-01T00:00:00.000Z",
    actorUserName: "demo",
  },
];

describe("DemoPreviewCompactTimeline technical details honesty", () => {
  it("labels missing review scope, themes, and artifact types", async () => {
    const payload = {
      run: { runId: "run-1", description: "  " },
      manifest: { operatorSummary: "  ", ruleSetId: "", ruleSetVersion: "" },
      runExplanation: { themeSummaries: [] },
      artifacts: [],
    } as DemoCommitPagePreviewResponse;

    render(
      <DemoPreviewCompactTimeline
        payload={payload}
        pipelineItems={pipelineItems}
        isRunDetailAvailable={false}
      />,
    );

    const details = screen.getByText("Technical details").closest("details");

    expect(details).not.toBeNull();
    details?.click();

    expect(await screen.findByText("Theme summaries were not stored.")).toBeInTheDocument();
    expect(screen.getByText("Review scope was stored empty.")).toBeInTheDocument();
    expect(screen.getByText("Artifact types were not stored.")).toBeInTheDocument();
  });
});
