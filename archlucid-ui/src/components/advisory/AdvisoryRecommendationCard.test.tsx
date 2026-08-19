import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdvisoryRecommendationCard } from "@/components/advisory/AdvisoryRecommendationCard";
import {
  ADVISORY_SCANS_DISPOSITION_ACCEPT,
  ADVISORY_SCANS_DISPOSITION_DEFER,
  ADVISORY_SCANS_DISPOSITION_IMPLEMENTED,
  ADVISORY_SCANS_DISPOSITION_REJECT,
} from "@/lib/advisory-copy";
import type { RecommendationRecord } from "@/types/advisory";

function sampleRecommendation(): RecommendationRecord {
  return {
    recommendationId: "rec-1",
    tenantId: "t1",
    workspaceId: "w1",
    projectId: "p1",
    runId: "run-1",
    title: "Tighten auth boundary",
    category: "Security",
    rationale: "Evidence from findings",
    suggestedAction: "Require MFA on admin paths",
    urgency: "High",
    expectedImpact: "High",
    priorityScore: 90,
    status: "Open",
    createdUtc: "2026-07-01T00:00:00Z",
    lastUpdatedUtc: "2026-07-01T00:00:00Z",
  };
}

describe("AdvisoryRecommendationCard (TB-1127)", () => {
  it("renders disposition actions as solid buttons with Accept primary", () => {
    const onAction = vi.fn();

    render(<AdvisoryRecommendationCard recommendation={sampleRecommendation()} onAction={onAction} />);

    expect(screen.getByTestId("advisory-disposition-actions")).toBeInTheDocument();

    const accept = screen.getByRole("button", { name: ADVISORY_SCANS_DISPOSITION_ACCEPT });
    const defer = screen.getByRole("button", { name: ADVISORY_SCANS_DISPOSITION_DEFER });
    const reject = screen.getByRole("button", { name: ADVISORY_SCANS_DISPOSITION_REJECT });
    const implemented = screen.getByRole("button", { name: ADVISORY_SCANS_DISPOSITION_IMPLEMENTED });

    expect(accept.className).toContain("al-primary-action-bg");
    expect(defer.className).toContain("bg-neutral-200");
    expect(reject.className).toContain("bg-neutral-200");
    expect(implemented.className).toContain("bg-neutral-200");

    for (const button of [accept, defer, reject, implemented]) {
      expect(button.className).not.toContain("hover:underline");
      expect(button).not.toBeDisabled();
    }

    fireEvent.click(accept);
    expect(onAction).toHaveBeenCalledWith("rec-1", "Accept");
  });
});
