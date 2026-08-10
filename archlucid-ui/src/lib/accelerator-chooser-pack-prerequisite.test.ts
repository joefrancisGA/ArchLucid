import { describe, expect, it } from "vitest";

import {
  ACCELERATOR_GREENFIELD_PACK_ID,
  acceleratorPackRequiresSignedReviewRecord,
  isAcceleratorPackBlockedByPrerequisite,
  prerequisiteNeedsPrimaryFirstReviewAction,
} from "@/lib/accelerator-chooser-pack-prerequisite";

describe("accelerator-chooser-pack-prerequisite", () => {
  it("treats greenfield as not requiring a signed review record", () => {
    expect(acceleratorPackRequiresSignedReviewRecord(ACCELERATOR_GREENFIELD_PACK_ID)).toBe(false);
    expect(acceleratorPackRequiresSignedReviewRecord("regulated-saas-soc-procurement")).toBe(true);
  });

  it("blocks specialty packs when prerequisite is not met or unknown", () => {
    expect(isAcceleratorPackBlockedByPrerequisite("not-met", "ai-llm-workload")).toBe(true);
    expect(isAcceleratorPackBlockedByPrerequisite("unknown", "azure-cost-governance")).toBe(true);
    expect(isAcceleratorPackBlockedByPrerequisite("checking", "ai-llm-workload")).toBe(true);
    expect(isAcceleratorPackBlockedByPrerequisite("met", "ai-llm-workload")).toBe(false);
    expect(isAcceleratorPackBlockedByPrerequisite("not-met", ACCELERATOR_GREENFIELD_PACK_ID)).toBe(false);
  });

  it("elevates first-review action when prerequisite is not met or unknown", () => {
    expect(prerequisiteNeedsPrimaryFirstReviewAction("not-met")).toBe(true);
    expect(prerequisiteNeedsPrimaryFirstReviewAction("unknown")).toBe(true);
    expect(prerequisiteNeedsPrimaryFirstReviewAction("met")).toBe(false);
    expect(prerequisiteNeedsPrimaryFirstReviewAction("checking")).toBe(false);
  });
});
