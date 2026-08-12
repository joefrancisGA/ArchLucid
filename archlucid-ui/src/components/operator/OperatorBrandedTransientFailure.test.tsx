import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeAll } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: import("react").ReactNode;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useRouter: () => ({
    refresh: vi.fn(),
  }),
  usePathname: () => "/architecture/reviews/run-1",
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

import { OperatorBrandedTransientFailure } from "@/components/operator/OperatorBrandedTransientFailure";

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}

    unobserve(): void {}

    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
});

describe("OperatorBrandedTransientFailure", () => {
  it("renders timeout copy and retry affordance", () => {
    render(
      <OperatorBrandedTransientFailure
        failure={{
          message: "The operation was aborted due to timeout",
          problem: null,
          correlationId: "corr-timeout",
          httpStatus: null,
          retryAfterSeconds: null,
        }}
        retryLabel="Retry loading review"
      />,
    );

    expect(screen.getByText("ArchLucid is taking longer than expected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry loading review" })).toBeInTheDocument();
    expect(screen.getByText("Request timed out")).toBeInTheDocument();
    expect(screen.getByText("ArchLucid · TIMEOUT")).toBeInTheDocument();
    expect(screen.getByText("corr-timeout")).toBeInTheDocument();
  });

  it("renders unavailable copy for upstream outage", () => {
    render(
      <OperatorBrandedTransientFailure
        failure={{
          message: "Upstream API unreachable",
          problem: null,
          correlationId: null,
          httpStatus: 502,
          retryAfterSeconds: null,
        }}
      />,
    );

    expect(screen.getByText("ArchLucid is temporarily unavailable")).toBeInTheDocument();
    expect(screen.getByText("ArchLucid · UNAVAILABLE")).toBeInTheDocument();
  });

  it("renders fatal-page Report problem when surface id is provided (TB-786)", () => {
    render(
      <OperatorBrandedTransientFailure
        failure={{
          message: "Timed out",
          problem: null,
          correlationId: "corr-transient-1",
          httpStatus: 504,
          retryAfterSeconds: null,
        }}
        reportProblemSurfaceId="review-detail-hard-load-failure"
      />,
    );

    expect(screen.getByTestId("fatal-page-report-problem-row")).toBeInTheDocument();
    expect(screen.getByTestId("report-problem-trigger")).toBeInTheDocument();
  });
});
