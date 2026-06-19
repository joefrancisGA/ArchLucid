import { describe, expect, it } from "vitest";

import { FIRST_PILOT_BUYER_COPY } from "@/lib/first-pilot-buyer-copy";
import { FIRST_PILOT_OPERATING_RAIL_STEPS } from "@/lib/first-pilot-operating-rail-steps";
import {
  buildReadinessAzureExtractorSummary,
  FIRST_VISIT_HELP_THREE_THINGS,
  listOnboardingSecondarySurfaceViolations,
  ONBOARDING_TOUR_NEW_REVIEW_BODY,
  ONBOARDING_TOUR_WELCOME_BODY,
  OPT_IN_TOUR_EVIDENCE_STEP,
  READINESS_AZURE_EXTRACTOR_CTA,
  WELCOME_OPERATOR_EVIDENCE_STEP,
} from "@/lib/onboarding-secondary-surfaces";
import { PILOT_COMMAND_CENTER_CONNECT_AZURE, PILOT_PATH_PREVIEW_STEPS } from "@/lib/buyer-polish-copy";

describe("onboarding-secondary-surfaces (TB-342)", () => {
  it("keeps secondary onboarding copy free of Azure-prerequisite lead phrases", () => {
    const ingest = FIRST_PILOT_OPERATING_RAIL_STEPS.find((step) => step.id === "ingest-evidence");

    const violations = listOnboardingSecondarySurfaceViolations({
      "opt-in-tour-evidence": `${OPT_IN_TOUR_EVIDENCE_STEP.title} ${OPT_IN_TOUR_EVIDENCE_STEP.body}`,
      "welcome-operator-evidence": `${WELCOME_OPERATOR_EVIDENCE_STEP.title} ${WELCOME_OPERATOR_EVIDENCE_STEP.description}`,
      "first-visit-help": FIRST_VISIT_HELP_THREE_THINGS,
      "onboarding-tour-welcome": ONBOARDING_TOUR_WELCOME_BODY,
      "onboarding-tour-new-review": ONBOARDING_TOUR_NEW_REVIEW_BODY,
      "operating-rail-ingest": `${ingest?.title ?? ""} ${ingest?.shortBody ?? ""}`,
      "buyer-copy-ingest": FIRST_PILOT_BUYER_COPY.ingestEvidenceWithoutUpload,
      "readiness-azure-summary": buildReadinessAzureExtractorSummary(false, false),
    });

    expect(violations).toEqual([]);
  });

  it("uses evidence-first path preview and tertiary Connect Azure label", () => {
    expect(PILOT_PATH_PREVIEW_STEPS[0]?.label.toLowerCase()).toContain("upload evidence");
    expect(PILOT_COMMAND_CENTER_CONNECT_AZURE).toBe("Connect Azure");
    expect(READINESS_AZURE_EXTRACTOR_CTA.toLowerCase()).toBe("add evidence");
  });
});
