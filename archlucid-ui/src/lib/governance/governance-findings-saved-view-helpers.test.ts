import { describe, expect, it } from "vitest";

import { DEFAULT_FINDING_JOB_VIEW } from "@/lib/findings/finding-job-view";
import { EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS } from "@/lib/findings/findings-natural-language-filter";

import { GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM } from "@/lib/governance/governance-findings-resource-group-disclosure-url";
import {
  FINDING_KEYBOARD_TRIAGE_ACTION_PARAM,
  FINDING_KEYBOARD_TRIAGE_FINDING_ID_PARAM,
} from "./finding-keyboard-triage-confirm-url";
import {
  GOVERNANCE_RECORD_CORRECTION_KIND_PARAM,
  GOVERNANCE_RECORD_CORRECTION_RUN_ID_PARAM,
  GOVERNANCE_RECORD_CORRECTION_SUBJECT_ID_PARAM,
} from "./governance-record-correction-confirm-url";

import {
  governanceFindingsRunScopedSavedViewHref,
  governanceFindingsWorkspaceSavedViewHref,
} from "./governance-findings-saved-view-helpers";

describe("governanceFindingsWorkspaceSavedViewHref", () => {
  it("builds workspace URL from saved-view filters without review scope", () => {
    expect(
      governanceFindingsWorkspaceSavedViewHref(
        {
          registerFilter: "open",
          jobView: DEFAULT_FINDING_JOB_VIEW,
          nlFacets: EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS,
          groupByResource: false,
        },
        "/governance/findings",
      ),
    ).toBe("/governance/findings?filter=open");
  });

  it("never carries runId or architectureId even when filters imply workspace scope", () => {
    const href = governanceFindingsWorkspaceSavedViewHref(
      {
        registerFilter: "expiring-soon",
        jobView: "ready-for-sponsor-packet",
        nlFacets: { severity: "high", status: "open", titleKeywords: ["encryption"] },
        groupByResource: true,
      },
      "/governance/findings",
    );

    expect(href).not.toContain("runId=");
    expect(href).not.toContain("architectureId=");
    expect(href).toContain("filter=expiring-soon");
    expect(href).toContain("findingJobView=ready-for-sponsor-packet");
    expect(href).toContain("groupBy=resource");
    expect(href).toContain("severity=high");
    expect(href).not.toContain(GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM);
  });

  it("rebuilds href only from saved-view filters without govCorrection params", () => {
    const href = governanceFindingsWorkspaceSavedViewHref(
      {
        registerFilter: "open",
        jobView: DEFAULT_FINDING_JOB_VIEW,
        nlFacets: EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS,
        groupByResource: false,
      },
      "/governance/findings",
    );

    expect(href).toBe("/governance/findings?filter=open");
    expect(href).not.toContain(`${GOVERNANCE_RECORD_CORRECTION_KIND_PARAM}=`);
    expect(href).not.toContain(`${GOVERNANCE_RECORD_CORRECTION_SUBJECT_ID_PARAM}=`);
    expect(href).not.toContain(`${GOVERNANCE_RECORD_CORRECTION_RUN_ID_PARAM}=`);
  });
});

describe("governanceFindingsRunScopedSavedViewHref", () => {
  it("builds run-scoped URL from saved-view filters without stale architecture scope", () => {
    const href = governanceFindingsRunScopedSavedViewHref(
      {
        registerFilter: "open",
        jobView: DEFAULT_FINDING_JOB_VIEW,
        nlFacets: EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS,
        groupByResource: false,
      },
      "/governance/findings",
      "run-2",
    );

    expect(href).toBe("/governance/findings?filter=open&runId=run-2");
    expect(href).not.toContain("architectureId=");
  });

  it("rebuilds href only from saved-view filters without keyboard confirm params", () => {
    const href = governanceFindingsRunScopedSavedViewHref(
      {
        registerFilter: "open",
        jobView: DEFAULT_FINDING_JOB_VIEW,
        nlFacets: EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS,
        groupByResource: false,
      },
      "/governance/findings",
      "run-2",
    );

    expect(href).toBe("/governance/findings?filter=open&runId=run-2");
    expect(href).not.toContain(`${FINDING_KEYBOARD_TRIAGE_FINDING_ID_PARAM}=`);
    expect(href).not.toContain(`${FINDING_KEYBOARD_TRIAGE_ACTION_PARAM}=`);
  });
});
