import { renderHook, type ReactNode } from "@testing-library/react";
import { createElement, useSyncExternalStore } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const wizardSearchParamsHarness = vi.hoisted(() => {
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
    readWindowLocationSearch: () => wizardSearchParamsHarness.state.query,
    commitHrefIfChanged: (href: string, _options?: { readonly notify?: boolean }) => {
      wizardSearchParamsHarness.applyHref(href);

      return true;
    },
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/new",
  useSearchParams: () => new URLSearchParams(wizardSearchParamsHarness.state.query),
}));

import { useNewRunWizardSteps } from "./use-new-run-wizard-steps";

function WizardSearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    wizardSearchParamsHarness.subscribe,
    () => wizardSearchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

const baseOptions = {
  baselineFirst: false,
  embeddedInPathSwitcher: true,
  wizardMode: "full" as const,
  runId: null,
  showQuickTrack: false,
  commitPresentationContext: {
    hasCommittedManifest: false,
    latestCommittedRunId: null,
    latestRunId: null,
  },
  advancedConfigurationOptIn: true,
  watchedWizardValues: undefined,
  hasPendingEvidence: false,
  trigger: vi.fn().mockResolvedValue(true),
  persistBaselineMetricsIfNeeded: vi.fn().mockResolvedValue(true),
  setStepValidationMessage: vi.fn(),
};

describe("useNewRunWizardSteps", () => {
  beforeEach(() => {
    wizardSearchParamsHarness.reset();
  });

  it("follows step= URL changes without a popstate event", () => {
    const { result, rerender } = renderHook(() => useNewRunWizardSteps(baseOptions), {
      wrapper: WizardSearchParamsRerenderHost,
    });

    expect(result.current.stepIndex).toBe(0);

    wizardSearchParamsHarness.applyHref("/architecture/reviews/new?step=3");
    rerender();

    expect(result.current.stepIndex).toBe(3);
  });
});
