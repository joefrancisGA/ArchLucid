import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import { EXECUTIVE_SUMMARY_PAGE_TITLE } from "@/lib/sponsor-report-navigation";

import { ValueReportOutcomesNav } from "./ValueReportOutcomesNav";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    usePathname: vi.fn(() => "/insights/executive-summary"),
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
  it("renders tablist semantics with all outcomes tabs when system-administration nav is enabled", () => {
    mockIsShowSystemAdministrationNavEnabled.mockReturnValue(true);

    render(<ValueReportOutcomesNav />);

    expect(screen.getByTestId("value-report-outcomes-nav")).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "Sponsor report sections" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: EXECUTIVE_SUMMARY_PAGE_TITLE })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Pilot outcomes" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "ROI summary" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Architecture scorecard" })).toBeInTheDocument();
  });

  it("shows pilot outcomes and ROI tabs for all visitors (TB-643 nav placement)", () => {
    mockIsShowSystemAdministrationNavEnabled.mockReturnValue(false);

    render(<ValueReportOutcomesNav />);

    expect(screen.getByRole("tab", { name: EXECUTIVE_SUMMARY_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Architecture scorecard" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Pilot outcomes" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "ROI summary" })).toBeInTheDocument();
  });
});
