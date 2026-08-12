import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { describe, expect, it } from "vitest";

import { FIRST_PILOT_BUYER_COPY } from "@/lib/first-pilot-buyer-copy";
import { FIRST_PILOT_OPERATING_RAIL_STEPS } from "@/lib/first-pilot-operating-rail-steps";
import {
  buildReadinessCloudEvidenceSummary,
  FIRST_VISIT_HELP_THREE_THINGS,
  listOnboardingSecondarySurfaceViolations,
  listOnboardingTourCopyViolations,
  ONBOARDING_TOUR_FOLLOW_WORKFLOW_BODY,
  ONBOARDING_TOUR_GET_HELP_BODY,
  ONBOARDING_TOUR_NEW_REVIEW_BODY,
  ONBOARDING_TOUR_READY_BODY,
  ONBOARDING_TOUR_REVIEW_PACKAGES_BODY,
  ONBOARDING_TOUR_WELCOME_BODY,
  OPERATOR_ONBOARDING_TOUR_STEPS,
  OPT_IN_TOUR_EVIDENCE_STEP,
  READINESS_CLOUD_EVIDENCE_LABEL,
  READINESS_AZURE_EXTRACTOR_CTA,
  WELCOME_OPERATOR_EVIDENCE_STEP,
} from "@/lib/onboarding-secondary-surfaces";
import { PILOT_COMMAND_CENTER_CONNECT_AZURE, PILOT_PATH_PREVIEW_STEPS } from "@/lib/buyer/buyer-polish-copy";

describe("onboarding-secondary-surfaces (TB-342)", () => {
  it("uses multi-cloud inventory script guidance in readiness cloud evidence summary", () => {
    const summary = buildReadinessCloudEvidenceSummary(false, false);

    expect(summary).toContain("Get-ArchLucidAwsPackage.ps1");
    expect(summary).toContain("Get-ArchLucidGcpPackage.ps1");
    expect(summary.toLowerCase()).not.toMatch(/\bazure-only\b/);
  });

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
      "readiness-cloud-summary": buildReadinessCloudEvidenceSummary(false, false),
    });

    expect(violations).toEqual([]);
  });

  it("uses canonical cloud evidence readiness label export", () => {
    expect(READINESS_CLOUD_EVIDENCE_LABEL).toBe("Tier-1 cloud inventory ZIP");
  });

  it("uses evidence-first path preview and tertiary Connect cloud label", () => {
    expect(PILOT_PATH_PREVIEW_STEPS[0]?.label.toLowerCase()).toContain("design");
    expect(PILOT_PATH_PREVIEW_STEPS[0]?.label.toLowerCase()).toContain("evidence");
    expect(PILOT_COMMAND_CENTER_CONNECT_AZURE).toBe("Connect cloud");
    expect(READINESS_AZURE_EXTRACTOR_CTA.toLowerCase()).toBe("add evidence");
  });

  it("keeps first-run tour copy workflow-oriented and free of internal jargon", () => {
    expect(listOnboardingTourCopyViolations()).toEqual([]);

    expect(ONBOARDING_TOUR_WELCOME_BODY).toContain("reviews");
    expect(ONBOARDING_TOUR_NEW_REVIEW_BODY).toContain(CREATE_ARCHITECTURE_LABEL);
    expect(ONBOARDING_TOUR_REVIEW_PACKAGES_BODY).toContain("audit trail");
    expect(ONBOARDING_TOUR_FOLLOW_WORKFLOW_BODY).toContain("Architecture");
    expect(ONBOARDING_TOUR_GET_HELP_BODY).toContain("restart the tour");
    expect(ONBOARDING_TOUR_READY_BODY).toContain("pilot checklist");
    expect(OPERATOR_ONBOARDING_TOUR_STEPS).toHaveLength(6);
  });
});
