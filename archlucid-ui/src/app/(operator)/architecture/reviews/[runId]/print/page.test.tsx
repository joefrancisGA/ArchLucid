import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PACKAGE_PRINT_PAGE_TITLE } from "@/lib/package-print-view";

const getRunSummary = vi.fn();
const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("@/lib/api", () => ({
  getRunSummary: (...args: unknown[]) => getRunSummary(...args),
}));

vi.mock("next/navigation", () => ({
  notFound: () => notFound(),
  usePathname: () => "/architecture/reviews/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/print",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/OperatorApiProblem", () => ({
  OperatorApiProblem: ({ fallbackMessage }: { fallbackMessage: string }) => (
    <div data-testid="api-problem-mock">{fallbackMessage}</div>
  ),
}));

import { PackagePrintPageClient } from "./_sections/PackagePrintPageClient";
import PackagePrintPage from "./page";

describe("PackagePrintPage route (TB-2205)", () => {
  beforeEach(() => {
    getRunSummary.mockReset();
    notFound.mockClear();
  });

  it("rejects invalid run ids", async () => {
    await expect(PackagePrintPage({ params: Promise.resolve({ runId: "undefined" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("loads summary and renders print view smoke", async () => {
    getRunSummary.mockResolvedValue({
      runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      projectId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      createdUtc: "2026-08-01T12:00:00Z",
      description: "Payments edge architecture",
      displayName: "Payments edge",
      hasGoldenManifest: true,
      findingCount: 3,
      warningCount: 0,
      hasGovernanceWarnings: false,
    });

    const element = await PackagePrintPage({
      params: Promise.resolve({ runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" }),
    });

    render(element);

    expect(screen.getByTestId("package-print-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("package-print-page")).toBeInTheDocument();
    });

    expect(screen.getByText(PACKAGE_PRINT_PAGE_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("package-print-title")).toHaveTextContent("Payments edge");
    expect(getRunSummary).toHaveBeenCalledWith("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
  });

  it("renders client error state when summary fails", async () => {
    getRunSummary.mockRejectedValue(new Error("network down"));

    render(<PackagePrintPageClient runId="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" />);

    await waitFor(() => {
      expect(screen.getByTestId("package-print-error")).toBeInTheDocument();
    });

    expect(screen.getByTestId("api-problem-mock")).toBeInTheDocument();
  });
});
