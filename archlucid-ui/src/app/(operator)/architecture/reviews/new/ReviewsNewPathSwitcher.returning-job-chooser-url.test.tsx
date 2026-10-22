import { render, screen, waitFor, type ReactNode } from "@testing-library/react";
import { createElement, useSyncExternalStore } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const returningJobChooserSearchParamsHarness = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const state = { query: "" };

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

      for (const listener of listeners) {
        listener();
      }
    },
    reset(): void {
      state.query = "";
    },
  };
});

vi.mock("@/lib/navigation/replace-if-href-changed", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/navigation/replace-if-href-changed")>();

  return {
    ...actual,
    readWindowLocationSearch: () => returningJobChooserSearchParamsHarness.state.query,
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
