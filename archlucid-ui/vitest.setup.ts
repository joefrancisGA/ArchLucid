import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

import "@testing-library/jest-dom/vitest";

import { extendNextNavigationVitestMock } from "@/testing/next-navigation-vitest-mock";
import { emptyCorePilotCommitContext } from "@/testing/core-pilot-commit-context.mock";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/use-core-pilot-commit-presentation-context", () => ({
  useCorePilotCommitPresentationContext: () => ({
    hasCommittedManifest: false,
    latestCommittedRunId: null,
  }),
}));

vi.mock("@/hooks/use-core-pilot-commit-context-query", () => ({
  useCorePilotCommitContextQuery: () => ({
    isPending: false,
    isError: false,
    isFetching: false,
    isFetched: true,
    data: emptyCorePilotCommitContext,
  }),
}));

vi.mock("@/hooks/use-deferred-operator-shell-status-queries-enabled", () => ({
  useDeferredOperatorShellStatusQueriesEnabled: () => true,
  resetDeferredOperatorShellStatusQueriesForTests: () => {},
}));

vi.mock("@/components/shell/OperatorShellStatusQueryGate", () => ({
  OperatorShellStatusQueryGate: ({ children }: { children: React.ReactNode }) => children,
  useOperatorShellStatusConcernFetchEnabled: () => true,
}));

vi.mock("next/navigation", async (importOriginal) =>
  extendNextNavigationVitestMock(importOriginal),
);

process.env.NEXT_PUBLIC_OPERATOR_NAV_SHOW_PRE_RELEASE_ROUTES = "1";

/** Default UI is buyer-polished unless `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator`; pin full operator for tests. */
process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = "operator";

/** Keep unit tests on the non-demo path unless a test file explicitly stubs demo env (avoids hiding Operate controls). */
delete process.env.NEXT_PUBLIC_DEMO_MODE;
delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
delete process.env.NEXT_PUBLIC_UI_AUTHORITY_THEME;
delete process.env.NEXT_PUBLIC_UI_AUTHORITY_THEME_EVAL;

/** Radix Select uses pointer capture APIs not implemented in jsdom. */
if (typeof Element !== "undefined") {
  Element.prototype.hasPointerCapture = function () {
    return false;
  };
  Element.prototype.releasePointerCapture = function () {
    /* no-op */
  };
  Element.prototype.scrollIntoView = vi.fn();
}

/** jsdom does not implement ResizeObserver; operator shell tours and graph views observe layout. */
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe(): void {}

    unobserve(): void {}

    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
}

afterEach(() => {
  cleanup();
  resetOperatorQueryClientForTests();
});
