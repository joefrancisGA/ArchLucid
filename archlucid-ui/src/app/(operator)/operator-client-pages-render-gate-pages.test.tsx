import "./operator-client-pages-render-gate.setup.tsx";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AskPage from "./insights/ask-review-questions/page";
import EvolutionReviewPage from "./insights/impact-preview/page";
import GovernanceResolutionPage from "./governance/standards-and-rules/page";
import OnboardingPage from "./architecture/first-review-guide/page";
import PolicyPacksPage from "./governance/policy-packs/page";
import PlanningPage from "./insights/improvement-planning/page";
import ProductLearningPage from "./internal/product-learning/page";
import RecommendationLearningOpsPage from "./internal/recommendation-learning/page";
import SearchPage from "./insights/search-review-evidence/page";
import { renderWithOperatorQuery } from "@/testing/operator-query-test-helpers";

const navigationMocks = vi.hoisted(() => ({
  searchParams: new URLSearchParams("runId=demo-run-1"),
  pathname: "/insights/ask-review-questions",
}));

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal, {
    useSearchParams: () => navigationMocks.searchParams,
    usePathname: () => navigationMocks.pathname,
  });
});

vi.mock("@/lib/conversation-api", () => ({
  askArchLucid: vi.fn(),
  getConversationMessages: vi.fn().mockResolvedValue([]),
  listConversationThreads: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/operator/operator-run-picker-client", () => ({
  loadProjectRunsMergedWithDemoFallback: vi.fn().mockResolvedValue([]),
}));

describe("operator client pages — render gate (async pages)", () => {
  it("RecommendationLearningOpsPage renders primary heading", async () => {
    const page = await RecommendationLearningOpsPage();
    render(page);
    expect(screen.getByRole("heading", { level: 1, name: "Recommendation learning" })).toBeInTheDocument();
  });

  it("ProductLearningPage renders primary heading", async () => {
    const page = await ProductLearningPage();
    render(page);
    expect(screen.getByRole("heading", { level: 2, name: "Review feedback" })).toBeInTheDocument();
  });

  it("PlanningPage renders primary heading", async () => {
    const page = await PlanningPage();
    render(page);
    expect(screen.getByRole("heading", { level: 2, name: "Improvement planning" })).toBeInTheDocument();
  });

  it("PlanningPage does not render internal codename '59R' in user-visible output", async () => {
    const page = await PlanningPage();
    render(page);
    expect(document.body.textContent).not.toContain("59R");
  });

  it("EvolutionReviewPage renders primary heading", async () => {
    const page = await EvolutionReviewPage();
    render(page);
    expect(screen.getByRole("heading", { level: 2, name: "Impact preview" })).toBeInTheDocument();
  });

  it("EvolutionReviewPage does not render internal codename '60R' in user-visible output", async () => {
    const page = await EvolutionReviewPage();
    render(page);
    expect(document.body.textContent).not.toContain("60R");
  });

  it("PolicyPacksPage renders primary heading", async () => {
    const page = await PolicyPacksPage();
    render(page);
    expect(screen.getByRole("heading", { level: 2, name: "Policy packs" })).toBeInTheDocument();
  });

  it("GovernanceResolutionPage renders primary heading", async () => {
    const page = await GovernanceResolutionPage();
    render(page);
    expect(screen.getByRole("heading", { level: 2, name: "Standards & rules" })).toBeInTheDocument();
  });

  it("SearchPage renders primary heading without heading-level contextual help", async () => {
    const page = await SearchPage();
    render(page);
    expect(screen.getByRole("heading", { level: 2, name: "Search review evidence" })).toBeInTheDocument();
    expect(document.querySelector("[data-help-tooltip-trigger]")).toBeNull();
  });

  it("AskPage renders primary heading without heading-level contextual help", async () => {
    navigationMocks.searchParams = new URLSearchParams("runId=demo-run-1");
    navigationMocks.pathname = "/insights/ask-review-questions";

    const page = await AskPage();
    renderWithOperatorQuery(page);
    expect(screen.getByRole("heading", { level: 1, name: /ask review questions/i })).toBeInTheDocument();
    expect(document.querySelector("[data-help-tooltip-trigger]")).toBeNull();
  });

  it("OnboardingPage renders primary heading", async () => {
    const page = await OnboardingPage({ searchParams: Promise.resolve({}) });
    render(page);
    expect(screen.getByRole("heading", { level: 1, name: "First review guide" })).toBeInTheDocument();
  });
});
