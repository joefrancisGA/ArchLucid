import { describe, expect, it } from "vitest";

import { GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM } from "./governance-findings-bulk-disposition-confirm-url";
import { GOVERNANCE_FINDINGS_BULK_PARAM } from "./governance-findings-bulk-selection-url";
import { GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM } from "./governance-findings-resource-group-disclosure-url";
import {
  FINDING_KEYBOARD_TRIAGE_ACTION_PARAM,
  FINDING_KEYBOARD_TRIAGE_FINDING_ID_PARAM,
} from "./finding-keyboard-triage-confirm-url";
import {
  GOVERNANCE_RECORD_CORRECTION_KIND_PARAM,
  GOVERNANCE_RECORD_CORRECTION_RUN_ID_PARAM,
  GOVERNANCE_RECORD_CORRECTION_SUBJECT_ID_PARAM,
} from "./governance-record-correction-confirm-url";
import { governanceFindingsPickReviewForTriageHref } from "./governance-findings-pick-review-url";

describe("governanceFindingsPickReviewForTriageHref", () => {
  it("clears stale architecture scope and register filters when picking a review for triage", () => {
    const href = governanceFindingsPickReviewForTriageHref(
      "architectureId=arch-1&filter=open",
      "/governance/findings",
      "run-2",
    );

    expect(href).toBe("/governance/findings?runId=run-2");
    expect(href).not.toContain("architectureId=");
    expect(href).not.toContain("filter=");
  });

  it("clears architecture-scoped facet params when picking a review for triage", () => {
    const href = governanceFindingsPickReviewForTriageHref(
      "architectureId=arch-1&filter=expiring-soon&findingJobView=ready-for-sponsor-packet&severity=high&groupBy=resource&q=phi",
      "/governance/findings",
      "run-2",
    );

    expect(href).toBe("/governance/findings?runId=run-2");
  });


  it("preserves register and facet params when review id is whitespace-only", () => {
    const href = governanceFindingsPickReviewForTriageHref(
      "filter=expiring-soon&findingJobView=ready-for-sponsor-packet&severity=high",
      "/governance/findings",
      "   ",
    );

    expect(href).toBe(
      "/governance/findings?filter=expiring-soon&findingJobView=ready-for-sponsor-packet&severity=high",
    );
  });
  it("preserves register and facet params while setting runId", () => {
    const href = governanceFindingsPickReviewForTriageHref(
      "filter=expiring-soon&findingJobView=ready-for-sponsor-packet&severity=high",
      "/governance/findings",
      "run-9",
    );

    expect(href).toBe(
      "/governance/findings?filter=expiring-soon&findingJobView=ready-for-sponsor-packet&severity=high&runId=run-9",
    );
  });

  it("clears stale resource-group disclosure when picking a review for triage", () => {
    const href = governanceFindingsPickReviewForTriageHref(
      `filter=open&groupBy=resource&${GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM}=resource%3Aabc`,
      "/governance/findings",
      "run-9",
    );

    expect(href).toBe("/governance/findings?filter=open&groupBy=resource&runId=run-9");
    expect(href).not.toContain(GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM);
  });

  it("clears stale bulk selection when picking a review for triage", () => {
    const href = governanceFindingsPickReviewForTriageHref(
      `filter=open&${GOVERNANCE_FINDINGS_BULK_PARAM}=f1,f2&${GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM}=accepted`,
      "/governance/findings",
      "run-9",
    );

    expect(href).toBe("/governance/findings?filter=open&runId=run-9");
    expect(href).not.toContain(`${GOVERNANCE_FINDINGS_BULK_PARAM}=`);
    expect(href).not.toContain(`${GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM}=`);
  });

  it("clears stale keyboard and record-correction confirm params when picking a review", () => {
    const href = governanceFindingsPickReviewForTriageHref(
      `runId=run-1&${FINDING_KEYBOARD_TRIAGE_FINDING_ID_PARAM}=finding-1&${FINDING_KEYBOARD_TRIAGE_ACTION_PARAM}=accepted&${GOVERNANCE_RECORD_CORRECTION_KIND_PARAM}=governance_quick_approve&${GOVERNANCE_RECORD_CORRECTION_SUBJECT_ID_PARAM}=sub-1&${GOVERNANCE_RECORD_CORRECTION_RUN_ID_PARAM}=run-1`,
      "/governance/findings",
      "run-9",
    );

    expect(href).toBe("/governance/findings?runId=run-9");
    expect(href).not.toContain(`${FINDING_KEYBOARD_TRIAGE_FINDING_ID_PARAM}=`);
    expect(href).not.toContain(`${GOVERNANCE_RECORD_CORRECTION_KIND_PARAM}=`);
  });
});
