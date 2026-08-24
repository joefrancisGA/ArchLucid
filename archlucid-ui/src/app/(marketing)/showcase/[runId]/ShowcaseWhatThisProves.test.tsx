import { describe, expect, it } from "vitest";

import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";

import { createMinimalDemoPreviewPayload } from "../../see-it/see-it.fixtures";

import { showcaseOutcomeSnapshotFromPayload } from "./ShowcaseWhatThisProves";

describe("ShowcaseWhatThisProves", () => {
  it("showcaseOutcomeSnapshotFromPayload tolerates missing artifact and timeline arrays", () => {
    const payload = createMinimalDemoPreviewPayload() as DemoCommitPagePreviewResponse & {
      artifacts?: DemoCommitPagePreviewResponse["artifacts"];
      pipelineTimeline?: DemoCommitPagePreviewResponse["pipelineTimeline"];
    };

    delete payload.artifacts;
    delete payload.pipelineTimeline;

    const snapshot = showcaseOutcomeSnapshotFromPayload(payload);

    expect(snapshot.artifactCount).toBe(0);
    expect(snapshot.pipelineEventCount).toBe(0);
  });
});
