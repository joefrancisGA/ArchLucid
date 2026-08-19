import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AskPage from "@/app/(operator)/insights/ask-review-questions/page";
import SearchPage from "@/app/(operator)/insights/search-review-evidence/page";
import { SEARCH_QUERY_FIELD_LABEL } from "@/app/(operator)/insights/search-review-evidence/_sections/search-page-copy";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => "/",
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
  it("renders heading, query field, and search control", async () => {
    const page = await SearchPage();
    render(page);

    expect(screen.getByRole("heading", { name: /search review evidence/i })).toBeInTheDocument();
    // TB-2196 renamed the query field to "Evidence query" so it cannot read like header Find a page.
    expect(screen.getByLabelText(SEARCH_QUERY_FIELD_LABEL)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^search$/i })).toBeInTheDocument();
  });
});

describe("AskPage (operator shell)", () => {
  it("renders heading, question field, and ask control", async () => {
    const page = await AskPage();
    render(page);

    expect(screen.getByRole("heading", { name: /evidence-backed review questions/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/your question/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^ask$/i })).toBeInTheDocument();
  });
});
