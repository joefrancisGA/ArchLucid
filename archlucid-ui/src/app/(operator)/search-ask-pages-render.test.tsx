import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AskPage from "@/app/(operator)/insights/ask-review-questions/page";
import SearchPage from "@/app/(operator)/insights/search-review-evidence/page";
import { SEARCH_QUERY_FIELD_LABEL } from "@/app/(operator)/insights/search-review-evidence/_sections/search-page-copy";
import { EVIDENCE_TRAIL_SEARCH } from "@/lib/search-surface-disambiguation";
import { renderWithOperatorQuery } from "@/testing/operator-query-test-helpers";

const navigationMocks = vi.hoisted(() => ({
  searchParams: new URLSearchParams("runId=demo-run-1"),
  pathname: "/insights/search-review-evidence",
}));

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal, {
    useSearchParams: () => navigationMocks.searchParams,
    usePathname: () => navigationMocks.pathname,
  });
});

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => false,
    isNextPublicDemoMode: () => false,
  };
});

vi.mock("@/lib/operator/operator-static-demo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/operator/operator-static-demo")>();

  return {
    ...actual,
    isStaticDemoPayloadFallbackEnabled: () => false,
  };
});

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/conversation-api", () => ({
  askArchLucid: vi.fn(),
  getConversationMessages: vi.fn().mockResolvedValue([]),
  listConversationThreads: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/operator/operator-run-picker-client", () => ({
  loadProjectRunsMergedWithDemoFallback: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/hooks/useAskReviewAvailability", () => ({
  useAskReviewAvailability: () => ({
    loading: false,
    hasSelectableReviews: true,
  }),
}));

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({
    activeRunId: "demo-run-1",
  }),
}));

describe("SearchPage (operator shell)", () => {
  beforeEach(() => {
    navigationMocks.searchParams = new URLSearchParams("runId=demo-run-1");
    navigationMocks.pathname = "/insights/search-review-evidence";
  });

  it("renders heading, query field, and search control", async () => {
    const page = await SearchPage();
    render(page);

    expect(screen.getByRole("heading", { name: EVIDENCE_TRAIL_SEARCH.scopedTitle })).toBeInTheDocument();
    // TB-2196 renamed the query field to "Evidence query" so it cannot read like header Find a page.
    expect(screen.getByLabelText(SEARCH_QUERY_FIELD_LABEL)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^search$/i })).toBeInTheDocument();
  });
});

describe("AskPage (operator shell)", () => {
  beforeEach(() => {
    navigationMocks.searchParams = new URLSearchParams("runId=demo-run-1");
    navigationMocks.pathname = "/insights/ask-review-questions";
  });

  it("renders heading, question field, and ask control", async () => {
    const page = await AskPage();
    renderWithOperatorQuery(page);

    expect(screen.getByRole("heading", { name: /ask review questions/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /^question$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^ask$/i })).toBeInTheDocument();
  });
});
