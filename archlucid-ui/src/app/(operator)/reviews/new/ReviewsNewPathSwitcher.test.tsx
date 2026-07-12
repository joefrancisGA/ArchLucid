import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useSearchParams = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useSearchParams: () => useSearchParams(),
    redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("@/lib/use-core-pilot-commit-presentation-context", () => ({
  useCorePilotCommitPresentationContext: () => ({
    hasCommittedManifest: false,
    latestCommittedRunId: null,
  }),
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

import { CREATE_ARCHITECTURE_INTENT } from "@/lib/architecture-workflow-intent";
import {
  REVIEWS_NEW_CREATE_ARCHITECTURE_PATH_HINTS,
  REVIEWS_NEW_PATH_HINTS,
} from "@/lib/reviews-new-path-copy";

import { ReviewsNewPathSwitcher } from "./ReviewsNewPathSwitcher";

describe("ReviewsNewPathSwitcher (first-run tenant)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("shows review-start tabs immediately and switches modes", async () => {
    render(<ReviewsNewPathSwitcher />);

    await waitFor(() => {
      expect(screen.getByTestId("first-pilot-intake-wizard-stub")).toBeTruthy();
    });

    expect(screen.getByTestId("reviews-new-path-toggle")).toBeTruthy();
    expect(screen.queryByTestId("reviews-new-more-intake-options")).toBeNull();
    expect(screen.getByRole("tab", { name: "Quick start" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Fastest first-pilot path:", { selector: "strong" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Guided intake" }));

    await waitFor(() => {
      expect(screen.getByTestId("socratic-intake-wizard-stub")).toBeTruthy();
    });

    expect(screen.getByRole("tab", { name: "Guided intake" })).toHaveAttribute("aria-selected", "true");
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

  it("opens guided intake when path=guided-intake is in the query string", async () => {
    useSearchParams.mockReturnValue(new URLSearchParams("path=guided-intake"));

    render(<ReviewsNewPathSwitcher />);

    await waitFor(() => {
      expect(screen.getByTestId("socratic-intake-wizard-stub")).toBeTruthy();
    });

    expect(screen.getByRole("tab", { name: "Guided intake" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Quick start" })).toHaveAttribute("aria-selected", "false");
  });

  it("uses create-architecture tab labels and guided hint when intent is set", async () => {
    useSearchParams.mockReturnValue(
      new URLSearchParams(`path=guided-intake&intent=${CREATE_ARCHITECTURE_INTENT}`),
    );

    render(<ReviewsNewPathSwitcher />);

    await waitFor(() => {
      expect(screen.getByTestId("socratic-intake-wizard-stub")).toBeTruthy();
    });

    expect(screen.getByRole("tab", { name: "Describe it" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Guided questions" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("reviews-new-path-hint")).toHaveTextContent(
      REVIEWS_NEW_CREATE_ARCHITECTURE_PATH_HINTS["guided-intake"],
    );
  });

  it("keeps default review tab labels without create-architecture intent", async () => {
    render(<ReviewsNewPathSwitcher />);

    await waitFor(() => {
      expect(screen.getByTestId("reviews-new-path-hint")).toHaveTextContent(REVIEWS_NEW_PATH_HINTS["quick-review"]);
    });

    expect(screen.getByRole("tab", { name: "Quick start" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Describe it" })).not.toBeInTheDocument();
  });

  it("prevents vertical overflow scrollbars on the path tab row", async () => {
    render(<ReviewsNewPathSwitcher />);

    await waitFor(() => {
      expect(screen.getByTestId("reviews-new-path-toggle")).toBeInTheDocument();
    });

    expect(screen.getByTestId("reviews-new-path-toggle").className).toContain("overflow-y-hidden");
  });
});
