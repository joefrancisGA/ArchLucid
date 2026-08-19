import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const refreshMock = vi.fn();
const getRunDetailMock = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useRouter: () => ({
    refresh: refreshMock,
  }),
  usePathname: () => "/architecture/reviews/22222222-2222-2222-2222-222222222222",
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("@/lib/api", () => ({
  getRunDetail: (...args: unknown[]) => getRunDetailMock(...args),
}));

import { ReviewPackageLoadFailureView } from "@/components/ReviewPackageLoadFailureView";
import { recordReviewGenerationHandoff } from "@/lib/review-generation-handoff";

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}

    unobserve(): void {}

    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
});

const RUN_ID = "22222222-2222-2222-2222-222222222222";

describe("ReviewPackageLoadFailureView", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    getRunDetailMock.mockReset();
    getRunDetailMock.mockRejectedValue(new Error("not found"));
  });

  it("shows post-generation failure copy and retry affordance", () => {
    recordReviewGenerationHandoff(RUN_ID, "quick-review");

    render(
      <ReviewPackageLoadFailureView
        runId={RUN_ID}
        fromGeneration
        notFoundReason="workspace-mismatch"
        attemptedRoute={`/architecture/reviews/${RUN_ID}`}
      />,
    );

    expect(screen.getByText("We could not open the review that was just generated")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry loading review" })).toBeInTheDocument();
    expect(screen.getByTestId("copy-diagnostics")).toBeInTheDocument();
    expect(screen.getByTestId("operator-error-recovery-contract")).toBeInTheDocument();
    expect(screen.getByTestId("fatal-page-report-problem-row")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open sample review" })).not.toBeInTheDocument();
  });

  it("shows pending state for fresh generation handoff before package exists", () => {
    render(
      <ReviewPackageLoadFailureView
        runId={RUN_ID}
        fromGeneration
        notFoundReason="missing"
        attemptedRoute={`/architecture/reviews/${RUN_ID}?fromGeneration=1`}
      />,
    );

    expect(screen.getByText("Opening your generated review…")).toBeInTheDocument();
    expect(screen.getByTestId("review-package-pending")).toBeInTheDocument();
  });

  it("refreshes route when retry succeeds", async () => {
    getRunDetailMock.mockResolvedValue({ run: { runId: RUN_ID } });

    render(
      <ReviewPackageLoadFailureView
        runId={RUN_ID}
        fromGeneration
        notFoundReason="workspace-mismatch"
        attemptedRoute={`/architecture/reviews/${RUN_ID}`}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Retry loading review" }));
    });

    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalled();
    });
  });
});
