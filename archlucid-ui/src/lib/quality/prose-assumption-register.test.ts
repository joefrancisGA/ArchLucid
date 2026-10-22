import { describe, expect, it } from "vitest";

import {
  formatProseAssumptionRegisterLabels,
  readProseAssumptionRegisterFromFindingsSnapshot,
} from "@/lib/findings/read-prose-assumption-register-from-findings-snapshot";
import { formatInsightDensityMeasurementFloorPresentation } from "@/lib/quality/insight-density-measurement-floor";

describe("prose assumption register (DX-61)", () => {
  it("reads register entries from findings snapshot curation", () => {
    const entries = readProseAssumptionRegisterFromFindingsSnapshot({
      insightDensityCuration: {
        proseAssumptionRegisterEntries: [
          {
            statement: "The storage account must not be public.",
            documentPath: "architecture.md",
            lineNumber: 1,
            evidenceRef: "doc:architecture.md#L1",
            logicalPropertyName: "publicNetworkAccess",
            disposition: "consistent",
            findingId: null,
          },
        ],
      },
    });

    expect(entries).toEqual([
      {
        statement: "The storage account must not be public.",
        documentPath: "architecture.md",
        lineNumber: 1,
        evidenceRef: "doc:architecture.md#L1",
        logicalPropertyName: "publicNetworkAccess",
        disposition: "consistent",
        findingId: null,
      },
    ]);
  });

  it("formats register labels with disposition and doc citation", () => {
    const labels = formatProseAssumptionRegisterLabels([
      {
        statement: "The storage account must not be public.",
        documentPath: "architecture.md",
        lineNumber: 1,
        evidenceRef: "doc:architecture.md#L1",
        logicalPropertyName: "publicNetworkAccess",
        disposition: "notVerifiable",
        findingId: null,
      },
    ]);

    expect(labels[0]).toContain("not verifiable");
    expect(labels[0]).toContain("doc:architecture.md#L1");
  });

  it("surfaces register labels on measurement floor presentation", () => {
    const presentation = formatInsightDensityMeasurementFloorPresentation(12, {
      proseAssumptionRegisterEntries: [
        {
          statement: "The storage account must not be public.",
          documentPath: "architecture.md",
          lineNumber: 1,
          evidenceRef: "doc:architecture.md#L1",
          logicalPropertyName: "publicNetworkAccess",
          disposition: "consistent",
          findingId: null,
        },
      ],
    });

    expect(presentation.proseAssumptionRegisterLabels).toHaveLength(1);
    expect(presentation.proseAssumptionRegisterLabels[0]).toContain("consistent");
  });
});
