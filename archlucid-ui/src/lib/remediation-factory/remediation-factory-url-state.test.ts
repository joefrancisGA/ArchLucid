import { describe, expect, it } from "vitest";

import {
  parseRemediationFactoryUrlStateFromSearch,
  remediationFactoryUrlStateToSearchParams,
  REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM,
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
});
