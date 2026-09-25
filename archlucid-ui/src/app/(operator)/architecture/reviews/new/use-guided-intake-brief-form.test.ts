import { renderHook, act, waitFor, type ReactNode } from "@testing-library/react";
import { createElement, useSyncExternalStore } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { REVIEW_INTAKE_EXAMPLE_TEMPLATES } from "@/lib/operator/operator-home-example-request";

import { GUIDED_INTAKE_SCOPE_CONFIRMATION_BLOCKER } from "@/lib/guided-intake-copy";

import { resetGuidedIntakeExampleTemplatePrefillAppliedIdsForTests } from "./guided-intake-example-template-prefill-once";
import { useGuidedIntakeBriefForm } from "./use-guided-intake-brief-form";

const scopeGateSearchParamsHarness = vi.hoisted(() => {
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
    readWindowLocationSearch: () => scopeGateSearchParamsHarness.state.query,
    commitHrefIfChanged: (href: string, _options?: { readonly notify?: boolean }) => {
      scopeGateSearchParamsHarness.applyHref(href);

      return true;
    },
  };
});

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => "/architecture/reviews/new",
  useSearchParams: () => new URLSearchParams(scopeGateSearchParamsHarness.state.query),
}));

function ScopeGateSearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    scopeGateSearchParamsHarness.subscribe,
    () => scopeGateSearchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

describe("useGuidedIntakeBriefForm", () => {
  const exampleTemplate =
    REVIEW_INTAKE_EXAMPLE_TEMPLATES.find((row) => row.id === "customer-intake-modernization") ??
    REVIEW_INTAKE_EXAMPLE_TEMPLATES[0]!;

  beforeEach(() => {
    replaceMock.mockReset();
    scopeGateSearchParamsHarness.reset();
    resetGuidedIntakeExampleTemplatePrefillAppliedIdsForTests();
  });

  it("follows scopeGate= URL changes without a popstate event", () => {
    scopeGateSearchParamsHarness.state.query = "scopeGate=1";

    const { result, rerender } = renderHook(
      () =>
        useGuidedIntakeBriefForm({
          exampleTemplate: null,
          isCreateArchitectureFlow: false,
        }),
      { wrapper: ScopeGateSearchParamsRerenderHost },
    );

    expect(result.current.scopeGateOpen).toBe(true);

    scopeGateSearchParamsHarness.applyHref("/architecture/reviews/new");
    rerender();

    expect(result.current.scopeGateOpen).toBe(false);
  });

  it("blocks advance when scopeGate URL is set but scope bullets are not confirmed", () => {
    scopeGateSearchParamsHarness.state.query = "scopeGate=1";

    const { result } = renderHook(() =>
      useGuidedIntakeBriefForm({
        exampleTemplate: null,
        isCreateArchitectureFlow: false,
      }),
    );

    expect(result.current.scopeGateOpen).toBe(true);
    expect(result.current.scopeBullets).toEqual([]);
    expect(result.current.advanceBlockers).toContain(GUIDED_INTAKE_SCOPE_CONFIRMATION_BLOCKER);
  });

  it("clears scope confirmation blocker when scope bullets are confirmed after scopeGate URL prefill", () => {
    scopeGateSearchParamsHarness.state.query = "scopeGate=1";

    const { result } = renderHook(() =>
      useGuidedIntakeBriefForm({
        exampleTemplate: null,
        isCreateArchitectureFlow: false,
      }),
    );

    act(() => {
      result.current.setScopeBullets([
        {
          id: "scope-1",
          kind: "system",
          label: "Primary System or Architecture",
          value: "Retail API",
          source: "inferred",
        },
      ]);
    });

    expect(result.current.scopeGateOpen).toBe(true);
    expect(result.current.advanceBlockers).not.toContain(GUIDED_INTAKE_SCOPE_CONFIRMATION_BLOCKER);
  });

  it("applies example template prefill only once across hook remounts", async () => {
    const first = renderHook(() =>
      useGuidedIntakeBriefForm({
        exampleTemplate,
        isCreateArchitectureFlow: false,
      }),
    );

    await waitFor(() => {
      expect(first.result.current.freeTextIntent).toBe(exampleTemplate.briefText);
    });

    act(() => {
      first.result.current.setFreeTextIntent("Operator-edited intent");
      first.result.current.setBusinessOutcome("Operator-edited outcome");
      first.result.current.setSystemName("Operator-edited system");
    });

    first.unmount();

    const second = renderHook(() =>
      useGuidedIntakeBriefForm({
        exampleTemplate,
        isCreateArchitectureFlow: false,
      }),
    );

    await waitFor(() => {
      expect(second.result.current.freeTextIntent).toBe("");
    });

    expect(second.result.current.businessOutcome).toBe("");
    expect(second.result.current.systemName).toBe("");
  });

  it("prefills guided intake from a starter preset", async () => {
    scopeGateSearchParamsHarness.state.query = "path=guided-intake&preset=starter-api-platform-b2b";

    const { result } = renderHook(() =>
      useGuidedIntakeBriefForm({
        exampleTemplate: null,
        isCreateArchitectureFlow: false,
        requiresSystemName: true,
      }),
    );

    await waitFor(() => {
      expect(result.current.systemName).toBe("PartnerApiPlatform");
    });

    expect(result.current.freeTextIntent).toContain("B2B API platform");
    expect(result.current.businessOutcome).toContain("API platform (B2B)");
  });
});
