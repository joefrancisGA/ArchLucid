import { afterEach, describe, expect, it } from "vitest";

import {
  clearGovernanceFindingsQueueFacets,
  DEFAULT_GOVERNANCE_FINDINGS_QUEUE_FACETS,
  GOVERNANCE_FINDINGS_QUEUE_FACETS_STORAGE_KEY,
  patchGovernanceFindingsQueueFacets,
  readGovernanceFindingsQueueFacets,
  writeGovernanceFindingsQueueFacets,
} from "@/lib/governance/governance-findings-queue-facets-storage";

describe("governance-findings-queue-facets-storage", () => {
  afterEach(() => {
    window.localStorage.removeItem(GOVERNANCE_FINDINGS_QUEUE_FACETS_STORAGE_KEY);
  });

  it("returns defaults when unset", () => {
    expect(readGovernanceFindingsQueueFacets()).toEqual(DEFAULT_GOVERNANCE_FINDINGS_QUEUE_FACETS);
  });

  it("round-trips registerFilter, jobView, and nlFacets", () => {
    writeGovernanceFindingsQueueFacets({
      registerFilter: "high-severity",
      jobView: "needs-governance",
      nlFacets: {
        severity: "high",
        status: "open",
        titleKeywords: ["encryption"],
      },
    });

    expect(readGovernanceFindingsQueueFacets()).toEqual({
      registerFilter: "high-severity",
      jobView: "needs-governance",
      nlFacets: {
        severity: "high",
        status: "open",
        titleKeywords: ["encryption"],
      },
    });
  });

  it("falls back to defaults for invalid JSON payload", () => {
    window.localStorage.setItem(GOVERNANCE_FINDINGS_QUEUE_FACETS_STORAGE_KEY, "{not-json");

    expect(readGovernanceFindingsQueueFacets()).toEqual(DEFAULT_GOVERNANCE_FINDINGS_QUEUE_FACETS);
  });

  it("falls back to defaults when registerFilter is not allowlisted", () => {
    window.localStorage.setItem(
      GOVERNANCE_FINDINGS_QUEUE_FACETS_STORAGE_KEY,
      JSON.stringify({ registerFilter: "not-a-real-filter", jobView: "deferred" }),
    );

    expect(readGovernanceFindingsQueueFacets()).toEqual(DEFAULT_GOVERNANCE_FINDINGS_QUEUE_FACETS);
  });

  it("falls back to defaults when jobView is invalid", () => {
    window.localStorage.setItem(
      GOVERNANCE_FINDINGS_QUEUE_FACETS_STORAGE_KEY,
      JSON.stringify({ registerFilter: "open", jobView: "not-a-job-view" }),
    );

    expect(readGovernanceFindingsQueueFacets()).toEqual(DEFAULT_GOVERNANCE_FINDINGS_QUEUE_FACETS);
  });

  it("defaults missing optional fields when registerFilter alone is stored", () => {
    writeGovernanceFindingsQueueFacets({ registerFilter: "needs-decision" });

    expect(readGovernanceFindingsQueueFacets()).toEqual({
      ...DEFAULT_GOVERNANCE_FINDINGS_QUEUE_FACETS,
      registerFilter: "needs-decision",
    });
  });

  it("patch merges without dropping sibling fields", () => {
    writeGovernanceFindingsQueueFacets({
      registerFilter: "open",
      jobView: "deferred",
      nlFacets: { severity: "critical", status: null, titleKeywords: [] },
    });

    patchGovernanceFindingsQueueFacets({ registerFilter: "stale" });

    expect(readGovernanceFindingsQueueFacets()).toEqual({
      registerFilter: "stale",
      jobView: "deferred",
      nlFacets: { severity: "critical", status: null, titleKeywords: [] },
    });
  });

  it("clear removes the storage key", () => {
    writeGovernanceFindingsQueueFacets({ registerFilter: "open", jobView: "deferred" });
    clearGovernanceFindingsQueueFacets();

    expect(window.localStorage.getItem(GOVERNANCE_FINDINGS_QUEUE_FACETS_STORAGE_KEY)).toBeNull();
    expect(readGovernanceFindingsQueueFacets()).toEqual(DEFAULT_GOVERNANCE_FINDINGS_QUEUE_FACETS);
  });
});
