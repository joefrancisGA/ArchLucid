import { describe, expect, it } from "vitest";

import {
  PIPELINE_STATUS_BUYER_DISPLAY_LABELS,
  PIPELINE_STATUS_LABELS,
} from "@/lib/i18n";
import {
  resolvePipelineStatusAriaPrefix,
  resolvePipelineStatusDisplayLabel,
} from "@/lib/resolve-pipeline-status-display-label";

describe("resolvePipelineStatusDisplayLabel", () => {
  it("returns internal engineering labels when vocabulary pass is off", () => {
    expect(resolvePipelineStatusDisplayLabel(PIPELINE_STATUS_LABELS.finalized, false)).toBe("Finalized");
    expect(resolvePipelineStatusDisplayLabel(PIPELINE_STATUS_LABELS.inPipeline, false)).toBe("In pipeline");
  });

  it("returns canonical buyer labels when vocabulary pass is on", () => {
    expect(resolvePipelineStatusDisplayLabel(PIPELINE_STATUS_LABELS.finalized, true)).toBe(
      PIPELINE_STATUS_BUYER_DISPLAY_LABELS.finalized,
    );
    expect(resolvePipelineStatusDisplayLabel(PIPELINE_STATUS_LABELS.readyToFinalize, true)).toBe(
      PIPELINE_STATUS_BUYER_DISPLAY_LABELS.readyToFinalize,
    );
    expect(resolvePipelineStatusDisplayLabel(PIPELINE_STATUS_LABELS.inPipeline, true)).toBe(
      PIPELINE_STATUS_BUYER_DISPLAY_LABELS.inPipeline,
    );
    expect(resolvePipelineStatusDisplayLabel(PIPELINE_STATUS_LABELS.starting, true)).toBe(
      PIPELINE_STATUS_BUYER_DISPLAY_LABELS.starting,
    );
  });

  it("falls back to the internal label for unmapped values from loosely-typed callers", () => {
    const unmapped = "Unknown status" as never;

    expect(resolvePipelineStatusDisplayLabel(unmapped, true)).toBe("Unknown status");
  });
});

describe("resolvePipelineStatusAriaPrefix", () => {
  it("shortens aria prefix for buyer vocabulary", () => {
    expect(resolvePipelineStatusAriaPrefix(true)).toBe("Review status");
    expect(resolvePipelineStatusAriaPrefix(false)).toBe("Architecture review pipeline status");
  });
});
