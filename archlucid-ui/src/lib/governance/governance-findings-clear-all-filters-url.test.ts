import { describe, expect, it } from "vitest";

import { GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM } from "./governance-findings-bulk-disposition-confirm-url";
import { GOVERNANCE_FINDINGS_BULK_PARAM } from "./governance-findings-bulk-selection-url";
import {
  FINDING_KEYBOARD_TRIAGE_ACTION_PARAM,
  FINDING_KEYBOARD_TRIAGE_FINDING_ID_PARAM,
} from "./finding-keyboard-triage-confirm-url";
import {
  GOVERNANCE_RECORD_CORRECTION_KIND_PARAM,
  GOVERNANCE_RECORD_CORRECTION_RUN_ID_PARAM,
  GOVERNANCE_RECORD_CORRECTION_SUBJECT_ID_PARAM,
} from "./governance-record-correction-confirm-url";
import { GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM } from "./governance-findings-resource-group-disclosure-url";
import { governanceFindingsClearAllFiltersHref, governanceFindingsShowAllFilteredFindingsHref } from "./governance-findings-clear-all-filters-url";

describe("governanceFindingsClearAllFiltersHref", () => {
  it("clears register, facet, and search params but preserves review and architecture scope", () => {
    const href = governanceFindingsClearAllFiltersHref(
      "runId=run-1&architectureId=arch-1&filter=open&q=phi&findingJobView=ready-for-sponsor-packet&severity=high&groupBy=resource",
      "/governance/findings",
    );

    expect(href).toBe("/governance/findings?runId=run-1&architectureId=arch-1");
  });

  it("does not restore stale filter params when clearing search only", () => {
    const href = governanceFindingsClearAllFiltersHref(
      "runId=run-1&filter=expiring-soon&q=test",
      "/governance/findings",
    );

    expect(href).toBe("/governance/findings?runId=run-1");
    expect(href).not.toContain("filter=");
    expect(href).not.toContain("q=");
  });

  it("clears stale resource-group disclosure keys when clearing filters", () => {
    const href = governanceFindingsClearAllFiltersHref(
      `runId=run-1&filter=open&groupBy=resource&${GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM}=resource%3Aabc`,
      "/governance/findings",
    );

    expect(href).toBe("/governance/findings?runId=run-1");
    expect(href).not.toContain(GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM);
  });

  it("clears stale bulk selection and confirm params while preserving review scope", () => {
    const href = governanceFindingsClearAllFiltersHref(
      `runId=run-1&filter=open&${GOVERNANCE_FINDINGS_BULK_PARAM}=f1,f2&${GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM}=accepted`,
      "/governance/findings",
    );

    expect(href).toBe("/governance/findings?runId=run-1");
    expect(href).not.toContain(`${GOVERNANCE_FINDINGS_BULK_PARAM}=`);
    expect(href).not.toContain(`${GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM}=`);
  });

  it("clears keyboard disposition confirm params when clearing filters", () => {
    const href = governanceFindingsClearAllFiltersHref(
      `filter=open&${FINDING_KEYBOARD_TRIAGE_FINDING_ID_PARAM}=finding-1&${FINDING_KEYBOARD_TRIAGE_ACTION_PARAM}=accepted`,
      "/governance/findings",
    );

    expect(href).toBe("/governance/findings");
    expect(href).not.toContain(`${FINDING_KEYBOARD_TRIAGE_FINDING_ID_PARAM}=`);
    expect(href).not.toContain(`${FINDING_KEYBOARD_TRIAGE_ACTION_PARAM}=`);
  });

  it("clears record-correction confirm params when clearing filters", () => {
    const href = governanceFindingsClearAllFiltersHref(
      `filter=open&${GOVERNANCE_RECORD_CORRECTION_KIND_PARAM}=governance_quick_approve&${GOVERNANCE_RECORD_CORRECTION_SUBJECT_ID_PARAM}=sub-1&${GOVERNANCE_RECORD_CORRECTION_RUN_ID_PARAM}=run-1`,
      "/governance/findings",
    );

    expect(href).toBe("/governance/findings");
    expect(href).not.toContain(`${GOVERNANCE_RECORD_CORRECTION_KIND_PARAM}=`);
    expect(href).not.toContain(`${GOVERNANCE_RECORD_CORRECTION_SUBJECT_ID_PARAM}=`);
    expect(href).not.toContain(`${GOVERNANCE_RECORD_CORRECTION_RUN_ID_PARAM}=`);
  });

  it("clears armed preset-remove confirm when clearing filters", () => {
    const href = governanceFindingsClearAllFiltersHref(
      "runId=run-1&filter=open&removePresetId=preset-1",
      "/governance/findings",
    );

    expect(href).toBe("/governance/findings?runId=run-1");
    expect(href).not.toContain("removePresetId=");
  });
  it("clears hideGeneric when showing all filtered findings", () => {
    const href = governanceFindingsShowAllFilteredFindingsHref(
      "hideGeneric=1&filter=open&q=phi",
      "/governance/findings",
    );

    expect(href).toBe("/governance/findings");
    expect(href).not.toContain("hideGeneric=");
    expect(href).not.toContain("filter=");
    expect(href).not.toContain("q=");
  });
});
