import { describe, expect, it } from "vitest";

import {
  parseRemediationFactoryUrlStateFromSearch,
  remediationFactoryUrlStateToSearchParams,
  remediationFactoryHrefFromSearch,
  REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM,
  REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM,
  REMEDIATION_FACTORY_SELECTED_FINDING_PARAM,
  REMEDIATION_FACTORY_SELECTED_PATH_PARAM,
  REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM,
} from "@/lib/remediation-factory/remediation-factory-url-state";

describe("remediation-factory-url-state", () => {
  it("round-trips selection and snapshot pair", () => {
    const findingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const fromSnapshot = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const toSnapshot = "dddddddd-dddd-dddd-dddd-dddddddddddd";

    const params = remediationFactoryUrlStateToSearchParams({
      selectedFindingId: findingId,
      selectedPathId: pathId,
      fromSnapshotId: fromSnapshot,
      toSnapshotId: toSnapshot,
      metricsSummaryOpen: true,
    });

    expect(params.get(REMEDIATION_FACTORY_SELECTED_FINDING_PARAM)).toBe(findingId);
    expect(params.get(REMEDIATION_FACTORY_SELECTED_PATH_PARAM)).toBe(pathId);
    expect(params.get(REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM)).toBe(fromSnapshot);
    expect(params.get(REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM)).toBe(toSnapshot);

    const parsed = parseRemediationFactoryUrlStateFromSearch(params.toString());

    expect(parsed).toEqual({
      selectedFindingId: findingId,
      selectedPathId: pathId,
      fromSnapshotId: fromSnapshot,
      toSnapshotId: toSnapshot,
      metricsSummaryOpen: true,
    });
  });

  it("trims padded finding id on write", () => {
    const findingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const params = remediationFactoryUrlStateToSearchParams({
      selectedFindingId: `  ${findingId}  `,
      selectedPathId: null,
      fromSnapshotId: null,
      toSnapshotId: null,
      metricsSummaryOpen: false,
    });

    expect(params.get(REMEDIATION_FACTORY_SELECTED_FINDING_PARAM)).toBe(findingId);
  });

  it("drops whitespace-only finding id instead of writing blank param", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: "   ",
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=stale`,
    );

    expect(params.get(REMEDIATION_FACTORY_SELECTED_FINDING_PARAM)).toBeNull();
  });

  it("clears empty selection params", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=old`,
    );

    expect(params.get(REMEDIATION_FACTORY_SELECTED_FINDING_PARAM)).toBeNull();
  });
  it("treats yes and on metrics disclosure tokens as open on read", () => {
    expect(parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=yes`).metricsSummaryOpen).toBe(true);
    expect(parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=on`).metricsSummaryOpen).toBe(true);
  });

  it("drops stale metrics disclosure param when toggling closed", () => {
    const params = remediationFactoryUrlStateToSearchParams({ selectedFindingId: null, selectedPathId: null, fromSnapshotId: null, toSnapshotId: null, metricsSummaryOpen: false }, `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1&foreign=keep`);
    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
    expect(params.get("foreign")).toBe("keep");
  });

  it("treats padded TRUE metrics disclosure token as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=  TRUE  `,
      ).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats OFF metrics disclosure token as closed on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=OFF`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });

  it("treats zero metrics disclosure token as closed on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });

  it("writes metrics disclosure open when all selection params are cleared", () => {
    const params = remediationFactoryUrlStateToSearchParams({
      selectedFindingId: null,
      selectedPathId: null,
      fromSnapshotId: null,
      toSnapshotId: null,
      metricsSummaryOpen: true,
    });

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get(REMEDIATION_FACTORY_SELECTED_FINDING_PARAM)).toBeNull();
  });

  it("clears stale selection UUIDs when opening metrics from a populated base search", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
    );

    expect(params.get(REMEDIATION_FACTORY_SELECTED_FINDING_PARAM)).toBeNull();
    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
  });

  it("remediationFactoryHrefFromSearch preserves foreign query params without mutating selection", () => {
    const href = remediationFactoryHrefFromSearch(
      "/governance/remediation-factory",
      "selectedFinding=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&foreign=keep",
    );

    expect(href).toContain("selectedFinding=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    expect(href).toContain("foreign=keep");
  });

  it("remediationFactoryHrefFromSearch threads pathname when search is empty", () => {
    expect(remediationFactoryHrefFromSearch("/governance/remediation-factory", "")).toBe(
      "/governance/remediation-factory",
    );
  });
  it("treats mixed-case false metrics disclosure token as closed on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=FaLsE`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });

  it("drops tab-only finding id instead of writing blank param", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: "		",
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=stale`,
    );

    expect(params.get(REMEDIATION_FACTORY_SELECTED_FINDING_PARAM)).toBeNull();
  });

  it("preserves foreign params when clearing snapshot selection", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=cccccccc-cccc-cccc-cccc-cccccccccccc&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM)).toBeNull();
    expect(params.get(REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM)).toBeNull();
    expect(params.get("foreign")).toBe("keep");
  });
});