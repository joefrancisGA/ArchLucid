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




  it("treats negative zero metrics disclosure token as closed on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=-0`).metricsSummaryOpen,
    ).toBe(false);
  });

  it("drops padded off metrics token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=  off  &foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
    expect(params.get("foreign")).toBe("keep");
  });
  it("treats decimal one metrics disclosure token as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1.0`).metricsSummaryOpen,
    ).toBe(true);
  });


  it("replaces zero metrics token with canonical one when writing open state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get("foreign")).toBe("keep");
  });
  it("drops padded one metrics token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=  1  &foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
    expect(params.get("foreign")).toBe("keep");
  });
  it("treats plus-prefixed one metrics disclosure token as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=+1`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("canonicalizes true metrics token to 1 when writing open state from a true base", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=true&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get("foreign")).toBe("keep");
  });
  it("treats leading-zero one metrics disclosure token as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=01`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats scientific-notation one metrics disclosure token as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1e0`).metricsSummaryOpen,
    ).toBe(true);
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1.0e+0`).metricsSummaryOpen,
    ).toBe(true);
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1.0e%2B0`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats radix-prefixed one metrics disclosure token as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0b1`).metricsSummaryOpen,
    ).toBe(true);
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0o1`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats radix-prefixed non-one metrics disclosure token as closed on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0b10`).metricsSummaryOpen,
    ).toBe(false);
  });

  it("treats uppercase ON metrics disclosure token as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=ON`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats trailing-dot one metrics disclosure token as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1.`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats trailing-dot non-one metrics disclosure token as closed on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=2.`).metricsSummaryOpen,
    ).toBe(false);
  });
  it("treats scientific-notation non-one metrics disclosure token as closed on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=2e0`).metricsSummaryOpen,
    ).toBe(false);
  });

  it("drops padded true metrics token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=  true  &foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
    expect(params.get("foreign")).toBe("keep");
  });
  it("treats mixed-case YES metrics disclosure token as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=YeS`,
      ).metricsSummaryOpen,
    ).toBe(true);
  });

  it("canonicalizes padded yes metrics token to 1 when writing open state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=  yes  &foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get("foreign")).toBe("keep");
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
  it("uses the first metrics disclosure token when the query string repeats the param", () => {
    const openFirst = parseRemediationFactoryUrlStateFromSearch(
      `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0`,
    );
    const closedFirst = parseRemediationFactoryUrlStateFromSearch(
      `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
    );

    expect(openFirst.metricsSummaryOpen).toBe(true);
    expect(closedFirst.metricsSummaryOpen).toBe(false);
  });

  it("drops padded on metrics token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=  on  &foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
    expect(params.get("foreign")).toBe("keep");
  });
  it("drops yes metrics token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=yes&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
    expect(params.get("foreign")).toBe("keep");
  });
  it("uses the first selectedFinding token when the query string repeats the param", () => {
    const firstId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const secondId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const parsed = parseRemediationFactoryUrlStateFromSearch(
      `?${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${firstId}&${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${secondId}`,
    );

    expect(parsed.selectedFindingId).toBe(firstId);
  });

  it("writes metrics open as 1 when base search used a legacy yes token", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=yes`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
  });
  it("uses the first selectedPath token when the query string repeats the param", () => {
    const firstId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const secondId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const parsed = parseRemediationFactoryUrlStateFromSearch(
      `?${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${firstId}&${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${secondId}`,
    );

    expect(parsed.selectedPathId).toBe(firstId);
  });

  it("writes metrics open as 1 when base search used a legacy on token", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=on`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
  });
  it("uses the first fromSnapshot token when the query string repeats the param", () => {
    const firstId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const secondId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const parsed = parseRemediationFactoryUrlStateFromSearch(
      `?${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${firstId}&${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${secondId}`,
    );

    expect(parsed.fromSnapshotId).toBe(firstId);
  });

  it("writes metrics open as 1 when base search used a legacy true token", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=true`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
  });

  it("remediationFactoryHrefFromSearch preserves an open metrics disclosure param", () => {
    const href = remediationFactoryHrefFromSearch(
      "/governance/remediation-factory",
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1&foreign=keep`,
    );

    expect(href).toContain(`${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`);
    expect(href).toContain("foreign=keep");
  });
  it("uses the first toSnapshot token when the query string repeats the param", () => {
    const firstId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const secondId = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
    const parsed = parseRemediationFactoryUrlStateFromSearch(
      `?${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${firstId}&${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${secondId}`,
    );

    expect(parsed.toSnapshotId).toBe(firstId);
  });

  it("treats a padded numeric one metrics disclosure token as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=%201%20`,
      ).metricsSummaryOpen,
    ).toBe(true);
  });

  it("drops stale toSnapshot when clearing from snapshot from base search", () => {
    const toId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=cccccccc-cccc-cccc-cccc-cccccccccccc&${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`,
    );

    expect(params.get(REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM)).toBeNull();
    expect(params.get(REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM)).toBeNull();
  });
  it("drops zero metrics disclosure token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
    expect(params.get("foreign")).toBe("keep");
  });

  it("remediationFactoryHrefFromSearch preserves a fromSnapshot query param", () => {
    const fromId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const href = remediationFactoryHrefFromSearch(
      "/governance/remediation-factory",
      `${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}`,
    );

    expect(href).toContain(`${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}`);
  });

  it("reads first-wins selection params independently for finding and path", () => {
    const findingFirst = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const findingSecond = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const pathFirst = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const pathSecond = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const parsed = parseRemediationFactoryUrlStateFromSearch(
      `?${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingFirst}&${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingSecond}&${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathFirst}&${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathSecond}`,
    );

    expect(parsed.selectedFindingId).toBe(findingFirst);
    expect(parsed.selectedPathId).toBe(pathFirst);
  });
  it("drops false metrics disclosure token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=false&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
    expect(params.get("foreign")).toBe("keep");
  });

  it("treats a padded true metrics disclosure token as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=%20true%20`,
      ).metricsSummaryOpen,
    ).toBe(true);
  });

  it("remediationFactoryHrefFromSearch preserves a toSnapshot query param", () => {
    const toId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const href = remediationFactoryHrefFromSearch(
      "/governance/remediation-factory",
      `${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`,
    );

    expect(href).toContain(`${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`);
  });

  it("drops NO metrics disclosure token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=NO&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
    expect(params.get("foreign")).toBe("keep");
  });
});
