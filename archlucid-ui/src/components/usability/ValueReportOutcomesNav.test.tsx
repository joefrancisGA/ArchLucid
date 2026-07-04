import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { isShowSystemAdministrationNavEnabled } from "@/lib/features";

import { ValueReportOutcomesNav } from "./ValueReportOutcomesNav";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/value-report"),
}));

vi.mock("@/lib/features", () => ({
  isShowSystemAdministrationNavEnabled: vi.fn(() => true),
}));

const mockIsShowSystemAdministrationNavEnabled = vi.mocked(isShowSystemAdministrationNavEnabled);

describe("ValueReportOutcomesNav", () => {
  it("renders all outcomes tabs when system-administration nav is enabled", () => {
    mockIsShowSystemAdministrationNavEnabled.mockReturnValue(true);

    render(<ValueReportOutcomesNav />);

    expect(screen.getByTestId("value-report-outcomes-nav")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sponsor report" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Pilot outcomes" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ROI summary" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Executive scorecard" })).toBeInTheDocument();
  });

  it("hides internal ROI and pilot tabs on customer-visible outcome pages when system-administration nav is disabled", () => {
    mockIsShowSystemAdministrationNavEnabled.mockReturnValue(false);

    render(<ValueReportOutcomesNav />);

    expect(screen.getByRole("link", { name: "Sponsor report" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Executive scorecard" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Pilot outcomes" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "ROI summary" })).not.toBeInTheDocument();
  });
});
