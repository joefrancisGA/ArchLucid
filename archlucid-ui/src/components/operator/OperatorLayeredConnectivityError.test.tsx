import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews",
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();
  return {
    ...actual,
  isBuyerPolishedOperatorShellEnv: vi.fn(() => true),
};
});

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { OperatorLayeredConnectivityError } from "@/components/operator/OperatorLayeredConnectivityError";

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}

    unobserve(): void {}

    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
});

const buyerPolishedMock = vi.mocked(isBuyerPolishedOperatorShellEnv);

describe("OperatorLayeredConnectivityError", () => {
  afterEach(() => {
    buyerPolishedMock.mockReturnValue(true);
    vi.unstubAllEnvs();
  });

  const upstreamFailure = {
    message: "Upstream API unreachable: fetch failed",
    httpStatus: 502,
    problem: {
      title: "Upstream API unreachable",
      detail: "fetch failed",
      supportHint: "Set ARCHLUCID_API_BASE_URL in archlucid-ui/.env.local.",
    },
    correlationId: "req-connectivity-abc",
  } as const;

  it("hides raw request ID, fetch failed, and env vars in the primary card", () => {
    render(<OperatorLayeredConnectivityError {...upstreamFailure} />);

    const primary = within(screen.getByTestId("operator-connectivity-primary"));

    expect(primary.getByText("Workspace data unavailable")).toBeInTheDocument();
    expect(primary.queryByText("fetch failed")).toBeNull();
    expect(primary.queryByText(/ARCHLUCID_API_BASE_URL/i)).toBeNull();
    expect(primary.queryByText("req-connectivity-abc")).toBeNull();
    expect(primary.queryByText(/First-pilot triage cards/i)).toBeNull();
  });

  it("defaults Technical details to collapsed and exposes support detail when expanded", () => {
    render(<OperatorLayeredConnectivityError {...upstreamFailure} />);

    const detailsEl = screen.getByTestId("operator-connectivity-technical-details");

    expect(detailsEl).not.toHaveAttribute("open");
    expect(detailsEl.textContent ?? "").toContain("fetch failed");
    expect(detailsEl.textContent ?? "").toContain("req-connectivity-abc");
    expect(detailsEl.textContent ?? "").toContain("Upstream API unreachable");
  });

  it("renders recovery actions including system health", () => {
    render(<OperatorLayeredConnectivityError {...upstreamFailure} />);

    expect(screen.getByTestId("operator-error-recovery-contract")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open troubleshooting" })).toHaveAttribute(
      "href",
      "/help/troubleshooting#overview-workspace-empty",
    );
    expect(screen.getByRole("link", { name: "System health" })).toHaveAttribute("href", "/administration/system-health");
  });

  it("reloads the page when Retry is clicked", () => {
    const reload = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload },
    });

    render(<OperatorLayeredConnectivityError {...upstreamFailure} />);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("shows local configuration hints inside Technical details in development", () => {
    buyerPolishedMock.mockReturnValue(false);
    vi.stubEnv("NODE_ENV", "development");

    render(<OperatorLayeredConnectivityError {...upstreamFailure} />);

    const primary = within(screen.getByTestId("operator-connectivity-primary"));

    expect(primary.queryByText(/ARCHLUCID_API_BASE_URL/i)).toBeNull();
    expect(screen.getByTestId("operator-connectivity-technical-details").textContent ?? "").toContain(
      "ARCHLUCID_API_BASE_URL",
    );
  });

  it("labels support docs as Connectivity checklist inside Technical details", () => {
    render(<OperatorLayeredConnectivityError {...upstreamFailure} />);

    expect(screen.getByText("Connectivity checklist")).toBeInTheDocument();
  });

  it("renders Report problem and opens dialog with correlation id prefilled (TB-785)", () => {
    render(<OperatorLayeredConnectivityError {...upstreamFailure} />);

    fireEvent.click(screen.getByTestId("report-problem-trigger"));

    expect(screen.getByTestId("report-problem-dialog")).toBeInTheDocument();
    expect(
      within(screen.getByTestId("report-problem-context-summary")).getByText("req-connectivity-abc"),
    ).toBeInTheDocument();
  });
});
