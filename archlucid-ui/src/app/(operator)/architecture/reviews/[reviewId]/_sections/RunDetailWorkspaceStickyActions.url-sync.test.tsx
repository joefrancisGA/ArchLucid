import { render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RUN_DETAIL_STICKY_ACTIONS_TECHNICAL_DETAIL_OPEN_PARAM } from "@/lib/reviews/run-detail-sticky-actions-technical-detail-disclosure-url";

import { RunDetailWorkspaceStickyActions } from "./RunDetailWorkspaceStickyActions";

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

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-abc",
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("./ReviewPackagePrimaryAction", () => ({
  ReviewPackagePrimaryAction: ({ action }: { action: { label: string } }) => (
    <button type="button">{action.label}</button>
  ),
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "reviewTab=overview",
  );

  return createElement("div", null, children);
}

const stickyProps = {
  runId: "run-abc",
  primaryAction: {
    kind: "review-findings" as const,
    label: "Disposition blocking findings",
    href: "/architecture/reviews/run-abc?reviewTab=findings",
  },
  primaryActionContext: {
    runId: "run-abc",
    manifestId: "manifest-1",
    hasCommitBlockingFailures: false,
    blockingFindingCount: 1,
    buyerPolishedArtifactTable: true,
    operatorGovernanceDecision: null,
    manifestStatus: "Finalized",
    runCompleted: true,
  },
  commitBlockedReason: null,
  commitBlockedTechnicalDetail: "Coverage gap on subnet peering rule.",
  showProgressTracker: false,
  manifestId: "manifest-1",
};

describe("RunDetailWorkspaceStickyActions URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");
  });

  it("follows runDetailStickyActionsTechnicalDetailOpen query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailWorkspaceStickyActions {...stickyProps} />
      </SearchParamsRerenderHost>,
    );

    const technicalDetails = () => screen.getByText("Technical detail").closest("details");
    expect(technicalDetails()).not.toHaveAttribute("open");

    searchParamsHarness.applyQuery(
      `reviewTab=overview&${RUN_DETAIL_STICKY_ACTIONS_TECHNICAL_DETAIL_OPEN_PARAM}=1`,
    );
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-abc?reviewTab=overview&${RUN_DETAIL_STICKY_ACTIONS_TECHNICAL_DETAIL_OPEN_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailWorkspaceStickyActions {...stickyProps} />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(technicalDetails()).toHaveAttribute("open");
    });
  });
});
