import { describe, expect, it } from "vitest";

import type { LearningProfile } from "@/types/recommendation-learning";

import {
  buildTopLearnedSignals,
  countRecordsAnalyzed,
  listTunedCategories,
  profileHasInsufficientHistory,
} from "./recommendation-learning-display";

function sampleProfile(overrides?: Partial<LearningProfile>): LearningProfile {
  return {
    tenantId: "tenant",
    workspaceId: "workspace",
    projectId: "project",
    generatedUtc: "2026-06-23T12:00:00.000Z",
    categoryStats: [
      {
        key: "Security",
        proposedCount: 40,
        acceptedCount: 33,
        rejectedCount: 2,
        deferredCount: 3,
        implementedCount: 2,
        acceptanceRate: 0.825,
        rejectionRate: 0.05,
        deferredRate: 0.075,
        implementationRate: 0.05,
      },
      {
        key: "Cost",
        proposedCount: 20,
        acceptedCount: 4,
        rejectedCount: 2,
        deferredCount: 12,
        implementedCount: 2,
        acceptanceRate: 0.2,
        rejectionRate: 0.1,
        deferredRate: 0.6,
        implementationRate: 0.1,
      },
    ],
    urgencyStats: [],
    signalTypeStats: [
      {
        key: "SecurityGap",
        proposedCount: 40,
        acceptedCount: 30,
        rejectedCount: 4,
        deferredCount: 4,
        implementedCount: 2,
        acceptanceRate: 0.75,
        rejectionRate: 0.1,
        deferredRate: 0.1,
        implementationRate: 0.05,
      },
    ],
    categoryWeights: { Security: 1.4, Cost: 0.9 },
    urgencyWeights: { High: 1.2 },
    signalTypeWeights: { SecurityGap: 1.3 },
    notes: ["Analyzed 60 recommendation records."],
    ...overrides,
  };
}

describe("recommendation-learning-display", () => {
  it("counts analyzed records from category stats", () => {
    expect(countRecordsAnalyzed(sampleProfile())).toBe(60);
  });

  it("detects insufficient history when no records were analyzed", () => {
    const profile = sampleProfile({
      categoryStats: [],
      notes: ["Analyzed 0 recommendation records."],
      categoryWeights: {},
    });

    expect(profileHasInsufficientHistory(profile)).toBe(true);
  });

  it("lists tuned categories alphabetically", () => {
    expect(listTunedCategories(sampleProfile())).toEqual(["Cost", "Security"]);
  });

  it("builds top learned signals from outcome rates", () => {
    const signals = buildTopLearnedSignals(sampleProfile());

    expect(signals[0]?.label).toContain("Security recommendations accepted 83%");
    expect(signals.some((signal) => signal.label.includes("Cost recommendations deferred most often"))).toBe(true);
  });
});
