import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FINDING_INSPECT_EVIDENCE_CITATION_ARTIFACT_ID_PARAM } from "@/lib/findings/finding-inspect-evidence-citation-disclosure-url";

import { FindingInspectEvidenceSection } from "./FindingInspectEvidenceSection";

vi.mock("@/components/findings/FindingInspectDiagramCitationPreviewDialog", () => ({
  FindingInspectDiagramCitationPreviewDialog: () => null,
}));

vi.mock("@/lib/resolve-production-eval-chrome-from-storage", () => ({
  resolveProductionEvalChromeFromStorage: () => true,
}));

vi.mock("./FindingInspectPolicyRuleCallout", () => ({
  FindingInspectPolicyRuleCallout: () => null,
}));

const searchParamsHarness = vi.hoisted(() => {
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
    applyQuery(query: string): void {
      state.query = query;

      for (const listener of listeners) {
        listener();
      }
    },
    reset(): void {
      state.query = "";
    },
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-1/findings/finding-1",
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
  useRouter: () => ({ replace: vi.fn() }),
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

describe("FindingInspectEvidenceSection URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-1/findings/finding-1");
  });

  it("follows findingInspectEvidenceCitationArtifactId query changes without a popstate event", async () => {
    const renderSection = () => (
      <SearchParamsRerenderHost>
        <FindingInspectEvidenceSection
          runId="run-1"
          demoFillGaps={false}
          reviewContextHref="/architecture/reviews/run-1"
          reviewContextLabel="Open review"
          evidence={[
            {
              artifactId: "diagram-1",
              lineRange: "12-14",
              excerpt: "Public ingress on port 443",
            },
          ]}
        />
      </SearchParamsRerenderHost>
    );

    const { rerender } = render(renderSection());

    const details = () => screen.getByText("View technical citation").closest("details") as HTMLDetailsElement;
    expect(details()).not.toHaveAttribute("open");

    act(() => {
      searchParamsHarness.applyQuery(`${FINDING_INSPECT_EVIDENCE_CITATION_ARTIFACT_ID_PARAM}=diagram-1`);
      window.history.replaceState(
        {},
        "",
        `/architecture/reviews/run-1/findings/finding-1?${FINDING_INSPECT_EVIDENCE_CITATION_ARTIFACT_ID_PARAM}=diagram-1`,
      );
    });
    rerender(renderSection());

    await waitFor(() => {
      expect(details()).toHaveAttribute("open");
    });
  });

  it("writes evidence citation disclosure from useSearchParams when window.location.search lags after soft navigation", async () => {
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-1/findings/finding-1?reviewTab=findings&q=stale-payment`,
    );

    const renderSection = () => (
      <SearchParamsRerenderHost>
        <FindingInspectEvidenceSection
          runId="run-1"
          demoFillGaps={false}
          reviewContextHref="/architecture/reviews/run-1"
          reviewContextLabel="Open review"
          evidence={[
            {
              artifactId: "diagram-1",
              lineRange: "12-14",
              excerpt: "Public ingress on port 443",
            },
          ]}
        />
      </SearchParamsRerenderHost>
    );

    const { rerender } = render(renderSection());

    searchParamsHarness.applyQuery("");
    rerender(renderSection());

    fireEvent.click(screen.getByText("View technical citation"));

    await waitFor(() => {
      expect(window.location.pathname + window.location.search).toBe(
        `/architecture/reviews/run-1/findings/finding-1?${FINDING_INSPECT_EVIDENCE_CITATION_ARTIFACT_ID_PARAM}=diagram-1`,
      );
    });
  });
});
