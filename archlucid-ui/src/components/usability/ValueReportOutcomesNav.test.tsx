import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { isShowSystemAdministrationNavEnabled } from "@/lib/features";

import { ValueReportOutcomesNav } from "./ValueReportOutcomesNav";

const pushMock = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    usePathname: vi.fn(() => "/value-report"),
    useRouter: () => ({ push: pushMock }),
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
    expect(screen.getByRole("tablist", { name: "Insights outcomes" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Sponsor report" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Pilot outcomes" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "ROI summary" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Review scorecard" })).toBeInTheDocument();
  });

  it("shows pilot outcomes and ROI tabs for all visitors (TB-643 nav placement)", () => {
    mockIsShowSystemAdministrationNavEnabled.mockReturnValue(false);

    render(<ValueReportOutcomesNav />);

    expect(screen.getByRole("tab", { name: "Sponsor report" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Review scorecard" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Pilot outcomes" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "ROI summary" })).toBeInTheDocument();
  });
});
