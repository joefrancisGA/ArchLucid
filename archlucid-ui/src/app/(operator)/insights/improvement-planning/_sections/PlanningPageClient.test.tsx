import { render, screen, waitFor } from "@testing-library/react";
import { useSyncExternalStore, type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PLANNING_PATH } from "@/lib/planning-route";
import type { LearningPlanListItemResponse, LearningSummaryResponse, LearningThemeResponse } from "@/types/learning";

import type { PlanningPageServerLoadResult } from "./load-planning-page-data";
import { PlanningPageClient } from "./PlanningPageClient";

vi.mock("./PlanningPageView", () => ({
  PlanningPageView: ({ model }: { model: { selectedThemeId: string | null } }) => (
    <div data-testid="planning-selected-theme-id">{model.selectedThemeId ?? ""}</div>
  ),
}));

const searchParamsState = vi.hoisted(() => ({ query: "" }));
const routerReplace = vi.hoisted(() => vi.fn());
const searchParamsListeners = vi.hoisted(() => new Set<() => void>());

function notifySearchParamsListeners(): void {
  for (const listener of searchParamsListeners) {
    listener();
  }
}

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
      replace: (href: string) => {
        routerReplace(href);
        const url = new URL(href, "http://localhost");
        searchParamsState.query = url.search.startsWith("?") ? url.search.slice(1) : url.search;
        notifySearchParamsListeners();
      },
      back: vi.fn(),
      refresh: vi.fn(),
    }),
    usePathname: () => PLANNING_PATH,
    useSearchParams: () => new URLSearchParams(searchParamsState.query),
  };
});

function SearchParamsHost({ children }: { readonly children: ReactNode }): ReactElement {
  useSyncExternalStore(
    (listener) => {
      searchParamsListeners.add(listener);

      return () => {
        searchParamsListeners.delete(listener);
      };
    },
    () => searchParamsState.query,
    () => "",
  );

  return <>{children}</>;
}

const themeRow: LearningThemeResponse = {
  themeId: "theme-present",
  themeKey: "pattern:test",
  title: "Present theme",
  summary: "Summary",
  affectedArtifactTypeOrWorkflowArea: "Review",
  severityBand: "Medium",
  evidenceSignalCount: 1,
  distinctRunCount: 1,
  derivationRuleVersion: "v1",
  status: "Active",
  createdUtc: "2026-01-01T00:00:00Z",
};

const summary: LearningSummaryResponse = {
  generatedUtc: "2026-01-01T00:00:00Z",
  themeCount: 1,
  planCount: 0,
  totalThemeEvidenceSignals: 1,
  totalLinkedSignalsAcrossPlans: 0,
};

const loaded: PlanningPageServerLoadResult = {
  kind: "data",
  summary,
  themes: [themeRow],
  plans: [] as LearningPlanListItemResponse[],
  generatedUtc: "2026-01-01T00:00:00Z",
  usedPlanningDemoFallback: false,
  failure: null,
};

describe("PlanningPageClient", () => {
  beforeEach(() => {
    searchParamsState.query = "";
    routerReplace.mockClear();
  });

  it("clears stale theme from the URL when the theme is missing from loaded themes", async () => {
    searchParamsState.query = "theme=theme-missing";

    render(
      <SearchParamsHost>
        <PlanningPageClient loaded={loaded} />
      </SearchParamsHost>,
    );

    await waitFor(() => {
      expect(routerReplace).toHaveBeenCalledWith(PLANNING_PATH);
    });

    expect(screen.getByTestId("planning-selected-theme-id")).toHaveTextContent("");
  });
});
