import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BUYER_MANIFEST_DELIVERABLES_HEADING } from "@/lib/buyer/buyer-polish-copy";
import { RUN_DELIVERABLES_OPEN_PARAM } from "@/lib/runs/run-detail-deliverables-disclosure-url";

import { RunDetailArtifactsExportsSection } from "./RunDetailArtifactsExportsSection";

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

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-abc",
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/ArtifactListTable", () => ({ ArtifactListTable: () => null }));
vi.mock("@/components/BuyerDeliverablesArtifactTabs", () => ({ BuyerDeliverablesArtifactTabs: () => null }));
vi.mock("@/components/GoldenManifestExportMenu", () => ({ GoldenManifestExportMenu: () => null }));
vi.mock("./RunDetailExportRecordCompareCallout", () => ({ RunDetailExportRecordCompareCallout: () => null }));
vi.mock("./RunDetailExportRecordStatusCallout", () => ({ RunDetailExportRecordStatusCallout: () => null }));
vi.mock("./RunDetailExportHistoryCallout", () => ({ RunDetailExportHistoryCallout: () => null }));
vi.mock("./RunDetailExportRecordComparisonHistoryCallout", () => ({
  RunDetailExportRecordComparisonHistoryCallout: () => null,
}));
vi.mock("./RunDetailAssuranceGuardCallouts", () => ({ RunDetailAssuranceGuardCallouts: () => null }));
vi.mock("@/components/runs/RunDetailExportBlobPushPanel", () => ({ RunDetailExportBlobPushPanel: () => null }));
vi.mock("@/components/exports/SponsorExportSendHonestyStrip", () => ({ SponsorExportSendHonestyStrip: () => null }));
vi.mock("@/components/operator/OperatorSectionRetryButton", () => ({ OperatorSectionRetryButton: () => null }));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "reviewTab=review-package",
  );

  return createElement("div", null, children);
}

const baseProps = {
  manifestId: "manifest-1",
  runId: "run-abc",
  buyerPolishedArtifactTable: true,
  artifacts: [],
  artifactsFailure: null,
  artifactsMalformed: null,
  goldenManifestJsonForExport: {},
  manifestSummaryForUi: null,
  manifestSummary: null,
  trustEvidenceCard: null,
};

describe("RunDetailArtifactsExportsSection URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=review-package");
  });

  it("follows runDeliverablesOpen query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailArtifactsExportsSection {...baseProps} />
      </SearchParamsRerenderHost>,
    );

    const deliverablesDetails = () => screen.getByText(BUYER_MANIFEST_DELIVERABLES_HEADING).closest("details");
    expect(deliverablesDetails()).not.toHaveAttribute("open");

    searchParamsHarness.applyQuery(`reviewTab=review-package&${RUN_DELIVERABLES_OPEN_PARAM}=1`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-abc?reviewTab=review-package&${RUN_DELIVERABLES_OPEN_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailArtifactsExportsSection {...baseProps} />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(deliverablesDetails()).toHaveAttribute("open");
    });
  });

  it("writes deliverables disclosure from useSearchParams when window.location.search lags after soft navigation", async () => {
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?reviewTab=review-package&q=stale-payment",
    );

    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailArtifactsExportsSection {...baseProps} />
      </SearchParamsRerenderHost>,
    );

    searchParamsHarness.applyQuery("reviewTab=review-package");
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailArtifactsExportsSection {...baseProps} />
      </SearchParamsRerenderHost>,
    );

    fireEvent.click(screen.getByText(BUYER_MANIFEST_DELIVERABLES_HEADING));

    await waitFor(() => {
      expect(window.location.pathname + window.location.search).toBe(
        `/architecture/reviews/run-abc?reviewTab=review-package&${RUN_DELIVERABLES_OPEN_PARAM}=1`,
      );
    });
  });
});
