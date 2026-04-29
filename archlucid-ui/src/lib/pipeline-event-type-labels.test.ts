import { describe, expect, it } from "vitest";

import { pipelineEventTypeFriendlyLabel } from "@/lib/pipeline-event-type-labels";

describe("pipelineEventTypeFriendlyLabel", () => {
  it("maps canonical com.archlucid integration codes", () => {
    expect(pipelineEventTypeFriendlyLabel("com.archlucid.authority.run.completed")).toBe("Run finalized");
    expect(pipelineEventTypeFriendlyLabel("com.archlucid.manifest.finalized.v1")).toBe("Manifest finalized");
  });

  it("maps legacy short keys used by mocks", () => {
    expect(pipelineEventTypeFriendlyLabel("RunStarted")).toBe("Run started");
    expect(pipelineEventTypeFriendlyLabel("context.snapshot.created")).toBe("Context captured");
  });

  it("title-cases unknown dotted codes without dumping raw namespaces", () => {
    expect(pipelineEventTypeFriendlyLabel("com.vendor.obscure.pipeline.step")).toBe("Step");
  });
});
