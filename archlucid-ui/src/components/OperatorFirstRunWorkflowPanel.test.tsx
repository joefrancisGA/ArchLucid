import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CORE_PILOT_FIRST_REVIEW_HEADING,
  CORE_PILOT_FIRST_REVIEW_MINIMIZED_BUTTON,
  CORE_PILOT_WORKFLOW_SUMMARY_LINE,
} from "@/lib/core-pilot-first-review-copy";
import { CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";

import { OperatorFirstRunWorkflowPanel } from "./OperatorFirstRunWorkflowPanel";

/** Avoid demo fallback rows flipping the panel to "explore completed output" mid-test (async merge). */
vi.mock("@/lib/operator-run-picker-client", () => ({
  loadProjectRunsMergedWithDemoFallback: vi.fn(async () => ({ items: [], loadError: false })),
}));

vi.mock("@/lib/core-pilot-commit-context", () => ({
  fetchCorePilotCommitContext: vi.fn(async () => ({
    hasCommittedManifest: false,
    latestRunId: null,
    firstCommittedRunId: null,
  })),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");

  return {
    ...actual,
    fetchCorePilotTeamChecklist: vi.fn(async () => []),
    putCorePilotTeamChecklistStep: vi.fn(async () => {}),
  };
});

describe("OperatorFirstRunWorkflowPanel", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("after hydrate shows workflow heading and primary wizard link", async () => {
    render(<OperatorFirstRunWorkflowPanel />);

    const heading = await screen.findByRole("heading", { name: CORE_PILOT_FIRST_REVIEW_HEADING });
    expect(heading).toBeInTheDocument();
    expect(await screen.findByTestId("core-pilot-milestone-rail")).toBeInTheDocument();

    const section = heading.closest("section");
    expect(section).toHaveTextContent(CORE_PILOT_WORKFLOW_SUMMARY_LINE);
    expect(section).toHaveTextContent("review package");
    expect(await screen.findByTestId("operator-first-run-wizard-step-1")).toBeInTheDocument();

    expect(screen.getByText("Start here")).toBeInTheDocument();

    const wizard = screen.getByRole("link", { name: CORE_PILOT_STEPS[0].primaryLabel });
    expect(wizard).toHaveAttribute("href", CORE_PILOT_STEPS[0].primaryHref);
  });

  it(
    "accordion toggles step body when clicking the step title",
    async () => {
      render(<OperatorFirstRunWorkflowPanel />);

      await screen.findByTestId("operator-first-run-wizard-step-1");

      expect(
        within(screen.getByTestId("operator-first-run-wizard-step-1")).getByRole("link", {
          name: CORE_PILOT_STEPS[0].primaryLabel,
        }),
      ).toBeVisible();

      fireEvent.click(
        screen.getByRole("button", {
          name: new RegExp(`Step 2 — ${CORE_PILOT_STEPS[1].title}`, "i"),
        }),
      );

      await waitFor(() => {
        expect(
          within(screen.getByTestId("operator-first-run-wizard-step-2")).getByRole("link", {
            name: CORE_PILOT_STEPS[1].primaryLabel,
          }),
        ).toBeVisible();
      });

      fireEvent.click(
        screen.getByRole("button", {
          name: new RegExp(`Step 3 — ${CORE_PILOT_STEPS[2].title}`, "i"),
        }),
      );

      await waitFor(() => {
        expect(
          within(screen.getByTestId("operator-first-run-wizard-step-3")).getByRole("link", {
            name: CORE_PILOT_STEPS[2].primaryLabel,
          }),
        ).toBeVisible();
      });

      expect(screen.getByRole("button", { name: /Step 4 — Finalize the review package/i })).toBeInTheDocument();
    },
    20_000,
  );

  it("hide guide persists and show restores panel", async () => {
    render(<OperatorFirstRunWorkflowPanel />);

    await screen.findByRole("heading", { name: CORE_PILOT_FIRST_REVIEW_HEADING });

    fireEvent.click(screen.getByRole("button", { name: "Hide" }));

    expect(screen.queryByRole("heading", { name: CORE_PILOT_FIRST_REVIEW_HEADING })).not.toBeInTheDocument();
    expect(localStorage.getItem("archlucid_operator_workflow_guide_v1")).toBe("1");

    fireEvent.click(screen.getByRole("button", { name: CORE_PILOT_FIRST_REVIEW_MINIMIZED_BUTTON }));

    expect(screen.getByRole("heading", { name: CORE_PILOT_FIRST_REVIEW_HEADING })).toBeInTheDocument();
    expect(localStorage.getItem("archlucid_operator_workflow_guide_v1")).toBeNull();
  });

  it("exploreCompletedOutput lists manifest link before review detail and walkthrough", async () => {
    render(<OperatorFirstRunWorkflowPanel exploreCompletedOutput />);

    expect(await screen.findByRole("heading", { name: "Explore completed output" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View manifest summary" })).toHaveAttribute(
      "href",
      "/reviews/claims-intake-modernization/manifest",
    );
    expect(screen.getByRole("link", { name: "Open review detail" })).toHaveAttribute(
      "href",
      "/reviews/claims-intake-modernization",
    );
    expect(screen.getByRole("link", { name: "Read-only walkthrough" })).toHaveAttribute(
      "href",
      "/showcase/claims-intake-modernization",
    );
  });
});
