import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useSearchParams = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useSearchParams: () => useSearchParams(),
    usePathname: () => "/architecture/reviews/new",
    useRouter: () => ({ replace }),
    redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

const useCorePilotCommitContextQuery = vi.fn();

vi.mock("@/hooks/use-core-pilot-commit-context-query", () => ({
  useCorePilotCommitContextQuery: () => useCorePilotCommitContextQuery(),
}));

vi.mock("./FirstPilotIntakeWizard", () => ({
  FirstPilotIntakeWizard: () => <div data-testid="first-pilot-intake-wizard-stub">First pilot wizard</div>,
}));

vi.mock("./SocraticIntakeWizard", () => ({
  SocraticIntakeWizard: () => <div data-testid="socratic-intake-wizard-stub">Socratic wizard</div>,
}));

vi.mock("./NewRunWizardClient", () => ({
  NewRunWizardClient: () => <div data-testid="new-run-wizard-stub">Detailed wizard</div>,
}));

vi.mock("./ReviewsNewOwnEvidenceStart", () => ({
  ReviewsNewOwnEvidenceStart: () => <div data-testid="reviews-new-own-evidence-start" />,
}));

import { REVIEWS_NEW_PATH_HINTS } from "@/lib/reviews-new-path-copy";

import { ReviewsNewPathSwitcher } from "./ReviewsNewPathSwitcher";

