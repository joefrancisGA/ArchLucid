import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/sponsor-dashboard",
}));
import { expectWhereToGoNextFollowUpLinks } from "@/lib/claim-discipline-test-helpers";

import { SponsorDashboardHelpEvidenceOrientationStrip } from "@/components/help/SponsorDashboardHelpEvidenceOrientationStrip";
import {
  SPONSOR_DASHBOARD_HELP_FOLLOW_UPS_TITLE,
  SPONSOR_DASHBOARD_HELP_SOURCES,
} from "@/lib/sponsor-dashboard-help-evidence-copy";

describe("SponsorDashboardHelpEvidenceOrientationStrip", () => {
  it("renders sources-only follow-ups because claim discipline lives on the header info strip", () => {
    render(<SponsorDashboardHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("help-sponsor-dashboard-orientation")).toBeInTheDocument();
    expect(screen.queryByTestId("help-sponsor-dashboard-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: SPONSOR_DASHBOARD_HELP_FOLLOW_UPS_TITLE })).toHaveAttribute(
      "id",
      "where-to-go-next",
    );

    expectWhereToGoNextFollowUpLinks(screen, SPONSOR_DASHBOARD_HELP_SOURCES, "/help/sponsor-dashboard");
  });
});
