import { renderHook, type ReactNode } from "@testing-library/react";
import { createElement, useSyncExternalStore } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const wizardModeSearchParamsHarness = vi.hoisted(() => {
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
    readWindowLocationSearch: () => wizardModeSearchParamsHarness.state.query,
    commitHrefIfChanged: (href: string, _options?: { readonly notify?: boolean }) => {
      wizardModeSearchParamsHarness.applyHref(href);

      return true;
    },
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/new",
  useSearchParams: () => new URLSearchParams(wizardModeSearchParamsHarness.state.query),
}));

vi.mock("@/hooks/use-new-run-wizard-committed-probe-query", () => ({
  useNewRunWizardCommittedProbeQuery: vi.fn(() => ({
    isPending: false,
    isSuccess: false,
    isError: false,
    data: undefined,
  })),
}));

import { useNewRunWizardCommittedProbeQuery } from "@/hooks/use-new-run-wizard-committed-probe-query";

import { useNewRunWizardMode } from "./use-new-run-wizard-mode";
import { WIZARD_MODE_STORAGE_KEY } from "./new-run-wizard-steps";

function WizardModeSearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    wizardModeSearchParamsHarness.subscribe,
    () => wizardModeSearchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

describe("useNewRunWizardMode", () => {
  beforeEach(() => {
    wizardModeSearchParamsHarness.reset();
    window.localStorage.clear();
    vi.mocked(useNewRunWizardCommittedProbeQuery).mockReturnValue({
      isPending: false,
      isSuccess: false,
      isError: false,
      data: undefined,
    } as ReturnType<typeof useNewRunWizardCommittedProbeQuery>);
  });

  it("follows mode= URL changes without a popstate event", () => {
    wizardModeSearchParamsHarness.state.query = "mode=quick";

    const { result, rerender } = renderHook(() => useNewRunWizardMode(false), {
      wrapper: WizardModeSearchParamsRerenderHost,
    });

    expect(result.current.wizardMode).toBe("quick");

    wizardModeSearchParamsHarness.applyHref("/architecture/reviews/new?mode=full");
    rerender();

    expect(result.current.wizardMode).toBe("full");
    expect(window.localStorage.getItem(WIZARD_MODE_STORAGE_KEY)).toBe("full");
    expect(wizardModeSearchParamsHarness.state.query).toContain("mode=full");
  });

  it("surfaces committed-manifest probe failure without claiming no finalized reviews exist", () => {
    vi.mocked(useNewRunWizardCommittedProbeQuery).mockReturnValue({
      isPending: false,
      isSuccess: false,
      isError: true,
      data: undefined,
    } as ReturnType<typeof useNewRunWizardCommittedProbeQuery>);

    const { result } = renderHook(() => useNewRunWizardMode(false), {
      wrapper: WizardModeSearchParamsRerenderHost,
    });

    expect(result.current.wizardMode).toBe("quick");
    expect(result.current.committedManifestProbeFailed).toBe(true);
  });
});
