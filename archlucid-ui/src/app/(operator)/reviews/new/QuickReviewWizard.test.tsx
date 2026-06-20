import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const createRun = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api", () => ({
  createArchitectureRun: (...args: unknown[]) => createRun(...args),
}));

vi.mock("@/lib/first-tenant-funnel-telemetry", () => ({
  recordFirstTenantFunnelEvent: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("./NewRunWizardClient", () => ({
  NewRunWizardClient: () => <div data-testid="detailed-wizard-stub">Detailed wizard stub</div>,
}));

vi.mock("./SocraticIntakeWizard", () => ({
  SocraticIntakeWizard: () => <div data-testid="guided-intake-stub">Guided intake stub</div>,
}));

import {
  CONTOSO_RETAIL_SAMPLE_BRIEF,
  QuickReviewWizard,
} from "./QuickReviewWizard";
import { ReviewsNewPathSwitcher } from "./ReviewsNewPathSwitcher";
import { REVIEWS_NEW_PATH_HINTS } from "@/lib/reviews-new-path-copy";

describe("QuickReviewWizard", () => {
  it("completes three steps, sample brief meets minimum, and submits createArchitectureRun then navigates", async () => {
    createRun.mockResolvedValue({ run: { runId: "quick-review-run-1" } });
    push.mockReset();

    render(<QuickReviewWizard />);

    expect(screen.getByTestId("quick-review-progress")).toHaveTextContent(/step 1 of 3/i);

    fireEvent.click(screen.getByTestId("quick-review-sample-brief"));
    const brief = screen.getByLabelText("Architecture brief") as HTMLTextAreaElement;
    expect(brief.value.length).toBeGreaterThanOrEqual(100);
    expect(brief.value).toBe(CONTOSO_RETAIL_SAMPLE_BRIEF);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => {
      expect(screen.getByTestId("quick-review-progress")).toHaveTextContent(/step 2 of 3/i);
    });

    fireEvent.change(screen.getByLabelText(/Review title/i), { target: { value: "Contoso migration slice" } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => {
      expect(screen.getByTestId("quick-review-progress")).toHaveTextContent(/step 3 of 3/i);
    });

    fireEvent.click(screen.getByTestId("quick-review-start"));
    await waitFor(() => {
      expect(createRun).toHaveBeenCalled();
    });

    const body = createRun.mock.calls[0][0] as { description: string; systemName: string };
    expect(body.description.length).toBeGreaterThanOrEqual(100);
    expect(body.systemName).toBe("Contoso migration slice");
    expect(push).toHaveBeenCalledWith("/reviews/quick-review-run-1");
  });

  it("blocks Next when brief is under 100 characters", () => {
    createRun.mockReset();

    render(<QuickReviewWizard />);

    fireEvent.change(screen.getByLabelText("Architecture brief"), {
      target: { value: "x".repeat(50) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByTestId("quick-review-progress")).toHaveTextContent(/step 1 of 3/i);
  });
});

describe("ReviewsNewPathSwitcher", () => {
  it("defaults to full guided path and toggles to Detailed wizard stub", async () => {
    localStorage.clear();
    render(<ReviewsNewPathSwitcher />);

    await waitFor(() => {
      expect(screen.getByTestId("reviews-new-path-toggle")).toBeTruthy();
    });

    expect(screen.getByTestId("guided-intake-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("quick-review-progress")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("reviews-new-path-quick"));
    await waitFor(() => {
      expect(screen.getByTestId("quick-review-progress")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("reviews-new-path-detailed"));
    await waitFor(() => {
      expect(screen.getByTestId("detailed-wizard-stub")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("reviews-new-path-guided-intake"));
    await waitFor(() => {
      expect(screen.getByTestId("guided-intake-stub")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("reviews-new-path-quick"));
    await waitFor(() => {
      expect(screen.getByTestId("quick-review-progress")).toBeInTheDocument();
    });
  });

  it("shows exactly one creation path at a time (TB-270)", async () => {
    localStorage.clear();
    render(<ReviewsNewPathSwitcher />);

    await waitFor(() => {
      expect(screen.getByTestId("reviews-new-path-hint")).toBeInTheDocument();
    });

    const visiblePaths = [
      screen.queryByTestId("quick-review-progress"),
      screen.queryByTestId("guided-intake-stub"),
      screen.queryByTestId("detailed-wizard-stub"),
    ].filter((node) => node !== null);

    expect(visiblePaths).toHaveLength(1);
    expect(screen.getByTestId("guided-intake-stub")).toBeInTheDocument();
  });

  it("shows mode-specific path hint copy", async () => {
    localStorage.clear();
    render(<ReviewsNewPathSwitcher />);

    await waitFor(() => {
      expect(screen.getByTestId("reviews-new-path-hint")).toHaveTextContent(REVIEWS_NEW_PATH_HINTS["guided-intake"]);
    });

    fireEvent.click(screen.getByTestId("reviews-new-path-quick"));
    await waitFor(() => {
      expect(screen.getByTestId("reviews-new-path-hint")).toHaveTextContent(REVIEWS_NEW_PATH_HINTS["quick-review"]);
    });

    fireEvent.click(screen.getByTestId("reviews-new-path-detailed"));
    await waitFor(() => {
      expect(screen.getByTestId("reviews-new-path-hint")).toHaveTextContent(REVIEWS_NEW_PATH_HINTS.detailed);
    });
  });
});
