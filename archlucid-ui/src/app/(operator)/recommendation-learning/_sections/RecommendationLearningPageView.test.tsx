import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { LearningProfile } from "@/types/recommendation-learning";

import { RecommendationLearningPageView } from "./RecommendationLearningPageView";
import type { RecommendationLearningPageViewModel } from "./recommendation-learning-page-view-model";

function sampleProfile(): LearningProfile {
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
    ],
    urgencyStats: [],
    signalTypeStats: [],
    categoryWeights: { Security: 1.4 },
    urgencyWeights: {},
    signalTypeWeights: {},
    notes: ["Analyzed 40 recommendation records."],
  };
}

function buildModel(overrides?: Partial<RecommendationLearningPageViewModel>): RecommendationLearningPageViewModel {
  return {
    profile: null,
    loading: false,
    isRebuilding: false,
    failure: null,
    loadLatest: async () => undefined,
    rebuild: async () => undefined,
    canMutate: true,
    ...overrides,
  };
}

describe("RecommendationLearningPageView", () => {
  it("shows the enterprise learning empty state before a profile exists", () => {
    render(<RecommendationLearningPageView model={buildModel()} />);

    expect(screen.getByRole("heading", { level: 2, name: "AI Recommendation Learning" })).toBeInTheDocument();
    expect(screen.getByText("Recommendation learning has not started yet.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Build first learning profile" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Refresh learning summary" })).not.toBeInTheDocument();
  });

  it("renders the learning summary dashboard when history exists", () => {
    render(<RecommendationLearningPageView model={buildModel({ profile: sampleProfile() })} />);

    expect(screen.getByRole("heading", { name: "Learning summary" })).toBeInTheDocument();
    expect(screen.getByText("Recommendations learned from")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh learning summary" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "How learning works" })).toBeInTheDocument();
  });
});
