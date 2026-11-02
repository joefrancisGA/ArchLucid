import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const returningJobChooserSearchParamsHarness = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const state = { query: "", windowQuery: null as string | null };

  return {
    state,
    subscribe(listener: () => void): () => void {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    applyHref(href: string): void {
      try {
        const url = new URL(href, "http://localhost/");
        state.query = url.search.startsWith("?") ? url.search.slice(1) : url.search;
      } catch {
        const qIndex = href.indexOf("?");
        state.query = qIndex >= 0 ? href.slice(qIndex + 1) : "";
      }

      state.windowQuery = state.query;

      for (const listener of listeners) {
        listener();
      }
    },
    applySearchParamsQuery(query: string): void {
      state.query = query;

      for (const listener of listeners) {
        listener();
      }
    },
    setWindowLocationSearch(query: string): void {
      state.windowQuery = query;
    },
    readWindowLocationSearch(): string {
      return state.windowQuery ?? state.query;
    },
    reset(): void {
      state.query = "";
      state.windowQuery = null;
    },
  };
});

vi.mock("@/lib/navigation/replace-if-href-changed", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/navigation/replace-if-href-changed")>();

  return {
    ...actual,
    readWindowLocationSearch: () => returningJobChooserSearchParamsHarness.readWindowLocationSearch(),
    commitHrefIfChanged: (href: string, _options?: { readonly notify?: boolean }) => {
      returningJobChooserSearchParamsHarness.applyHref(href);

      return true;
    },
  };
});

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    useSearchParams: () => new URLSearchParams(returningJobChooserSearchParamsHarness.state.query),
    useRouter: () => ({ replace: vi.fn() }),
    usePathname: () => "/architecture/reviews/new",
    redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("@/hooks/use-core-pilot-commit-context-query", () => ({
  useCorePilotCommitContextQuery: () => ({
    isPending: false,
    data: { hasCommittedManifest: true, firstCommittedRunId: "run-committed-1", latestRunId: "run-committed-1" },
  }),
}));

vi.mock("./FirstPilotIntakeWizard", () => ({
  FirstPilotIntakeWizard: () => <div data-testid="first-pilot-intake-wizard-stub" />,
}));

vi.mock("./SocraticIntakeWizard", () => ({
  SocraticIntakeWizard: () => <div data-testid="socratic-intake-wizard-stub" />,
}));

vi.mock("./NewRunWizardClient", () => ({
  NewRunWizardClient: () => <div data-testid="new-run-wizard-stub" />,
}));

vi.mock("./ReviewsNewOwnEvidenceStart", () => ({
  ReviewsNewOwnEvidenceStart: () => <div data-testid="reviews-new-own-evidence-start" />,
}));

import { ReviewsNewPathSwitcher } from "./ReviewsNewPathSwitcher";
import { ACCELERATOR_JOB_CHOOSER_HEADING } from "@/lib/accelerator-chooser-start-copy";

function ReturningJobChooserSearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    returningJobChooserSearchParamsHarness.subscribe,
    () => returningJobChooserSearchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

describe("ReviewsNewPathSwitcher returning job chooser URL sync", () => {
  beforeEach(() => {
    returningJobChooserSearchParamsHarness.reset();
    window.localStorage.clear();
  });

  it("writes returning job chooser disclosure from useSearchParams when window.location.search lags after soft navigation", async () => {
    returningJobChooserSearchParamsHarness.applySearchParamsQuery("");
    returningJobChooserSearchParamsHarness.setWindowLocationSearch("staleToolbar=old");

    render(
      <ReturningJobChooserSearchParamsRerenderHost>
        <ReviewsNewPathSwitcher />
      </ReturningJobChooserSearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("reviews-new-returning-job-chooser")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(ACCELERATOR_JOB_CHOOSER_HEADING));

    if (!returningJobChooserSearchParamsHarness.state.query.includes("reviewsNewReturningJobChooserOpen=1")) {
      const details = screen.getByTestId("reviews-new-returning-job-chooser");

      fireEvent(details, new Event("toggle", { bubbles: true }));
    }

    expect(returningJobChooserSearchParamsHarness.state.query).toContain("reviewsNewReturningJobChooserOpen=1");
    expect(returningJobChooserSearchParamsHarness.state.query).not.toContain("staleToolbar");
  });

  it("keeps returning job chooser closed from useSearchParams when popstate reads lagging window.location.search", async () => {
    returningJobChooserSearchParamsHarness.applySearchParamsQuery("");
    returningJobChooserSearchParamsHarness.setWindowLocationSearch("reviewsNewReturningJobChooserOpen=1");

    render(
      <ReturningJobChooserSearchParamsRerenderHost>
        <ReviewsNewPathSwitcher />
      </ReturningJobChooserSearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("reviews-new-returning-job-chooser")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId("reviews-new-returning-job-chooser")).not.toHaveAttribute("open");
    });

    fireEvent(window, new PopStateEvent("popstate"));

    expect(screen.getByTestId("reviews-new-returning-job-chooser")).not.toHaveAttribute("open");
  });

  it("follows reviewsNewReturningJobChooserOpen= URL changes without a popstate event", async () => {
    returningJobChooserSearchParamsHarness.state.query = "reviewsNewReturningJobChooserOpen=1";

    const view = render(
      <ReturningJobChooserSearchParamsRerenderHost>
        <ReviewsNewPathSwitcher />
      </ReturningJobChooserSearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("reviews-new-returning-job-chooser")).toHaveAttribute("open");
    });

    returningJobChooserSearchParamsHarness.applyHref("/architecture/reviews/new");
    view.rerender(
      <ReturningJobChooserSearchParamsRerenderHost>
        <ReviewsNewPathSwitcher />
      </ReturningJobChooserSearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("reviews-new-returning-job-chooser")).not.toHaveAttribute("open");
    });
  });
});
