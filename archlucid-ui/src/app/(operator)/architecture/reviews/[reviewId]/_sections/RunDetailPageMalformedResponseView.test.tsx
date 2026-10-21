import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-malformed",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

import { RunDetailPageMalformedResponseView } from "./RunDetailPageMalformedResponseView";

describe("RunDetailPageMalformedResponseView report problem (TB-791)", () => {
  it("renders Report problem on malformed review detail response", () => {
    render(<RunDetailPageMalformedResponseView message="Expected object at summary." />);

    expect(screen.getByTestId("fatal-page-report-problem-row")).toBeInTheDocument();
    expect(screen.getByTestId("report-problem-trigger")).toBeInTheDocument();
  });
});
