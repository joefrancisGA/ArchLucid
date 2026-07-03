import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/settings/cost-reporting/_sections/load-cost-reporting-settings-page-data", () => ({
  loadCostReportingSettingsPageData: vi.fn(async () => ({ demo: false })),
}));

vi.mock("@/app/(operator)/settings/cost-reporting/_sections/CostReportingSettingsPageClient", () => ({
  CostReportingSettingsPageClient: () => <div data-testid="cost-reporting-settings-page-client" />,
}));

import AiUsageAndCostPage from "./page";

describe("AiUsageAndCostPage", () => {
  it("renders the cost reporting settings surface", async () => {
    const page = await AiUsageAndCostPage();
    render(page);

    expect(screen.getByTestId("cost-reporting-settings-page-client")).toBeInTheDocument();
  });
});
