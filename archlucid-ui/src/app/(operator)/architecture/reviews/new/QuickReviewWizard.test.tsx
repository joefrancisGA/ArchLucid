import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createRun = vi.fn();
const push = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useRouter: () => ({ push, replace }),
  usePathname: () => "/architecture/reviews/new",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

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

vi.mock("@/lib/use-core-pilot-commit-presentation-context", () => ({
  useCorePilotCommitPresentationContext: () => ({
    hasCommittedManifest: true,
    latestCommittedRunId: "run-committed-1",
  }),
}));

vi.mock("./NewRunWizardClient", () => ({
  NewRunWizardClient: () => <div data-testid="detailed-wizard-stub">Detailed wizard stub</div>,
}));

vi.mock("./SocraticIntakeWizard", () => ({
  SocraticIntakeWizard: () => <div data-testid="guided-intake-stub">Guided intake stub</div>,
}));

vi.mock("./FirstPilotIntakeWizard", () => ({
  FirstPilotIntakeWizard: () => <div data-testid="first-pilot-intake-wizard">First pilot intake stub</div>,
}));

vi.mock("@/lib/usability/quick-review-wizard-preferences", () => ({
  readQuickReviewWizardPreferences: () => ({
    proofScope: ["cost", "compliance", "topology"],
    executionMode: "live",
    advancedConfigExpanded: false,
  }),
  persistQuickReviewWizardPreferences: vi.fn(),
}));

import { buildReviewGenerationRedirect } from "@/lib/review-generation-handoff";
import { showError } from "@/lib/toast";

import {
  CONTOSO_RETAIL_SAMPLE_BRIEF,
  QuickReviewWizard,
} from "./QuickReviewWizard";

describe("QuickReviewWizard", () => {
  beforeEach(() => {
    vi.mocked(showError).mockReset();
  });

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
    expect(push).toHaveBeenCalledWith(buildReviewGenerationRedirect("quick-review-run-1", "quick-review"));
  });

  it("blocks Next when brief is under 100 characters", () => {
    createRun.mockReset();

    render(<QuickReviewWizard />);

    fireEvent.change(screen.getByLabelText("Architecture brief"), {
      target: { value: "x".repeat(50) },
    });

    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByTestId("quick-review-progress")).toHaveTextContent(/step 1 of 3/i);
    expect(screen.queryByTestId("quick-review-validation-error")).not.toBeInTheDocument();
    expect(showError).not.toHaveBeenCalled();
  });

  it("surfaces create failure inline without toast (TB-2113)", async () => {
    createRun.mockRejectedValue(new Error("Network down"));

    render(<QuickReviewWizard />);

    fireEvent.click(screen.getByTestId("quick-review-sample-brief"));
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
      expect(screen.getByTestId("quick-review-submit-error")).toHaveTextContent(
        /could not start the architecture review/i,
      );
    });
    expect(showError).not.toHaveBeenCalled();
  });
});
