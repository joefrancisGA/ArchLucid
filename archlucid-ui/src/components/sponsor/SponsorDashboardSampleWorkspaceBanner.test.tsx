import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/UnloadSampleReviewButton", () => ({
  UnloadSampleReviewButton: ({ label }: { label: string }) => <button type="button">{label}</button>,
}));

import { SponsorDashboardSampleWorkspaceBanner } from "./SponsorDashboardSampleWorkspaceBanner";
import { BUYER_SPONSOR_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";

describe("SponsorDashboardSampleWorkspaceBanner", () => {
  it("shows the unload sample dashboard control", () => {
    render(<SponsorDashboardSampleWorkspaceBanner />);

    expect(screen.getByTestId("sponsor-dashboard-sample-workspace-banner")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: BUYER_SPONSOR_SUMMARY_VOCABULARY.sampleWorkspaceBannerUnloadAction }),
    ).toBeInTheDocument();
  });
});
