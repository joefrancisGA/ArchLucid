import { describe, expect, it } from "vitest";

import { DEFAULT_FINDING_JOB_VIEW } from "@/lib/findings/finding-job-view";
import { EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS } from "@/lib/findings/findings-natural-language-filter";

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
});
