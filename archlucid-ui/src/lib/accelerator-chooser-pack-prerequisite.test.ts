import { describe, expect, it } from "vitest";

import {
  ACCELERATOR_GREENFIELD_PACK_ID,
  acceleratorPackRequiresSignedReviewRecord,
  isAcceleratorPackBlockedByPrerequisite,
  prerequisiteNeedsPrimaryFirstReviewAction,
  prerequisiteNeedsPrimaryGreenfieldAction,
  prerequisiteNeedsRetryAction,
  resolvePackCtaState,
} from "@/lib/accelerator-chooser-pack-prerequisite";

describe("accelerator-chooser-pack-prerequisite", () => {
  it("treats greenfield as not requiring a sealed review record", () => {
    expect(acceleratorPackRequiresSignedReviewRecord(ACCELERATOR_GREENFIELD_PACK_ID)).toBe(false);
    expect(acceleratorPackRequiresSignedReviewRecord("regulated-saas-soc-procurement")).toBe(true);
  });

  it("blocks specialty packs only when prerequisite is not met", () => {
    expect(isAcceleratorPackBlockedByPrerequisite("not-met", "ai-llm-workload")).toBe(true);
    expect(isAcceleratorPackBlockedByPrerequisite("unknown", "azure-cost-governance")).toBe(false);
    expect(isAcceleratorPackBlockedByPrerequisite("checking", "ai-llm-workload")).toBe(false);
    expect(isAcceleratorPackBlockedByPrerequisite("met", "ai-llm-workload")).toBe(false);
    expect(isAcceleratorPackBlockedByPrerequisite("not-met", ACCELERATOR_GREENFIELD_PACK_ID)).toBe(false);
  });

  it("resolves distinct CTA states for checking and unknown", () => {
    expect(resolvePackCtaState("checking", "ai-llm-workload")).toBe("pending-checking");
    expect(resolvePackCtaState("unknown", "ai-llm-workload")).toBe("pending-unknown");
    expect(resolvePackCtaState("not-met", "ai-llm-workload")).toBe("blocked-not-met");
    expect(resolvePackCtaState("met", "ai-llm-workload")).toBe("ready");
    expect(resolvePackCtaState("not-met", ACCELERATOR_GREENFIELD_PACK_ID)).toBe("ready");
  });

  it("elevates greenfield action when prerequisite is not met", () => {
    expect(prerequisiteNeedsPrimaryGreenfieldAction("not-met")).toBe(true);
    expect(prerequisiteNeedsPrimaryGreenfieldAction("unknown")).toBe(false);
    expect(prerequisiteNeedsPrimaryGreenfieldAction("met")).toBe(false);
  });

  it("elevates first-review help action when prerequisite is unknown", () => {
    expect(prerequisiteNeedsPrimaryFirstReviewAction("unknown")).toBe(true);
    expect(prerequisiteNeedsPrimaryFirstReviewAction("not-met")).toBe(false);
    expect(prerequisiteNeedsPrimaryFirstReviewAction("met")).toBe(false);
    expect(prerequisiteNeedsPrimaryFirstReviewAction("checking")).toBe(false);
  });

  it("shows retry when prerequisite is unknown", () => {
    expect(prerequisiteNeedsRetryAction("unknown")).toBe(true);
    expect(prerequisiteNeedsRetryAction("not-met")).toBe(false);
  });
});
