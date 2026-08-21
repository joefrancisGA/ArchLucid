import { describe, expect, it } from "vitest";

import {
  architectureDraftAllowsBriefUnlock,
  architectureDraftIntakeModeLead,
  ARCHITECTURE_DRAFT_INTAKE_MODE_LEAD,
  ARCHITECTURE_DRAFT_INTAKE_MODE_SUBMITTED_LEAD,
  isArchitectureDraftInReviewIntake,
} from "@/lib/architecture/architecture-draft-intake-mode";
import type { DraftRequestStatus } from "@/types/draft-intake";

const statuses: readonly DraftRequestStatus[] = [
  "Drafting",
  "Admitted",
  "Submitted",
  "RunSpawned",
  "Redirected",
  "Abandoned",
];

describe("architecture-draft-intake-mode", () => {
  it.each(statuses)("classifies %s for intake freeze and unlock", (status) => {
    expect(isArchitectureDraftInReviewIntake(status)).toBe(status === "Admitted" || status === "Submitted");
    expect(architectureDraftAllowsBriefUnlock(status)).toBe(status === "Admitted");
  });

  it("uses submitted copy only after submit", () => {
    expect(architectureDraftIntakeModeLead("Admitted")).toBe(ARCHITECTURE_DRAFT_INTAKE_MODE_LEAD);
    expect(architectureDraftIntakeModeLead("Submitted")).toBe(ARCHITECTURE_DRAFT_INTAKE_MODE_SUBMITTED_LEAD);
  });
});
