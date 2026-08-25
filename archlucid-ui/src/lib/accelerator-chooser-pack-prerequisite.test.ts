import { describe, expect, it } from "vitest";

import {
  ACCELERATOR_FOLLOWUP_PACK_TAG_LABEL,
  ACCELERATOR_GREENFIELD_PACK_ID,
  ACCELERATOR_PACK_CTA_PENDING_CHECKING_MESSAGE,
  ACCELERATOR_PACK_CTA_PENDING_UNKNOWN_MESSAGE,
  ACCELERATOR_PACK_CTA_RETRY_LABEL,
  ACCELERATOR_PACK_START_FOLLOWUP_LABEL,
  ACCELERATOR_PACK_START_GREENFIELD_LABEL,
  ACCELERATOR_PACK_UNLOCK_BLOCKED_MESSAGE,
  resolvePackCtaPresentation,
} from "@/lib/accelerator-chooser-pack-prerequisite";

describe("resolvePackCtaPresentation", () => {
  it("returns greenfield start link when prerequisite is not met", () => {
    expect(resolvePackCtaPresentation("not-met", ACCELERATOR_GREENFIELD_PACK_ID)).toEqual({
      mode: "start-link",
      visibleLabel: ACCELERATOR_PACK_START_GREENFIELD_LABEL,
      statusMessage: null,
      usePrimaryVariant: true,
    });
  });

  it("returns locked status for specialty packs when prerequisite is not met", () => {
    expect(resolvePackCtaPresentation("not-met", "ai-llm-workload")).toEqual({
      mode: "locked-status",
      visibleLabel: null,
      statusMessage: ACCELERATOR_PACK_UNLOCK_BLOCKED_MESSAGE,
      usePrimaryVariant: false,
    });
  });

  it("returns follow-up start link when prerequisite is met", () => {
    expect(resolvePackCtaPresentation("met", "ai-llm-workload")).toEqual({
      mode: "start-link",
      visibleLabel: ACCELERATOR_PACK_START_FOLLOWUP_LABEL,
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

  it("keeps follow-up taxonomy label separate from unlock copy", () => {
    expect(ACCELERATOR_FOLLOWUP_PACK_TAG_LABEL).toBe("Follow-up pack");
    expect(ACCELERATOR_PACK_UNLOCK_BLOCKED_MESSAGE).not.toContain(ACCELERATOR_FOLLOWUP_PACK_TAG_LABEL);
  });
});
