import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import { SPONSOR_REPORT_PAGE_TITLE } from "@/lib/sponsor-report-navigation";

import { ValueReportOutcomesNav } from "./ValueReportOutcomesNav";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    usePathname: vi.fn(() => "/insights/sponsor-report"),
    redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("@/lib/features", () => ({
  isShowSystemAdministrationNavEnabled: vi.fn(() => true),
}));

const mockIsShowSystemAdministrationNavEnabled = vi.mocked(isShowSystemAdministrationNavEnabled);

describe("ValueReportOutcomesNav", () => {
  it("renders cross-route nav links with aria-current, not tab roles (TB-1664)", () => {
    mockIsShowSystemAdministrationNavEnabled.mockReturnValue(true);

    render(<ValueReportOutcomesNav />);

    expect(screen.getByTestId("value-report-outcomes-nav")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Sponsor report sections" })).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: SPONSOR_REPORT_PAGE_TITLE })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.queryByRole("link", { name: "Pilot outcomes" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ROI summary" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Architecture scorecard" })).toBeInTheDocument();
  });

  it("shows sponsor report, scorecard, and ROI links for all visitors (TB-643 nav placement)", () => {
    mockIsShowSystemAdministrationNavEnabled.mockReturnValue(false);

    render(<ValueReportOutcomesNav />);

    expect(screen.getByRole("link", { name: SPONSOR_REPORT_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Architecture scorecard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ROI summary" })).toBeInTheDocument();
  });
});
