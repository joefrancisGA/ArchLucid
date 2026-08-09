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

  it("shows one primary quick-start path with secondary options in disclosure (TB-2130)", async () => {
    render(<ReviewsNewPathSwitcher />);

    await waitFor(() => {
      expect(screen.getByTestId("first-pilot-intake-wizard-stub")).toBeTruthy();
    });

    expect(screen.getByTestId("reviews-new-primary-path-layout")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-new-more-intake-options")).toBeInTheDocument();
    expect(screen.queryByTestId("reviews-new-path-toggle")).toBeNull();
    expect(screen.getByText("Fastest first-pilot path:", { selector: "strong" })).toBeInTheDocument();

    const visiblePaths = [
      screen.queryByTestId("first-pilot-intake-wizard-stub"),
      screen.queryByTestId("socratic-intake-wizard-stub"),
      screen.queryByTestId("new-run-wizard-stub"),
    ].filter((node) => node !== null);

    expect(visiblePaths).toHaveLength(1);
  });

  it("switches to guided intake from the disclosure without showing peer tabs", async () => {
    render(<ReviewsNewPathSwitcher />);

    await waitFor(() => {
      expect(screen.getByTestId("reviews-new-more-path-guided-intake")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("reviews-new-more-path-guided-intake"));

    await waitFor(() => {
      expect(screen.getByTestId("socratic-intake-wizard-stub")).toBeTruthy();
    });

    expect(screen.queryByTestId("reviews-new-path-toggle")).toBeNull();
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

  it("keeps default review path hints on the primary layout", async () => {
    render(<ReviewsNewPathSwitcher />);

    await waitFor(() => {
      expect(screen.getByTestId("reviews-new-path-hint")).toHaveTextContent(REVIEWS_NEW_PATH_HINTS["quick-review"]);
    });
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

    fireEvent.click(screen.getByRole("tab", { name: "Guided intake" }));

    await waitFor(() => {
      expect(screen.getByTestId("socratic-intake-wizard-stub")).toBeTruthy();
    });

    expect(screen.getByRole("tab", { name: "Guided intake" })).toHaveAttribute("aria-selected", "true");
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

    expect(screen.getByRole("tab", { name: "Guided intake" })).toHaveAttribute("aria-selected", "true");
  });

  it("prevents vertical overflow scrollbars on the path tab row", async () => {
    render(<ReviewsNewPathSwitcher />);

    await waitFor(() => {
      expect(screen.getByTestId("reviews-new-path-toggle")).toBeInTheDocument();
    });

    expect(screen.getByTestId("reviews-new-path-toggle").className).toContain("overflow-y-hidden");
  });
});
