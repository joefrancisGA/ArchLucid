import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CORE_PILOT_FIRST_REVIEW_HEADING,
  CORE_PILOT_FIRST_REVIEW_MINIMIZED_BUTTON,
  CORE_PILOT_WORKFLOW_SUMMARY_LINE,
} from "@/lib/core-pilot-first-review-copy";
import { CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";
import { getShowcaseManifestHref, getShowcaseWalkthroughHref } from "@/lib/buyer/buyer-safe-review-navigation";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

import { OperatorFirstRunWorkflowPanel } from "@/components/operator/OperatorFirstRunWorkflowPanel";

/** Avoid demo fallback rows flipping the panel to "explore completed output" mid-test (async merge). */
vi.mock("@/lib/operator/operator-run-picker-client", () => ({
  loadProjectRunsMergedWithDemoFallback: vi.fn(async () => ({ items: [], loadError: false })),
}));

vi.mock("@/lib/query/operator-query-persist-client", () => ({
  setupOperatorQueryClientPersistence: () => {},
}));

vi.mock("@/lib/core-pilot-commit-context", async (importOriginal) => {
  const { createCorePilotCommitContextModuleMock } = await import("@/testing/core-pilot-commit-context.mock");

  return createCorePilotCommitContextModuleMock(importOriginal);
});

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");

  return {
    ...actual,
    fetchCorePilotTeamChecklist: vi.fn(async () => []),
    putCorePilotTeamChecklistStep: vi.fn(async () => {}),
  };
});

describe("OperatorFirstRunWorkflowPanel", () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetOperatorQueryClientForTests();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("after hydrate shows workflow heading, summary, and checklist anchor", async () => {
    renderWithOperatorQuery(<OperatorFirstRunWorkflowPanel />);

    const heading = await screen.findByRole("heading", { name: CORE_PILOT_FIRST_REVIEW_HEADING });
    expect(heading).toBeInTheDocument();

    const section = heading.closest("section");
    expect(section).toHaveTextContent(CORE_PILOT_WORKFLOW_SUMMARY_LINE);
    expect(section).toHaveTextContent("review");
    expect(screen.getByText("First session coaching")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue checklist ↓" })).toHaveAttribute(
      "href",
      "#core-pilot-checklist-anchor",
    );
    expect(screen.getByText(`0 of ${CORE_PILOT_STEPS.length} steps complete`)).toBeInTheDocument();
    expect(screen.getByTestId("first-review-90min-help-link")).toHaveAttribute("href", "/help/first-architecture-review");
  });

  it("hide guide persists and show restores panel", async () => {
    renderWithOperatorQuery(<OperatorFirstRunWorkflowPanel />);

    await screen.findByRole("heading", { name: CORE_PILOT_FIRST_REVIEW_HEADING });

    fireEvent.click(screen.getByRole("button", { name: "Hide" }));

    expect(screen.queryByRole("heading", { name: CORE_PILOT_FIRST_REVIEW_HEADING })).not.toBeInTheDocument();
    expect(localStorage.getItem("archlucid_operator_workflow_guide_v1")).toBe("1");

    fireEvent.click(screen.getByRole("button", { name: CORE_PILOT_FIRST_REVIEW_MINIMIZED_BUTTON }));

    expect(screen.getByRole("heading", { name: CORE_PILOT_FIRST_REVIEW_HEADING })).toBeInTheDocument();
    expect(localStorage.getItem("archlucid_operator_workflow_guide_v1")).toBeNull();
  });

  it("exploreCompletedOutput lists manifest link before review detail and walkthrough", async () => {
    renderWithOperatorQuery(<OperatorFirstRunWorkflowPanel exploreCompletedOutput />);

    expect(await screen.findByRole("heading", { name: "Sample review shortcuts" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View sealed record summary" })).toHaveAttribute(
      "href",
      getShowcaseManifestHref(),
    );
    expect(screen.getByRole("link", { name: "Open review detail" })).toHaveAttribute(
      "href",
      `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`,
    );
    expect(screen.getByRole("link", { name: "Read-only walkthrough" })).toHaveAttribute(
      "href",
      getShowcaseWalkthroughHref(),
    );
  });
});
