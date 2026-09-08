import { describe, expect, it } from "vitest";

import {
  ACCELERATOR_COST_BASELINE_RECOMMENDATION,
  ACCELERATOR_GREENFIELD_PACK_ID,
  ACCELERATOR_PACK_CTA_PENDING_CHECKING_MESSAGE,
  ACCELERATOR_PACK_CTA_PENDING_UNKNOWN_MESSAGE,
  ACCELERATOR_PACK_CTA_RETRY_LABEL,
  ACCELERATOR_PACK_START_LABEL,
  acceleratorPackShowsCostBaselineRecommendation,
  resolvePackCtaPresentation,
} from "@/lib/accelerator-chooser-pack-prerequisite";

describe("resolvePackCtaPresentation", () => {
  it("returns start link for greenfield when prerequisite is not met", () => {
    expect(resolvePackCtaPresentation("not-met", ACCELERATOR_GREENFIELD_PACK_ID)).toEqual({
      mode: "start-link",
      visibleLabel: ACCELERATOR_PACK_START_LABEL,
      statusMessage: null,
      usePrimaryVariant: true,
    });
  });

  it("returns start link for specialty packs when prerequisite is not met", () => {
    expect(resolvePackCtaPresentation("not-met", "ai-llm-workload")).toEqual({
      mode: "start-link",
      visibleLabel: ACCELERATOR_PACK_START_LABEL,
      statusMessage: null,
      usePrimaryVariant: false,
    });
  });

  it("returns start link when prerequisite is met", () => {
    expect(resolvePackCtaPresentation("met", "ai-llm-workload")).toEqual({
      mode: "start-link",
      visibleLabel: ACCELERATOR_PACK_START_LABEL,
      statusMessage: null,
      usePrimaryVariant: false,
    });
  });

  it("returns checking status without a start control", () => {
    expect(resolvePackCtaPresentation("checking", "regulated-saas-soc-procurement")).toEqual({
      mode: "checking-status",
      visibleLabel: null,
      statusMessage: ACCELERATOR_PACK_CTA_PENDING_CHECKING_MESSAGE,
      usePrimaryVariant: false,
    });
  });

  it("returns retry button when prerequisite is unknown", () => {
    expect(resolvePackCtaPresentation("unknown", "healthcare-data-workflow")).toEqual({
      mode: "retry-button",
      visibleLabel: ACCELERATOR_PACK_CTA_RETRY_LABEL,
      statusMessage: ACCELERATOR_PACK_CTA_PENDING_UNKNOWN_MESSAGE,
      usePrimaryVariant: false,
    });
  });

  it("flags cost policy packs for baseline recommendation copy", () => {
    expect(acceleratorPackShowsCostBaselineRecommendation("azure-cost-governance")).toBe(true);
    expect(acceleratorPackShowsCostBaselineRecommendation("ai-llm-workload")).toBe(false);
    expect(ACCELERATOR_COST_BASELINE_RECOMMENDATION.toLowerCase()).toContain("recommended");
  });
});
