import { render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RunDetail } from "@/types/authority";
import { RUN_AUDIT_IDENTIFIERS_OPEN_PARAM } from "@/lib/runs/run-audit-identifiers-disclosure-url";

import { RunDetailAuthorityChainSection } from "./RunDetailAuthorityChainSection";

const searchParamsHarness = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const state = { query: "reviewTab=overview" };

  return {
    state,
    subscribe(listener: () => void): () => void {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    applyQuery(query: string): void {
      state.query = query;

      for (const listener of listeners) {
        listener();
      }
    },
    reset(): void {
      state.query = "reviewTab=overview";
    },
  };
});

vi.mock("@/hooks/use-governance-mode", () => ({
  useGovernanceMode: () => ({
    vocabulary: {
      goldenManifestLabel: "Golden manifest",
      authorityChainLabel: "Authority chain",
    },
  }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-abc",
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "reviewTab=overview",
  );

  return createElement("div", null, children);
}

const minimalRun = {
  contextSnapshotId: "ctx-1",
  graphSnapshotId: "graph-1",
  findingsSnapshotId: "find-1",
  decisionTraceId: "trace-1",
  artifactBundleId: "bundle-1",
} as RunDetail["run"];

describe("RunDetailAuthorityChainSection URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");
  });

  it("follows runAuditIdentifiersOpen query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailAuthorityChainSection run={minimalRun} manifestId="manifest-1" />
      </SearchParamsRerenderHost>,
    );

    const auditDetails = () => screen.getByText("Audit identifiers").closest("details");
    expect(auditDetails()).not.toHaveAttribute("open");

    searchParamsHarness.applyQuery(`reviewTab=overview&${RUN_AUDIT_IDENTIFIERS_OPEN_PARAM}=1`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-abc?reviewTab=overview&${RUN_AUDIT_IDENTIFIERS_OPEN_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailAuthorityChainSection run={minimalRun} manifestId="manifest-1" />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(auditDetails()).toHaveAttribute("open");
    });
  });
});
