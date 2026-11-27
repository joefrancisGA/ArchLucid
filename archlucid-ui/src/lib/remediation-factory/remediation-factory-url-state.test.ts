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
  it("canonicalizes metrics open to 1 when writing open state from a false base", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=false`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
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

  it("treats NFKC fullwidth ON metrics disclosure token as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\uFF4F\uFF4E`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("drops radix-one metrics token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0b1&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
    expect(params.get("foreign")).toBe("keep");
  });
  it("treats NFKC fullwidth one metrics disclosure token as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\uFF11`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats enclosed-digit one metrics disclosure tokens as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u2474`).metricsSummaryOpen,
    ).toBe(true);
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u24F5`).metricsSummaryOpen,
    ).toBe(true);
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u2776`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats roman numeral one metrics disclosure tokens as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u2160`).metricsSummaryOpen,
    ).toBe(true);
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u2170`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats roman numeral two metrics disclosure token as closed on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u2161`).metricsSummaryOpen,
    ).toBe(false);
  });

  it("treats NFKC fullwidth TRUE metrics disclosure token as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\uFF54\uFF52\uFF55\uFF45`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("canonicalizes scientific-one open token to 1 when writing open state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1e0&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get("foreign")).toBe("keep");
  });

  it("treats enclosed-digit two metrics disclosure token as closed on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u24F6`).metricsSummaryOpen,
    ).toBe(false);
  });
  it("treats tortoise-shell bracket one metrics disclosure token as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u30141\u3015`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats CJK and hangzhou one metrics disclosure tokens as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u3021`).metricsSummaryOpen,
    ).toBe(true);
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u4E00`).metricsSummaryOpen,
    ).toBe(true);
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u3192`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("rejects CJK two metrics disclosure token on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u4E8C`).metricsSummaryOpen,
    ).toBe(false);
  });

  it("drops CJK one metrics token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u4E00&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
    expect(params.get("foreign")).toBe("keep");
  });

  it("treats fullwidth NO metrics disclosure token as closed on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\uFF2E\uFF4F`).metricsSummaryOpen,
    ).toBe(false);
  });

  it("canonicalizes hangzhou-one open token to 1 when writing open state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u3021&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get("foreign")).toBe("keep");
  });

  it("treats unicode decimal one metrics disclosure tokens as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u0661`).metricsSummaryOpen,
    ).toBe(true);
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u09E7`).metricsSummaryOpen,
    ).toBe(true);
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u0E51`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("rejects unicode decimal two metrics disclosure token on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u0662`).metricsSummaryOpen,
    ).toBe(false);
  });

  it("treats additional unicode decimal one metrics disclosure tokens as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u0BE7`).metricsSummaryOpen,
    ).toBe(true);
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u1041`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("drops unicode decimal-one metrics token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u0661&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
    expect(params.get("foreign")).toBe("keep");
  });

  it("treats fullwidth FALSE metrics disclosure token as closed on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\uFF26\uFF41\uFF4C\uFF53\uFF45`).metricsSummaryOpen,
    ).toBe(false);
  });

  it("canonicalizes CJK-one open token to 1 when writing open state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u4E00&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get("foreign")).toBe("keep");
  });  it("treats fullwidth OFF metrics disclosure token as closed on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\uFF2F\uFF26\uFF26`).metricsSummaryOpen,
    ).toBe(false);
  });

  it("rejects khmer decimal two metrics disclosure token on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u17E2`).metricsSummaryOpen,
    ).toBe(false);
  });

  it("drops Tamil decimal-one metrics token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u0BE7&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
    expect(params.get("foreign")).toBe("keep");
  });

  it("treats fullwidth zero metrics disclosure token as closed on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\uFF10`).metricsSummaryOpen,
    ).toBe(false);
  });

  it("canonicalizes unicode-decimal-one open token to 1 when writing open state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u0661&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get("foreign")).toBe("keep");
  });

  it("treats south-asian decimal one metrics disclosure tokens as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u0AE7`).metricsSummaryOpen,
    ).toBe(true);
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u0D67`).metricsSummaryOpen,
    ).toBe(true);
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u0CE7`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("rejects Gujarati decimal two metrics disclosure token on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u0AE8`).metricsSummaryOpen,
    ).toBe(false);
  });

  it("drops Malayalam decimal-one metrics token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u0D67&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
    expect(params.get("foreign")).toBe("keep");
  });

  it("treats lone fullwidth F metrics disclosure token as closed on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\uFF26`).metricsSummaryOpen,
    ).toBe(false);
  });

  it("canonicalizes Gujarati decimal-one open token to 1 when writing open state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u0AE7&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get("foreign")).toBe("keep");
  });

  it("treats extended unicode decimal one metrics disclosure tokens as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u0A67`).metricsSummaryOpen,
    ).toBe(true);
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u1811`).metricsSummaryOpen,
    ).toBe(true);
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\uABF1`).metricsSummaryOpen,
    ).toBe(true);
  });  it("canonicalizes roman-one open token to 1 when writing open state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u2160&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get("foreign")).toBe("keep");
  });

  it("rejects Gurmukhi decimal two metrics disclosure token on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u0A68`).metricsSummaryOpen,
    ).toBe(false);
  });

  it("drops Gurmukhi decimal-one metrics token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u0A67&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
    expect(params.get("foreign")).toBe("keep");
  });

  it("treats lone fullwidth T metrics disclosure token as closed on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\uFF34`).metricsSummaryOpen,
    ).toBe(false);
  });

  it("canonicalizes Mongolian decimal-one open token to 1 when writing open state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u1811&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get("foreign")).toBe("keep");
  });

  it("treats minority-script unicode decimal one metrics disclosure tokens as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u{11067}`).metricsSummaryOpen,
    ).toBe(true);
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u{11651}`).metricsSummaryOpen,
    ).toBe(true);
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u{11C51}`).metricsSummaryOpen,
    ).toBe(true);
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u{16B51}`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("rejects Kayah Li decimal two metrics disclosure token on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u{11068}`).metricsSummaryOpen,
    ).toBe(false);
  });

  it("drops Kayah Li decimal-one metrics token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u{11067}&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
    expect(params.get("foreign")).toBe("keep");
  });

  it("treats lone fullwidth O metrics disclosure token as closed on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\uFF2F`).metricsSummaryOpen,
    ).toBe(false);
  });

  it("canonicalizes Pau Cin Hau decimal-one open token to 1 when writing open state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u{16B51}&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get("foreign")).toBe("keep");
  });

  it("treats additional decimal-run digit one metrics disclosure tokens as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u{A9F1}`).metricsSummaryOpen,
    ).toBe(true);
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u{1A81}`).metricsSummaryOpen,
    ).toBe(true);
  });  it("treats curly-brace one metrics disclosure token as closed on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=%7B1%7D`).metricsSummaryOpen,
    ).toBe(false);
  });

  it("rejects Myanmar Shan decimal two metrics disclosure token on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u{11652}`).metricsSummaryOpen,
    ).toBe(false);
  });

  it("rejects Pau Cin Hau decimal two metrics disclosure token on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u{16B52}`).metricsSummaryOpen,
    ).toBe(false);
  });

  it("drops Myanmar Shan decimal-one metrics token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u{11651}&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
    expect(params.get("foreign")).toBe("keep");
  });

  it("canonicalizes Bhaiksuki decimal-one open token to 1 when writing open state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u{11C51}&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get("foreign")).toBe("keep");
  });

  it("drops Bhaiksuki decimal-one metrics token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u{11C51}&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
    expect(params.get("foreign")).toBe("keep");
  });

  it("treats lone fullwidth Y metrics disclosure token as closed on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\uFF39`).metricsSummaryOpen,
    ).toBe(false);
  });

  it("canonicalizes Kayah Li decimal-one open token to 1 when writing open state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u{11067}&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get("foreign")).toBe("keep");
  });  it("treats NFKC fullwidth YES metrics disclosure token as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\uFF59\uFF45\uFF53`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("drops enclosed-digit one metrics token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u24F5&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
    expect(params.get("foreign")).toBe("keep");
  });

  it("canonicalizes comma-decimal open token to 1 when writing open state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1,0&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get("foreign")).toBe("keep");
  });

  it("drops comma-decimal metrics token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1,0&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
    expect(params.get("foreign")).toBe("keep");
  });
  it("treats locale comma-decimal one metrics disclosure token as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1,0`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats comma-separated thousands-style token as closed on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1,000`).metricsSummaryOpen,
    ).toBe(false);
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

  it("treats true metrics disclosure token with line separator inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tru\u2028e`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with paragraph separator inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\u2029n`).metricsSummaryOpen,
    ).toBe(true);
  });



  it("treats ON metrics disclosure token with ogham space inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\u1680n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with ideographic space inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=t\u3000rue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with braille blank inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\u2800n`).metricsSummaryOpen,
    ).toBe(true);
  });


  it("treats ON metrics disclosure token with braille dot pattern inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\u2801n`).metricsSummaryOpen,
    ).toBe(true);
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\u2802n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with thin space inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\u2009n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats yes metrics disclosure token with narrow no-break space inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=y\u202Fes`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with hair space inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=t\u200Arue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with zero-width joiner inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\u200Dn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with fullwidth exclamation inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF01n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with dotted circle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25CCue`).metricsSummaryOpen,
    ).toBe(true);
  });


  it("treats ON metrics disclosure token with fullwidth question inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF1Fn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white circle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25CBue`).metricsSummaryOpen,
    ).toBe(true);
  });


  it("treats ON metrics disclosure token with fullwidth tilde inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF5En`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with large circle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25EFue`).metricsSummaryOpen,
    ).toBe(true);
  });


  it("treats ON metrics disclosure token with fullwidth full stop inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF0En`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with fisheye inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25C9ue`).metricsSummaryOpen,
    ).toBe(true);
  });


  it("treats ON metrics disclosure token with fullwidth comma inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF0Cn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with medium black circle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25CFue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("drops padded false metrics disclosure token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}= false `,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
  });

  it("uses the first metrics disclosure token when yes precedes no in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=yes&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=no`,
      ).metricsSummaryOpen,
    ).toBe(true);
  });


  it("treats ON metrics disclosure token with fullwidth solidus inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF0Fn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with shadowed white circle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25CDue`).metricsSummaryOpen,
    ).toBe(true);
  });


  it("treats ON metrics disclosure token with fullwidth colon inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF1An`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with bullseye inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25CEue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("drops padded yes metrics disclosure token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}= yes `,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
  });


  it("treats ON metrics disclosure token with fullwidth semicolon inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF1Bn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with circle upper-right quadrant inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25D1ue`).metricsSummaryOpen,
    ).toBe(true);
  });


  it("treats ON metrics disclosure token with fullwidth asterisk inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF0An`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with circle lower-right quadrant inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25D2ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("drops padded no metrics disclosure token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}= no `,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
  });

  it("uses the first metrics disclosure token when FALSE precedes TRUE in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=FALSE&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=TRUE`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });


  it("treats ON metrics disclosure token with fullwidth plus inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF0Bn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with circle left-half black inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25D0ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with fullwidth ampersand inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF06n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with circle right-half black inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25D3ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with fullwidth left parenthesis inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF08n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with circle upper half black inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25D4ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with fullwidth right parenthesis inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF09n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with circle lower half black inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25D5ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with fullwidth hyphen inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF0Dn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with circle lower left quadrant inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25D6ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with fullwidth apostrophe inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF07n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with circle lower right quadrant inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25D7ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with fullwidth quotation mark inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF02n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with circle upper right quadrant inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25D8ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with fullwidth number sign inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF03n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with circle upper left quadrant inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25D9ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with fullwidth dollar sign inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF04n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with circle lower right quadrant arc inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25DAue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with fullwidth percent sign inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF05n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with circle upper right quadrant arc inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25DBue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("uses the first metrics disclosure token when yes precedes one in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=yes&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
      ).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with fullwidth digit zero inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF10n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with upper right quadrant circular arc inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25DCue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with fullwidth digit one inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF11n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with lower left quadrant circular arc inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25DDue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with fullwidth digit two inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF12n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with lower right quadrant circular arc inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25DEue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("canonicalizes metrics open to 1 when writing open state from a padded TRUE base", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}= TRUE `,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
  });


  it("treats ON metrics disclosure token with fullwidth digit three inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF13n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with upper left quadrant circular arc inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25DFue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with fullwidth digit four inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF14n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with upper half circular arc inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25E0ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("canonicalizes metrics open to 1 when writing open state from a padded ON base", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}= ON `,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
  });

  it("uses the first metrics disclosure token when one precedes off in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=off`,
      ).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with fullwidth digit five inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF15n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with lower half circular arc inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25E1ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("uses the first metrics disclosure token when yes precedes off in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=yes&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=off`,
      ).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with fullwidth digit six inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF16n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with circle with two dots inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25E2ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("uses the first metrics disclosure token when no precedes off in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=no&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=off`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });

  it("treats ON metrics disclosure token with fullwidth digit seven inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF17n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with circle with two dots above inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25E3ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("uses the first metrics disclosure token when false precedes off in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=false&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=off`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });

  it("treats ON metrics disclosure token with fullwidth digit eight inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF18n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black lower right triangle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25E4ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with fullwidth digit nine inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF19n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black lower left triangle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25E5ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with fullwidth low line inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF3Fn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white large square inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25EEue`).metricsSummaryOpen,
    ).toBe(true);
  });




  it("treats ON metrics disclosure token with halfwidth katakana letter ku inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF78n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white curved lower-right triangle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25BBue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter ke inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF79n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black curved lower-right quadrant inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25BAue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter ko inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF7An`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black right-pointing small triangle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25B9ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter sa inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF7Bn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white right-pointing small triangle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25B8ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter shi inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF7Cn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black right-pointing triangle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25B6ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter su inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF7Dn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white right-pointing triangle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25B5ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter se inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF7En`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black left-pointing pointer triangle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25B4ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter so inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF7Fn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black up-pointing triangle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25B2ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter ta inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF80n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white up-pointing triangle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25B3ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter ti inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF81n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black left-pointing triangle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25B1ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter tu inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF82n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white left-pointing triangle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25B0ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter te inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF83n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black vertical rectangle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25AEue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter to inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF84n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white vertical rectangle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25AFue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter na inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF85n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white small square inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25A9ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter ni inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF86n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black small square inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25A7ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter nu inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF87n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black medium square inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25A6ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter ne inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF88n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white medium square inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25A5ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter no inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF89n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with square with horizontal fill inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25A4ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter ha inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF8An`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white square containing black small square inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25A3ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter hi inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF8Bn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white square with rounded corners inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25A2ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter fu inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF8Cn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white square inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25A1ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter he inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF8Dn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black square inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25A0ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter ho inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF8En`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with light shade inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2591ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter ma inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF8Fn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with medium shade inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2592ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter mi inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF90n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with dark shade inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2593ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter mu inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF91n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with upper half block inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2594ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter me inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF92n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with lower half block inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2595ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter mo inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF93n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with left half block inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2596ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter yo inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF94n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with right half block inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2597ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter ra inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF95n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with upper left quadrant inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2598ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter ri inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF96n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with upper right quadrant inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2599ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter ru inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF97n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with lower left quadrant inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u259Aue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter re inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF98n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with lower right quadrant inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u259Bue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter ro inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF99n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with full block inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2588ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter wa inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF9An`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with lower one eighth block inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2581ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter n inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF9Bn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with lower one quarter block inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2582ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter vu inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF9Cn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with lower three eighths block inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2583ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter small a inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF9Dn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with lower five eighths block inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2584ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana voiced sound mark inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF9En`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with upper one eighth block inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2585ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana semi-voiced sound mark inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF9Fn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with upper three eighths block inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2586ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth ideographic full stop inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF61n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with lower seven eighths block inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2587ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth left corner bracket inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF63n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with box drawings light upper right inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2580ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth right corner bracket inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF64n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with box drawings down light and right heavy inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u258Fue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth ideographic comma inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF65n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with box drawings up light and right heavy inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u258Eue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth ideographic centre dot inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF66n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with box drawings light vertical inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u258Cue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth ideographic circle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF67n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with box drawings heavy vertical inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u258Due`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth ideographic square inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF68n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with box drawings light diagonal upper right to lower left inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u258Bue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth black circle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF69n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with box drawings light diagonal upper left to lower right inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u258Aue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth ideographic star inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF6An`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with box drawings light diagonal cross inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2589ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth circled ideographic star inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF6Bn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with light left half block inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u259Cue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth rightward arrow inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF6Cn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with light up and heavy down inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u259Due`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth rightwards two dot leader inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF6Dn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with light up and right inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u259Eue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth rightwards double arrow inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF6En`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with heavy up and heavy down inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u259Fue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth wave dash inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF6Fn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with square with vertical fill inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25A8ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth prolonged sound mark inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF70n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with box drawings light down and right inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2590ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter small a inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF71n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with box drawings light horizontal inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2500ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter i inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF72n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with box drawings light vertical rule inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2502ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter u inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF73n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with box drawings heavy horizontal inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2503ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter e inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF74n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with box drawings heavy vertical rule inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2501ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter o inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF75n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with box drawings light down inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2504ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter ka inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF76n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with box drawings heavy down rule inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2505ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter ku inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF78n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with box drawings light up and right inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2506ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter ke inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF79n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with box drawings heavy up and right inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2507ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter ko inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF7An`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with box drawings light up and heavy right inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2508ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter sa inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF7Bn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with box drawings heavy up and heavy right inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2509ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter shi inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF7Cn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with box drawings light up and heavy down inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u250Aue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter se inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF7Dn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with box drawings heavy up and heavy down inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u250Bue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter so inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF7En`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with box drawings light up and light down inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u250Cue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter ta inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF7Fn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with box drawings heavy up and light down inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u250Due`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter ti inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF80n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with box drawings light down and right inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u250Eue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter tu inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF81n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with box drawings heavy down and right inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u250Fue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter te inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF82n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with box drawings light vertical and right inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2510ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with halfwidth katakana letter ki inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF77n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black curved upper-right quadrant inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25BCue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter ka inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF76n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white curved lower-right quadrant inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25BDue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter o inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF75n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white curved lower-left quadrant inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25BEue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter e inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF74n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white curved upper-right quadrant inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25C0ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter u inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF73n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white curved upper-left quadrant inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25C1ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter i inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF72n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black curved lower-left triangle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25C2ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter a inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF71n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white lower-right triangle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25C5ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana prolonged sound mark inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF70n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black lower-right triangle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25C4ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter small yo inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF6Fn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black lower-left triangle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25C3ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter small yu inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF6En`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth katakana letter small ya inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF6Dn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with lozenge inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25CAue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth ideographic ring inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF6Cn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white diamond containing black small diamond inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25C8ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth ideographic open bracket inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF6Bn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white diamond inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25C7ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth ideographic close bracket inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF6An`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black diamond inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25C6ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth ideographic semicolon inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF69n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white rectangle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25ADue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth ideographic exclamation mark inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF68n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black rectangle scalar inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25ACue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth ideographic question mark inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF67n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white small square inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25ABue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth ideographic colon inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF66n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black small square inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25AAue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth ideographic full stop inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF65n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with medium white circle with black dot inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25FFue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with halfwidth ideographic comma inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF64n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white medium small square inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25FBue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with fullwidth right corner bracket inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF63n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white medium square inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25FDue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with fullwidth left corner bracket inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF62n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black medium square inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25FCue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with fullwidth macron inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF5Fn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black medium vertical rectangle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25FEue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with fullwidth vertical line inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF5Cn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white square containing black very small square inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25F3ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with fullwidth right curly bracket inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF5Dn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white square containing black large square inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25F2ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with fullwidth left curly bracket inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF5Bn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white square containing black medium square inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25F1ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with fullwidth grave accent inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF40n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white square containing black small square inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25F0ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("uses the first metrics disclosure token when false precedes one in the query string for duplicate params", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=false&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });
  it("treats ON metrics disclosure token with fullwidth circumflex accent inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF3En`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white vertical rectangle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25EDue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("uses the first metrics disclosure token when OFF precedes zero in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=OFF&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });
  it("treats ON metrics disclosure token with fullwidth reverse solidus inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF3Cn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black rectangle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25ECue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("clears stale fromSnapshot when clearing path selection with open metrics", () => {
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const fromId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1&${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}&${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get(REMEDIATION_FACTORY_SELECTED_PATH_PARAM)).toBeNull();
    expect(params.get(REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM)).toBeNull();
  });
  it("clears stale toSnapshot when clearing path selection with open metrics", () => {
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const toId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1&${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}&${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get(REMEDIATION_FACTORY_SELECTED_PATH_PARAM)).toBeNull();
    expect(params.get(REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM)).toBeNull();
  });
  it("treats ON metrics disclosure token with fullwidth right square bracket inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF3Dn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black vertical rectangle inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25EBue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with fullwidth left square bracket inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF3Bn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with white small square inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25EAue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("uses the first metrics disclosure token when false precedes on in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=false&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=on`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });
  it("treats ON metrics disclosure token with fullwidth commercial at inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF20n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black small square inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25E9ue`).metricsSummaryOpen,
    ).toBe(true);
  });


  it("uses the first metrics disclosure token when TRUE precedes 0 in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=TRUE&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0`,
      ).metricsSummaryOpen,
    ).toBe(true);
  });  it("uses the first metrics disclosure token when TRUE precedes off in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=TRUE&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=off`,
      ).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with ideographic full stop inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF1En`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black medium small square inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25E8ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("uses the first metrics disclosure token when yes precedes on in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=yes&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=on`,
      ).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with fullwidth greater-than sign inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF1Dn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black medium square inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25E7ue`).metricsSummaryOpen,
    ).toBe(true);
  });
  it("treats ON metrics disclosure token with fullwidth less-than sign inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFF1Cn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with black large square inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u25E6ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("canonicalizes metrics open to 1 when writing open state from a padded FALSE base", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}= FALSE `,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
  });

  it("uses the first metrics disclosure token when OFF precedes on in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=OFF&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=on`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });



  it("uses the first metrics disclosure token when YES precedes 0 in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=YES&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0`,
      ).metricsSummaryOpen,
    ).toBe(true);
  });  it("uses the first metrics disclosure token when OFF precedes 1 in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=OFF&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });
  it("uses the first metrics disclosure token when OFF precedes 0 in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=OFF&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });  it("uses the first metrics disclosure token when FALSE precedes 1 in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=FALSE&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });
  it("uses the first metrics disclosure token when FALSE precedes 0 in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=FALSE&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });  it("uses the first metrics disclosure token when FALSE precedes off in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=FALSE&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=off`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });
  it("uses the first metrics disclosure token when YES precedes off in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=YES&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=off`,
      ).metricsSummaryOpen,
    ).toBe(true);
  });

  it("drops padded ON metrics disclosure token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}= ON `,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
  });

  it("uses the first metrics disclosure token when zero precedes off in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=off`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });










  it("uses the first metrics disclosure token when false precedes 1 in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=false&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });
  it("uses the first metrics disclosure token when false precedes 0 in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=false&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });  it("uses the first metrics disclosure token when NO precedes 0 in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=NO&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });
  it("uses the first metrics disclosure token when NO precedes 1 in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=NO&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });  it("uses the first metrics disclosure token when ON precedes 0 in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=ON&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0`,
      ).metricsSummaryOpen,
    ).toBe(true);
  });
  it("uses the first metrics disclosure token when ON precedes 1 in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=ON&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
      ).metricsSummaryOpen,
    ).toBe(true);
  });
  it("uses the first metrics disclosure token when on precedes 0 in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=on&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0`,
      ).metricsSummaryOpen,
    ).toBe(true);
  });  it("uses the first metrics disclosure token when off precedes 1 in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=off&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });
  it("uses the first metrics disclosure token when off precedes 0 in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=off&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });  it("uses the first metrics disclosure token when no precedes 1 in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=no&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });
  it("uses the first metrics disclosure token when no precedes 0 in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=no&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });  it("uses the first metrics disclosure token when 1 precedes 0 in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0`,
      ).metricsSummaryOpen,
    ).toBe(true);
  });  it("uses the first metrics disclosure token when 0 precedes 1 in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });  it("uses the first metrics disclosure token when NO precedes on in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=NO&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=on`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });  it("uses the first metrics disclosure token when no precedes ON in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=no&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=ON`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });  it("uses the first metrics disclosure token when no precedes on in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=no&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=on`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });

  it("uses the first metrics disclosure token when ON precedes off in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=ON&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=off`,
      ).metricsSummaryOpen,
    ).toBe(true);
  });

  it("uses the first metrics disclosure token when OFF precedes one in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=OFF&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });

  it("uses the first metrics disclosure token when ON precedes zero in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=ON&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0`,
      ).metricsSummaryOpen,
    ).toBe(true);
  });

  it("preserves snapshot ids when clearing finding selection with open metrics", () => {
    const findingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const fromId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const toId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: fromId,
        toSnapshotId: toId,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1&${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}&${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}&${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get(REMEDIATION_FACTORY_SELECTED_FINDING_PARAM)).toBeNull();
    expect(params.get(REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM)).toBe(fromId);
    expect(params.get(REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM)).toBe(toId);
  });

  it("uses the first metrics disclosure token when no precedes one in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=no&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });

  it("clears stale path id when clearing finding selection with open metrics", () => {
    const findingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1&${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}&${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get(REMEDIATION_FACTORY_SELECTED_FINDING_PARAM)).toBeNull();
    expect(params.get(REMEDIATION_FACTORY_SELECTED_PATH_PARAM)).toBeNull();
  });


  it("uses the first metrics disclosure token when yes precedes 0 in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=yes&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0`,
      ).metricsSummaryOpen,
    ).toBe(true);
  });  it("uses the first metrics disclosure token when yes precedes zero in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=yes&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0`,
      ).metricsSummaryOpen,
    ).toBe(true);
  });

  it("drops padded FALSE metrics disclosure token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}= FALSE `,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
  });

  it("uses the first metrics disclosure token when off precedes one in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=off&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });

  it("drops padded TRUE metrics disclosure token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}= TRUE `,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
  });

  it("uses the first metrics disclosure token when zero precedes one in the query string for duplicate params", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });

  it("preserves path id when clearing finding selection with open metrics", () => {
    const findingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: pathId,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1&${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}&${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get(REMEDIATION_FACTORY_SELECTED_FINDING_PARAM)).toBeNull();
    expect(params.get(REMEDIATION_FACTORY_SELECTED_PATH_PARAM)).toBe(pathId);
  });

  it("drops padded YES metrics disclosure token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}= YES `,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
  });

  it("uses the first metrics disclosure token when one precedes zero in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0`,
      ).metricsSummaryOpen,
    ).toBe(true);
  });

  it("preserves finding id when clearing path selection with open metrics", () => {
    const findingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: findingId,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1&${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}&${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get(REMEDIATION_FACTORY_SELECTED_FINDING_PARAM)).toBe(findingId);
    expect(params.get(REMEDIATION_FACTORY_SELECTED_PATH_PARAM)).toBeNull();
  });

  it("drops padded NO metrics disclosure token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}= NO `,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
  });

  it("uses the first metrics disclosure token when zero precedes on in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=on`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });

  it("uses the first metrics disclosure token when on precedes zero in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=on&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0`,
      ).metricsSummaryOpen,
    ).toBe(true);
  });

  it("preserves snapshot ids when clearing path selection with open metrics", () => {
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const fromId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const toId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: fromId,
        toSnapshotId: toId,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1&${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}&${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}&${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get(REMEDIATION_FACTORY_SELECTED_PATH_PARAM)).toBeNull();
    expect(params.get(REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM)).toBe(fromId);
    expect(params.get(REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM)).toBe(toId);
  });

  it("clears stale snapshot ids when clearing finding selection with open metrics", () => {
    const findingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const fromId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const toId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1&${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}&${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}&${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get(REMEDIATION_FACTORY_SELECTED_FINDING_PARAM)).toBeNull();
    expect(params.get(REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM)).toBeNull();
    expect(params.get(REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM)).toBeNull();
  });
  it("preserves open metrics when clearing finding selection only", () => {
    const findingId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1&${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get(REMEDIATION_FACTORY_SELECTED_FINDING_PARAM)).toBeNull();
  });

  it("preserves foreign params when clearing finding selection only", () => {
    const findingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: pathId,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      [
        `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
        `${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}`,
        `${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`,
        "foreign=keep",
      ].join("&"),
    );

    expect(params.get("foreign")).toBe("keep");
    expect(params.get(REMEDIATION_FACTORY_SELECTED_PATH_PARAM)).toBe(pathId);
    expect(params.get(REMEDIATION_FACTORY_SELECTED_FINDING_PARAM)).toBeNull();
    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
  });  it("canonicalizes metrics open to 1 when writing open state from a padded off base", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}= off `,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
  });

  it("uses the first metrics disclosure token when TRUE precedes FALSE in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=TRUE&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=FALSE`,
      ).metricsSummaryOpen,
    ).toBe(true);
  });

  it("clears stale finding id when clearing path selection with open metrics", () => {
    const findingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1&${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}&${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get(REMEDIATION_FACTORY_SELECTED_FINDING_PARAM)).toBeNull();
    expect(params.get(REMEDIATION_FACTORY_SELECTED_PATH_PARAM)).toBeNull();
  });



  it("preserves open metrics when clearing finding and path only", () => {
    const findingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const fromId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: fromId,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      [
        `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
        `${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}`,
        `${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`,
        `${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}`,
      ].join("&"),
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get(REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM)).toBe(fromId);
    expect(params.get(REMEDIATION_FACTORY_SELECTED_FINDING_PARAM)).toBeNull();
    expect(params.get(REMEDIATION_FACTORY_SELECTED_PATH_PARAM)).toBeNull();
  });  it("preserves open metrics when clearing from and to snapshots only", () => {
    const findingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const fromId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const toId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: findingId,
        selectedPathId: pathId,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      [
        `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
        `${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}`,
        `${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`,
        `${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}`,
        `${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`,
      ].join("&"),
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get(REMEDIATION_FACTORY_SELECTED_FINDING_PARAM)).toBe(findingId);
    expect(params.get(REMEDIATION_FACTORY_SELECTED_PATH_PARAM)).toBe(pathId);
    expect(params.get(REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM)).toBeNull();
    expect(params.get(REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM)).toBeNull();

  });

  it("preserves foreign params when clearing from and to snapshots only", () => {
    const findingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const fromId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const toId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: findingId,
        selectedPathId: pathId,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      [
        `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
        `${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}`,
        `${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`,
        `${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}`,
        `${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`,
        "foreign=keep",
      ].join("&"),
    );

    expect(params.get("foreign")).toBe("keep");
    expect(params.get(REMEDIATION_FACTORY_SELECTED_FINDING_PARAM)).toBe(findingId);
    expect(params.get(REMEDIATION_FACTORY_SELECTED_PATH_PARAM)).toBe(pathId);
    expect(params.get(REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM)).toBeNull();
    expect(params.get(REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM)).toBeNull();
    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
  });  it("preserves open metrics when clearing snapshot selection only", () => {
    const fromId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const toId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}&${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get(REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM)).toBeNull();
    expect(params.get(REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM)).toBeNull();
  });  it("preserves open metrics when clearing path selection only", () => {
    const pathId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1&${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get(REMEDIATION_FACTORY_SELECTED_PATH_PARAM)).toBeNull();
  });
  it("preserves foreign params when clearing path selection only", () => {
    const findingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: findingId,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      [
        `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
        `${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}`,
        `${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`,
        "foreign=keep",
      ].join("&"),
    );

    expect(params.get("foreign")).toBe("keep");
    expect(params.get(REMEDIATION_FACTORY_SELECTED_FINDING_PARAM)).toBe(findingId);
    expect(params.get(REMEDIATION_FACTORY_SELECTED_PATH_PARAM)).toBeNull();
    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
  });

  it("uses the first metrics disclosure token when true precedes false in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=true&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=false`,
      ).metricsSummaryOpen,
    ).toBe(true);
  });  it("uses the first metrics disclosure token when false precedes true in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=false&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=true`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });

  it("remediationFactoryHrefFromSearch preserves metrics, selectedFinding, and selectedPath on pathname-only href", () => {
    const findingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const href = remediationFactoryHrefFromSearch(
      "/governance/remediation-factory",
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1&${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}&${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`,
    );

    expect(href).toBe(
      `/governance/remediation-factory?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1&${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}&${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`,
    );
  });
  it("canonicalizes metrics open to 1 when writing open state from a padded true base", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}= true `,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
  });

  it("uses the first metrics disclosure token when no precedes yes in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=no&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=yes`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });

  it("remediationFactoryHrefFromSearch preserves metrics and selectedPath on pathname-only href", () => {
    const pathId = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
    const href = remediationFactoryHrefFromSearch(
      "/governance/remediation-factory",
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1&${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`,
    );

    expect(href).toBe(
      `/governance/remediation-factory?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1&${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`,
    );
  });
  it("remediationFactoryHrefFromSearch preserves metrics and selectedFinding on pathname-only href", () => {
    const findingId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const href = remediationFactoryHrefFromSearch(
      "/governance/remediation-factory",
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1&${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}`,
    );

    expect(href).toBe(
      `/governance/remediation-factory?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1&${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}`,
    );
  });

  it("canonicalizes metrics open to 1 when writing open state from a padded YES base", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}= YES `,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
  });  it("canonicalizes metrics open to 1 when writing open state from a padded on base", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}= on `,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
  });

  it("preserves open metrics when writing a finding-only selection change", () => {
    const priorFinding = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const nextFinding = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: nextFinding,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1&${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${priorFinding}`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get(REMEDIATION_FACTORY_SELECTED_FINDING_PARAM)).toBe(nextFinding);
  });
  it("remediationFactoryHrefFromSearch preserves selectedPath on pathname-only href", () => {
    const pathId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const href = remediationFactoryHrefFromSearch(
      "/governance/remediation-factory",
      `${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`,
    );

    expect(href).toBe(`/governance/remediation-factory?${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`);
  });
  it("preserves open metrics when writing a path-only selection change", () => {
    const priorPath = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const nextPath = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: nextPath,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1&${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${priorPath}`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get(REMEDIATION_FACTORY_SELECTED_PATH_PARAM)).toBe(nextPath);
  });

  it("drops padded zero metrics disclosure token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}= 0 `,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
  });

  it("uses the first metrics disclosure token when zero precedes one in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=0&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });

  it("clears stale snapshot ids when writing closed metrics state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=cccccccc-cccc-cccc-cccc-cccccccccccc&${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=dddddddd-dddd-dddd-dddd-dddddddddddd&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
    );

    expect(params.get(REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM)).toBeNull();
    expect(params.get(REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM)).toBeNull();
    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
  });
  it("treats ON metrics disclosure token with halfwidth Hangul letter inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\uFFA1n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with vertical two-dot leader inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u3035ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("canonicalizes metrics open to 1 when writing open state from a padded false base", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}= false `,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
  });

  it("uses the first metrics disclosure token when no precedes YES in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=no&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=YES`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });

  it("clears stale path selection when writing closed metrics state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
    );

    expect(params.get(REMEDIATION_FACTORY_SELECTED_PATH_PARAM)).toBeNull();
    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
  });
  it("treats yes metrics disclosure token with middle dot inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=y\u00B7es`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with katakana middle dot inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\u30FBn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats yes metrics disclosure token with Devanagari vowel sign inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=y\u093Fes`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with medium mathematical space inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\u205Fn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("drops padded true metrics disclosure token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}= true `,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
  });

  it("uses the first metrics disclosure token when YES precedes no in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=YES&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=no`,
      ).metricsSummaryOpen,
    ).toBe(true);
  });

  it("clears stale finding selection when writing closed metrics state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
    );

    expect(params.get(REMEDIATION_FACTORY_SELECTED_FINDING_PARAM)).toBeNull();
    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
  });
  it("treats ON metrics disclosure token with Oriya vowel sign inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\u0B0An`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with three-per-em space inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u2004ue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("canonicalizes metrics open to 1 when writing open state from a padded no base", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}= no `,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
  });

  it("uses the first metrics disclosure token when off precedes on in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=off&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=on`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });
  it("treats true metrics disclosure token with ideographic half-fill space inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tr\u303Fue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with soft hyphen inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\u00ADn`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats yes metrics disclosure token with word joiner inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=y\u2060es`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with en quad space inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\u2000n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("drops padded OFF metrics disclosure token from base search when writing closed state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}= OFF `,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBeNull();
  });


  it("uses the first metrics disclosure token when OFF precedes false in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=OFF&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=false`,
      ).metricsSummaryOpen,
    ).toBe(false);
  });  it("uses the first metrics disclosure token when on precedes off in the query string", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(
        `?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=on&${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=off`,
      ).metricsSummaryOpen,
    ).toBe(true);
  });
  it("canonicalizes metrics open to 1 when writing open state from a padded OFF base", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}= OFF `,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
  });
  it("canonicalizes metrics open to 1 when writing open state from a padded NO base", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}= NO `,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
  });
  it("canonicalizes metrics open to 1 when writing open state from a NO base", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=NO`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
  });
  it("treats yes metrics disclosure token with Hangul filler inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=y\u3164es`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats ON metrics disclosure token with NBSP inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\u00a0n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats BOM-only metrics disclosure token as closed on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\uFEFF`).metricsSummaryOpen,
    ).toBe(false);
  });

  it("canonicalizes metrics open to 1 when writing open state from an off base", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=off`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
  });
  it("treats yes metrics disclosure token with horizontal tab inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=y\u0009es`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats NUL-only metrics disclosure token as closed on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u0000`).metricsSummaryOpen,
    ).toBe(false);
  });
  it("treats true metrics disclosure token with vertical tab inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tru\u000Be`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats figure-space-only metrics disclosure token as closed on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u2007`).metricsSummaryOpen,
    ).toBe(false);
  });
  it("treats ON metrics disclosure token with figure space inside as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=o\u2007n`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats true metrics disclosure token with combining mark inside the word as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=tru\u0301e`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("drops literal zero metrics token from base search when writing closed state", () => {
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

  it("treats empty metrics disclosure param as closed on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=`).metricsSummaryOpen,
    ).toBe(false);
  });
  it("treats metrics disclosure token with combining acute after one as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1\u0301`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats disclosure true token with interstitial zero-width space as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=t\u200Brue`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("treats zero-width-space-only metrics disclosure token as closed on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=\u200B`).metricsSummaryOpen,
    ).toBe(false);
  });

  it("uses first toSnapshot param when duplicate values appear in search", () => {
    const first = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const second = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const state = parseRemediationFactoryUrlStateFromSearch(
      `?${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${first}&${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${second}`,
    );

    expect(state.toSnapshotId).toBe(first);
  });

  it("remediationFactoryHrefFromSearch preserves metrics and selectedFinding on pathname-only href when clearing path", () => {
    const findingId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const href = remediationFactoryHrefFromSearch(
      "/governance/remediation-factory",
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1&${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}&${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}`,
    );

    expect(href).toContain(`${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`);
    expect(href).toContain(`${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}`);
  });
  it("remediationFactoryHrefFromSearch preserves selectedFinding on pathname-only href when clearing path", () => {
    const findingId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const href = remediationFactoryHrefFromSearch(
      "/governance/remediation-factory",
      `${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}&${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}`,
    );

    expect(href).toContain(`${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}`);
  });
  it("remediationFactoryHrefFromSearch preserves selectedFinding on pathname-only href", () => {
    const findingId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const href = remediationFactoryHrefFromSearch(
      "/governance/remediation-factory",
      `${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}`,
    );

    expect(href).toBe(`/governance/remediation-factory?${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}`);
  });
  it("treats metrics disclosure token with zero-width space after one as open on read", () => {
    expect(
      parseRemediationFactoryUrlStateFromSearch(`?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1\u200B`).metricsSummaryOpen,
    ).toBe(true);
  });

  it("canonicalizes metrics open token with zero-width space after one to 1 when writing open state", () => {
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1\u200B&foreign=keep`,
    );

    expect(params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM)).toBe("1");
    expect(params.get("foreign")).toBe("keep");
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


  it("preserves foreign params when clearing all remediation selection params", () => {
    const findingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const fromId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const toId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: false,
      },
      [
        `${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}`,
        `${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`,
        `${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}`,
        `${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`,
        "foreign=keep",
      ].join("&"),
    );

    expect(params.get(REMEDIATION_FACTORY_SELECTED_FINDING_PARAM)).toBeNull();
    expect(params.get(REMEDIATION_FACTORY_SELECTED_PATH_PARAM)).toBeNull();
    expect(params.get(REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM)).toBeNull();
    expect(params.get(REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM)).toBeNull();
    expect(params.get("foreign")).toBe("keep");
  });  it("preserves foreign params when clearing snapshot selection", () => {
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








  it("remediationFactoryHrefFromSearch preserves metrics when clearing snapshots on pathname-only href", () => {
    const fromId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const toId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const baseSearch = [
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
      `${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}`,
      `${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`,
    ].join("&");
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      baseSearch,
    );
    const href = remediationFactoryHrefFromSearch("/governance/remediation-factory", params.toString());

    expect(href).toBe(`/governance/remediation-factory?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`);
  });  it("remediationFactoryHrefFromSearch preserves foreign params when clearing snapshots on pathname-only href", () => {
    const fromId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const toId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const baseSearch = [
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
      `${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}`,
      `${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`,
      "foreign=keep",
    ].join("&");
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      baseSearch,
    );
    const href = remediationFactoryHrefFromSearch("/governance/remediation-factory", params.toString());

    expect(href).toContain("foreign=keep");
    expect(href).toContain(`${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`);
    expect(href).not.toContain(`${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=`);
    expect(href).not.toContain(`${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=`);
  });  it("remediationFactoryHrefFromSearch preserves snapshots when clearing metrics on pathname-only href", () => {
    const fromId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const toId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const baseSearch = [
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
      `${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}`,
      `${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`,
    ].join("&");
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: fromId,
        toSnapshotId: toId,
        metricsSummaryOpen: false,
      },
      baseSearch,
    );
    const href = remediationFactoryHrefFromSearch("/governance/remediation-factory", params.toString());

    expect(href).toContain(`${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}`);
    expect(href).toContain(`${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`);
    expect(href).not.toContain(`${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=`);
  });  it("remediationFactoryHrefFromSearch preserves foreign params when clearing metrics on pathname-only href", () => {
    const fromId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const toId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const baseSearch = [
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
      `${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}`,
      `${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`,
      "foreign=keep",
    ].join("&");
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: fromId,
        toSnapshotId: toId,
        metricsSummaryOpen: false,
      },
      baseSearch,
    );
    const href = remediationFactoryHrefFromSearch("/governance/remediation-factory", params.toString());

    expect(href).toContain("foreign=keep");
    expect(href).toContain(`${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}`);
    expect(href).toContain(`${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`);
    expect(href).not.toContain(`${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=`);
  });  it("remediationFactoryHrefFromSearch preserves snapshots when clearing finding and path on pathname-only href", () => {
    const findingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const fromId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const toId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const baseSearch = [
      `${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}`,
      `${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`,
      `${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}`,
      `${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`,
    ].join("&");
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: fromId,
        toSnapshotId: toId,
        metricsSummaryOpen: false,
      },
      baseSearch,
    );
    const href = remediationFactoryHrefFromSearch("/governance/remediation-factory", params.toString());

    expect(href).toContain(`${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}`);
    expect(href).toContain(`${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`);
    expect(href).not.toContain(`${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=`);
    expect(href).not.toContain(`${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=`);
  });  it("remediationFactoryHrefFromSearch preserves foreign params when clearing path and finding on pathname-only href", () => {
    const findingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const baseSearch = [
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
      `${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}`,
      `${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`,
      "foreign=keep",
    ].join("&");
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      baseSearch,
    );
    const href = remediationFactoryHrefFromSearch("/governance/remediation-factory", params.toString());

    expect(href).toContain("foreign=keep");
    expect(href).toContain(`${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`);
    expect(href).not.toContain(`${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=`);
    expect(href).not.toContain(`${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=`);
  });  it("remediationFactoryHrefFromSearch preserves open metrics when clearing path and finding on pathname-only href", () => {
    const findingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const baseSearch = [
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
      `${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}`,
      `${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`,
    ].join("&");
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      baseSearch,
    );
    const href = remediationFactoryHrefFromSearch("/governance/remediation-factory", params.toString());

    expect(href).toBe(`/governance/remediation-factory?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`);
  });  it("remediationFactoryHrefFromSearch preserves snapshots when clearing path selection on pathname-only href", () => {
    const findingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const fromId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const toId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const baseSearch = [
      `${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}`,
      `${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`,
      `${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}`,
      `${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`,
    ].join("&");
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: findingId,
        selectedPathId: null,
        fromSnapshotId: fromId,
        toSnapshotId: toId,
        metricsSummaryOpen: false,
      },
      baseSearch,
    );
    const href = remediationFactoryHrefFromSearch("/governance/remediation-factory", params.toString());

    expect(href).toContain(`${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}`);
    expect(href).toContain(`${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`);
    expect(href).toContain(`${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}`);
    expect(href).not.toContain(`${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=`);
  });  it("remediationFactoryHrefFromSearch preserves foreign params when clearing path selection on pathname-only href", () => {
    const findingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const baseSearch = [
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
      `${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}`,
      `${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`,
      "foreign=keep",
    ].join("&");
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: findingId,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      baseSearch,
    );
    const href = remediationFactoryHrefFromSearch("/governance/remediation-factory", params.toString());

    expect(href).toContain("foreign=keep");
    expect(href).toContain(`${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}`);
    expect(href).not.toContain(`${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=`);
  });  it("remediationFactoryHrefFromSearch preserves snapshots when clearing finding selection on pathname-only href", () => {
    const findingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const fromId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const toId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const baseSearch = [
      `${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}`,
      `${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`,
      `${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}`,
      `${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`,
    ].join("&");
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: pathId,
        fromSnapshotId: fromId,
        toSnapshotId: toId,
        metricsSummaryOpen: false,
      },
      baseSearch,
    );
    const href = remediationFactoryHrefFromSearch("/governance/remediation-factory", params.toString());

    expect(href).toContain(`${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}`);
    expect(href).toContain(`${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`);
    expect(href).toContain(`${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`);
    expect(href).not.toContain(`${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=`);
  });  it("remediationFactoryHrefFromSearch preserves foreign params when clearing finding selection on pathname-only href", () => {
    const findingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const baseSearch = [
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
      `${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}`,
      `${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`,
      "foreign=keep",
    ].join("&");
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: pathId,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      baseSearch,
    );
    const href = remediationFactoryHrefFromSearch("/governance/remediation-factory", params.toString());

    expect(href).toContain("foreign=keep");
    expect(href).toContain(`${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`);
    expect(href).not.toContain(`${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=`);
  });  it("remediationFactoryHrefFromSearch preserves foreign params when clearing all selection on pathname-only href", () => {
    const findingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const fromId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const toId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const baseSearch = [
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
      `${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}`,
      `${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`,
      `${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}`,
      `${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`,
      "foreign=keep",
    ].join("&");
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      baseSearch,
    );
    const href = remediationFactoryHrefFromSearch("/governance/remediation-factory", params.toString());

    expect(href).toContain("foreign=keep");
    expect(href).toContain(`${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`);
    expect(href).not.toContain(`${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=`);
    expect(href).not.toContain(`${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=`);
    expect(href).not.toContain(`${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=`);
    expect(href).not.toContain(`${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=`);
  });  it("remediationFactoryHrefFromSearch preserves open metrics when clearing all selection params on pathname-only href", () => {
    const findingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const fromId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const toId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const baseSearch = [
      `${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`,
      `${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}`,
      `${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}`,
      `${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}`,
      `${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`,
    ].join("&");
    const params = remediationFactoryUrlStateToSearchParams(
      {
        selectedFindingId: null,
        selectedPathId: null,
        fromSnapshotId: null,
        toSnapshotId: null,
        metricsSummaryOpen: true,
      },
      baseSearch,
    );
    const href = remediationFactoryHrefFromSearch("/governance/remediation-factory", params.toString());

    expect(href).toBe(`/governance/remediation-factory?${REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM}=1`);
  });  it("remediationFactoryHrefFromSearch preserves an open metrics disclosure param", () => {
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

  it("remediationFactoryHrefFromSearch preserves fromSnapshot and toSnapshot on pathname-only href when clearing finding", () => {
    const fromId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const toId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const findingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const href = remediationFactoryHrefFromSearch(
      "/governance/remediation-factory",
      `${REMEDIATION_FACTORY_SELECTED_FINDING_PARAM}=${findingId}&${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}&${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`,
    );

    expect(href).toContain(`${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}`);
    expect(href).toContain(`${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`);
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


  it("remediationFactoryHrefFromSearch preserves a fromSnapshot query param on pathname-only href when clearing path", () => {
    const fromId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const href = remediationFactoryHrefFromSearch(
      "/governance/remediation-factory",
      `${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}&${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}`,
    );

    expect(href).toContain(`${REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM}=${fromId}`);
  });  it("remediationFactoryHrefFromSearch preserves a toSnapshot query param on pathname-only href when clearing path", () => {
    const toId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const pathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const href = remediationFactoryHrefFromSearch(
      "/governance/remediation-factory",
      `${REMEDIATION_FACTORY_SELECTED_PATH_PARAM}=${pathId}&${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`,
    );

    expect(href).toContain(`${REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM}=${toId}`);
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
