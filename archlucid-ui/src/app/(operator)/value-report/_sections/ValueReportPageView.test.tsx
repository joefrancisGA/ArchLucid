import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import type { UseValueReportPageModel } from "./use-value-report-page";
import { ValueReportPageView } from "./ValueReportPageView";

vi.mock("next/navigation", () => ({
  usePathname: () => "/value-report",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}

    unobserve(): void {}

    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
});

function buildModel(overrides?: Partial<UseValueReportPageModel>): UseValueReportPageModel {
  return {
    boardBusy: false,
    busy: false,
    canDownload: false,
    canMutate: true,
    error: null,
    fromUtc: "2026-01-01",
    hasReportData: false,
    onBoardPack: vi.fn(async () => undefined),
    onGenerate: vi.fn(async () => undefined),
    onRefreshPreview: vi.fn(async () => undefined),
    previewBusy: false,
    previewMetrics: null,
    setFromUtc: vi.fn(),
    setToUtc: vi.fn(),
    toUtc: "2026-06-01",
    ...overrides,
  };
}

describe("ValueReportPageView report problem (TB-791)", () => {
  it("renders Report problem on executive value report hard failure", () => {
    render(
      <ValueReportPageView
        model={buildModel({
          error: {
            correlationId: "corr-value-report-503",
            message: "Sponsor report preview could not be loaded.",
            problem: { title: "Service unavailable", detail: "Try again later." },
          },
        })}
      />,
    );

    expect(screen.getByTestId("report-problem-trigger")).toBeInTheDocument();
  });
});
