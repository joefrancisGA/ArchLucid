import { render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

import { OperatorBrandedTransientFailure } from "@/components/operator/OperatorBrandedTransientFailure";

const productLineMock = vi.hoisted(() => ({ value: "architecture" as "architecture" | "security" }));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({
    productLine: productLineMock.value,
    assignmentOverrides: {},
    setProductLine: vi.fn(),
    setHrefAssignment: vi.fn(),
    resetHrefAssignment: vi.fn(),
    resetAllAssignments: vi.fn(),
  }),
}));

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}

    unobserve(): void {}

    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
});

describe("OperatorBrandedTransientFailure", () => {
  beforeEach(() => {
    productLineMock.value = "architecture";
  });

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

  it("names SecureNow when the Security product line is active", () => {
    productLineMock.value = "security";

    render(
      <OperatorBrandedTransientFailure
        failure={{
          message: "Timed out",
          problem: null,
          correlationId: null,
          httpStatus: 504,
          retryAfterSeconds: null,
        }}
      />,
    );

    expect(screen.getByText("SecureNow is taking longer than expected")).toBeInTheDocument();
    expect(screen.getByText("SecureNow · TIMEOUT")).toBeInTheDocument();
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
