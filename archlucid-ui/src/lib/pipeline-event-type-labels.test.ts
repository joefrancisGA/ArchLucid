import { describe, expect, it } from "vitest";

import { pipelineEventTypeBuyerMilestoneSubtitle, pipelineEventTypeFriendlyLabel } from "@/lib/pipeline-event-type-labels";

describe("pipelineEventTypeFriendlyLabel", () => {
  it("maps canonical com.archlucid integration codes", () => {
    expect(pipelineEventTypeFriendlyLabel("com.archlucid.authority.run.completed")).toBe("Review finalized");
    expect(pipelineEventTypeFriendlyLabel("com.archlucid.manifest.finalized.v1")).toBe("Manifest finalized");
  });

  it("maps legacy short keys used by mocks", () => {
    expect(pipelineEventTypeFriendlyLabel("RunStarted")).toBe("Review started");
    expect(pipelineEventTypeFriendlyLabel("context.snapshot.created")).toBe("Context captured");
  });

  it("falls back to Contracts-aligned titles for durable spine codes not in the pipeline map", () => {
    expect(pipelineEventTypeFriendlyLabel("ManifestViewed")).toBe("Manifest viewed");
    expect(pipelineEventTypeFriendlyLabel("ReviewTrailAccessed")).toBe("Review trail accessed");
  });

  it("title-cases unknown dotted codes without dumping raw namespaces", () => {
    expect(pipelineEventTypeFriendlyLabel("com.vendor.obscure.pipeline.step")).toBe("Step");
  });
});

describe("pipelineEventTypeBuyerMilestoneSubtitle", () => {
  it("maps key lifecycle codes to buyer-facing narrative lines", () => {
    expect(pipelineEventTypeBuyerMilestoneSubtitle("context.snapshot.created")).toBe(
      "Captures the ingested context used to justify findings and graph evidence.",
    );
    expect(pipelineEventTypeBuyerMilestoneSubtitle("com.archlucid.manifest.finalized.v1")).toBe(
      "Seals the reviewed manifest as the authoritative record for decisions, deliverables, and audit.",
    );
  });

  it("falls back to a generic assurance line for unmapped types", () => {
    expect(pipelineEventTypeBuyerMilestoneSubtitle("CustomObscureEvent")).toBe(
      "Recorded on the authoritative audit trail for this review.",
    );
  });
});