describe("ReviewsNewPathSwitcher (first-run tenant)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useSearchParams.mockReturnValue(new URLSearchParams());
    replace.mockClear();
    useCorePilotCommitContextQuery.mockReturnValue({
      isPending: false,
      data: { hasCommittedManifest: false, firstCommittedRunId: null, latestRunId: null },
    });
  });

  it("leads with the job → pack chooser before template paths (TB-2136)", async () => {
    render(<ReviewsNewPathSwitcher />);

    await waitFor(() => {
      expect(screen.getByTestId("reviews-new-job-chooser-section")).toBeInTheDocument();
    });

    expect(screen.getByTestId("reviews-new-primary-path-layout")).toBeInTheDocument();
    expect(screen.getAllByText(/Expected outputs:/i).length).toBeGreaterThan(0);
    expect(screen.getByTestId("reviews-new-own-evidence-start")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-new-more-intake-options")).toBeInTheDocument();
    expect(screen.queryByTestId("reviews-new-path-toggle")).toBeNull();
    expect(screen.queryByTestId("first-pilot-intake-wizard-stub")).toBeNull();
    expect(screen.queryByTestId("reviews-new-path-hint")).toBeNull();
  });

  it("opens guided intake from the disclosure without showing peer tabs", async () => {
    render(<ReviewsNewPathSwitcher />);

    await waitFor(() => {
      expect(screen.getByTestId("reviews-new-more-path-guided-intake")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("reviews-new-more-path-guided-intake"));

    await waitFor(() => {
      expect(screen.getByTestId("socratic-intake-wizard-stub")).toBeTruthy();
    });

    expect(screen.queryByTestId("reviews-new-path-toggle")).toBeNull();
    expect(screen.queryByTestId("reviews-new-job-chooser-section")).toBeNull();
    expect(screen.getByTestId("reviews-new-back-to-quick-start")).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith(
      "/architecture/reviews/new?path=guided-intake",
      expect.objectContaining({ scroll: false }),
    );
  });

  it("opens guided intake when path=guided-intake is in the query string", async () => {
    useSearchParams.mockReturnValue(new URLSearchParams("path=guided-intake"));

    render(<ReviewsNewPathSwitcher />);

    await waitFor(() => {
      expect(screen.getByTestId("socratic-intake-wizard-stub")).toBeTruthy();
    });

    expect(screen.queryByTestId("reviews-new-path-toggle")).toBeNull();
    expect(screen.getByTestId("reviews-new-back-to-quick-start")).toBeInTheDocument();
  });

  it("returns to the job chooser when back to quick start clears accelerator deep-link params", async () => {
    useSearchParams.mockReturnValue(new URLSearchParams("baseline=1&accelerator=ai-llm-workload"));

    render(<ReviewsNewPathSwitcher />);

    await waitFor(() => {
      expect(screen.getByTestId("new-run-wizard-stub")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("reviews-new-back-to-quick-start"));

    await waitFor(() => {
      expect(screen.getByTestId("reviews-new-job-chooser-section")).toBeInTheDocument();
    });

    expect(replace).toHaveBeenCalledWith(
      "/architecture/reviews/new?path=quick-review",
      expect.objectContaining({ scroll: false }),
    );
  });

  it("keeps default review path hints when an accelerator pack deep link is used", async () => {
    useSearchParams.mockReturnValue(new URLSearchParams("baseline=1&accelerator=ai-llm-workload"));

    render(<ReviewsNewPathSwitcher />);

    await waitFor(() => {
      expect(screen.getByTestId("new-run-wizard-stub")).toBeTruthy();
    });

    expect(screen.queryByTestId("reviews-new-job-chooser-section")).toBeNull();
    expect(screen.getByTestId("reviews-new-path-hint")).toHaveTextContent(REVIEWS_NEW_PATH_HINTS.detailed);
  });

  it("opens the templates wizard for greenfield preset without showing the job chooser", async () => {
    useSearchParams.mockReturnValue(new URLSearchParams("preset=greenfield"));

    render(<ReviewsNewPathSwitcher />);

    await waitFor(() => {
      expect(screen.getByTestId("new-run-wizard-stub")).toBeTruthy();
    });

    expect(screen.queryByTestId("reviews-new-job-chooser-section")).toBeNull();
  });

  it("skips the job chooser when a valid example template deep link is present", async () => {
    useSearchParams.mockReturnValue(new URLSearchParams("template=claims-intake-modernization"));

    render(<ReviewsNewPathSwitcher />);

    await waitFor(() => {
      expect(screen.getByTestId("first-pilot-intake-wizard-stub")).toBeTruthy();
    });

    expect(screen.queryByTestId("reviews-new-job-chooser-section")).toBeNull();
  });
});

describe("ReviewsNewPathSwitcher (returning tenant)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useSearchParams.mockReturnValue(new URLSearchParams());
    replace.mockClear();
    useCorePilotCommitContextQuery.mockReturnValue({
      isPending: false,
      data: { hasCommittedManifest: true, firstCommittedRunId: "run-committed-1", latestRunId: "run-committed-1" },
    });
  });

  it("shows review-start tabs and switches modes", async () => {
    render(<ReviewsNewPathSwitcher />);

    await waitFor(() => {
      expect(screen.getByTestId("first-pilot-intake-wizard-stub")).toBeTruthy();
    });

    expect(screen.getByTestId("reviews-new-path-toggle")).toBeTruthy();
    expect(screen.queryByTestId("reviews-new-more-intake-options")).toBeNull();
    expect(screen.getByRole("tab", { name: "Quick start" })).toHaveAttribute("aria-selected", "true");

    fireEvent.click(screen.getByRole("tab", { name: "Guided questions" }));

    await waitFor(() => {
      expect(screen.getByTestId("socratic-intake-wizard-stub")).toBeTruthy();
    });

    expect(screen.getByRole("tab", { name: "Guided questions" })).toHaveAttribute("aria-selected", "true");
    expect(replace).toHaveBeenCalledWith(
      "/architecture/reviews/new?path=guided-intake",
      expect.objectContaining({ scroll: false }),
    );
  });

  it("moves selection with ArrowRight keyboard navigation on the tablist", async () => {
    render(<ReviewsNewPathSwitcher />);

    await waitFor(() => {
      expect(screen.getByTestId("first-pilot-intake-wizard-stub")).toBeTruthy();
    });

    const quickStartTab = screen.getByRole("tab", { name: "Quick start" });
    quickStartTab.focus();

    fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowRight" });

    await waitFor(() => {
      expect(screen.getByTestId("socratic-intake-wizard-stub")).toBeTruthy();
    });

    expect(screen.getByRole("tab", { name: "Guided questions" })).toHaveAttribute("aria-selected", "true");
  });

  it("prevents vertical overflow scrollbars on the path tab row", async () => {
    render(<ReviewsNewPathSwitcher />);

    await waitFor(() => {
      expect(screen.getByTestId("reviews-new-path-toggle")).toBeInTheDocument();
    });

    expect(screen.getByTestId("reviews-new-path-toggle").className).toContain("overflow-y-hidden");
  });
});
