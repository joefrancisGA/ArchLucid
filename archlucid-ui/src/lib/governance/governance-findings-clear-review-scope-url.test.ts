import { describe, expect, it } from "vitest";

import { GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM } from "./governance-findings-bulk-disposition-confirm-url";
import { GOVERNANCE_FINDINGS_BULK_PARAM } from "./governance-findings-bulk-selection-url";
import {
  FINDING_KEYBOARD_TRIAGE_ACTION_PARAM,
  FINDING_KEYBOARD_TRIAGE_FINDING_ID_PARAM,
} from "./finding-keyboard-triage-confirm-url";
import { GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM } from "./governance-findings-resource-group-disclosure-url";
import { governanceFindingsClearReviewScopeHref } from "./governance-findings-clear-review-scope-url";

describe("governanceFindingsClearReviewScopeHref", () => {
  it("removes runId while preserving register and facet filters", () => {
    const href = governanceFindingsClearReviewScopeHref(
      "runId=run-1&filter=open&q=phi&findingJobView=ready-for-sponsor-packet&severity=high&groupBy=resource",
      "/governance/findings",
    );

    expect(href).toBe(
      "/governance/findings?filter=open&q=phi&findingJobView=ready-for-sponsor-packet&severity=high&groupBy=resource",
    );
    expect(href).not.toContain("runId=");
  });

  it("preserves architecture scope while clearing review scope", () => {
    const href = governanceFindingsClearReviewScopeHref(
      "runId=run-1&architectureId=arch-1&filter=expiring-soon",
      "/governance/findings",
    );

    expect(href).toBe("/governance/findings?architectureId=arch-1&filter=expiring-soon");
  });

  it("clears stale resource-group disclosure when clearing review scope", () => {
    const href = governanceFindingsClearReviewScopeHref(
      `runId=run-1&filter=open&groupBy=resource&${GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM}=resource%3Aabc`,
      "/governance/findings",
    );

    expect(href).toBe("/governance/findings?filter=open&groupBy=resource");
    expect(href).not.toContain(GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM);
  });

  it("clears stale bulk selection params tied to the scoped review", () => {
    const href = governanceFindingsClearReviewScopeHref(
      `runId=run-1&${GOVERNANCE_FINDINGS_BULK_PARAM}=f1,f2&${GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM}=accepted`,
      "/governance/findings",
    );

    expect(href).toBe("/governance/findings");
  });

  it("clears keyboard disposition confirm params when clearing review scope", () => {
    const href = governanceFindingsClearReviewScopeHref(
      `runId=run-1&${FINDING_KEYBOARD_TRIAGE_FINDING_ID_PARAM}=finding-1&${FINDING_KEYBOARD_TRIAGE_ACTION_PARAM}=accepted`,
      "/governance/findings",
    );

    expect(href).toBe("/governance/findings");
    expect(href).not.toContain(`${FINDING_KEYBOARD_TRIAGE_FINDING_ID_PARAM}=`);
    expect(href).not.toContain(`${FINDING_KEYBOARD_TRIAGE_ACTION_PARAM}=`);
  });
});
