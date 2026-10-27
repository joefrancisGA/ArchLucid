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

    expect(entries[0]).toMatchObject({
      statement: "The storage account must not be public.",
      documentPath: "architecture.md",
      lineNumber: 1,
      lineNumberStored: true,
      evidenceRef: "doc:architecture.md#L1",
      logicalPropertyName: "publicNetworkAccess",
      disposition: "consistent",
      dispositionStored: true,
      findingId: null,
    });
  });

  it("keeps incomplete snapshot rows with field-level honesty copy", () => {
    const entries = readProseAssumptionRegisterFromFindingsSnapshot({
      insightDensityCuration: {
        proseAssumptionRegisterEntries: [
          {
            statement: "Assumption without evidence ref",
            documentPath: "architecture.md",
            lineNumber: 0,
            disposition: "consistent",
          },
        ],
      },
    });

    expect(entries).toHaveLength(1);
    expect(entries[0]?.evidenceRef).toBe("Evidence ref was not stored.");
    expect(entries[0]?.lineNumber).toBe(0);
    expect(entries[0]?.lineNumberStored).toBe(true);
  });

  it("formats register labels with disposition and doc citation", () => {
    const labels = formatProseAssumptionRegisterLabels([
      {
        statement: "The storage account must not be public.",
        documentPath: "architecture.md",
        lineNumber: 1,
        lineNumberStored: true,
        evidenceRef: "doc:architecture.md#L1",
        logicalPropertyName: "publicNetworkAccess",
        disposition: "notVerifiable",
        dispositionStored: true,
        findingId: null,
      },
    ]);

    expect(labels[0]).toContain("not verifiable");
    expect(labels[0]).toContain("doc:architecture.md#L1");
  });

  it("surfaces register labels on measurement floor presentation", () => {
    const presentation = formatInsightDensityMeasurementFloorPresentation(12, {
      proseAssumptionRegisterEntries: readProseAssumptionRegisterFromFindingsSnapshot({
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
      }),
    });

    expect(presentation.proseAssumptionRegisterLabels).toHaveLength(1);
    expect(presentation.proseAssumptionRegisterLabels[0]).toContain("consistent");
  });
});
