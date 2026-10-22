import { render, screen } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ManifestSummary } from "@/types/authority";
import { REVIEW_PACKAGE_SPONSOR_HANDOFF_MORE_EXPORTS_OPEN_PARAM } from "@/lib/reviews/review-package-sponsor-handoff-more-exports-disclosure-url";

import { ReviewPackageSponsorHandoffStrip } from "./ReviewPackageSponsorHandoffStrip";

const committedManifestSummary = {
  manifestId: "manifest-1",
  status: "Committed",
} as ManifestSummary;

const searchParamsHarness = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const state = { query: "reviewTab=review-package" };

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
      state.query = "reviewTab=review-package";
    },
  };
});

vi.mock("@/components/GoldenManifestExportMenu", () => ({
  GoldenManifestExportMenu: () => <div data-testid="review-package-sponsor-handoff-markdown-download" />,
}));

vi.mock("@/components/SponsorRoiBaselineGateNotice", () => ({
  SponsorRoiBaselineGateNotice: () => null,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({ callerAuthorityRank: 900 }),
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
    () => "reviewTab=review-package",
  );

  return createElement("div", null, children);
}

const baseProps = {
  runId: "run-abc",
  manifestId: "manifest-1",
  goldenManifestJsonForExport: {},
  manifestSummary: committedManifestSummary,
  trustEvidenceCard: null,
  usedStaticDemoRun: false,
  showExtendedSponsorBriefing: true,
  lowExtractionConfidenceCount: 0,
};

describe("ReviewPackageSponsorHandoffStrip URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=review-package");
  });

  it("follows reviewPackageSponsorHandoffMoreExportsOpen query changes without a popstate event", () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <ReviewPackageSponsorHandoffStrip {...baseProps} />
      </SearchParamsRerenderHost>,
    );

    const details = () => screen.getByTestId("review-package-sponsor-handoff-more-exports");

    expect(details()).not.toHaveAttribute("open");

    searchParamsHarness.applyQuery(
      `reviewTab=review-package&${REVIEW_PACKAGE_SPONSOR_HANDOFF_MORE_EXPORTS_OPEN_PARAM}=1`,
    );
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-abc?reviewTab=review-package&${REVIEW_PACKAGE_SPONSOR_HANDOFF_MORE_EXPORTS_OPEN_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <ReviewPackageSponsorHandoffStrip {...baseProps} />
      </SearchParamsRerenderHost>,
    );

    expect(details()).toHaveAttribute("open");
    expect(screen.getByTestId("review-package-sponsor-handoff-markdown-download")).toBeInTheDocument();
  });
});
