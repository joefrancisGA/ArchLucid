import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ValueReportOutcomesNav } from "./ValueReportOutcomesNav";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/value-report/roi"),
}));

describe("ValueReportOutcomesNav", () => {
  it("renders outcomes tabs on value-report routes", () => {
    render(<ValueReportOutcomesNav />);

    expect(screen.getByTestId("value-report-outcomes-nav")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ROI summary" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Pilot outcomes" })).toBeInTheDocument();
  });
});
