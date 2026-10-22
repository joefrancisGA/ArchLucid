import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { EvidenceGraphFirstOpenCoach } from "@/components/EvidenceGraphFirstOpenCoach";
import {
  EVIDENCE_GRAPH_FIRST_OPEN_COACH_DISMISS_KEY,
  EVIDENCE_GRAPH_FIRST_OPEN_COACH_HEADING,
  EVIDENCE_GRAPH_FIRST_OPEN_COACH_LEAD,
} from "@/lib/evidence-graph-first-open-coach";

describe("EvidenceGraphFirstOpenCoach (TB-2244)", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("renders what/when/modes/when-not when not dismissed", async () => {
    render(<EvidenceGraphFirstOpenCoach />);

    await waitFor(() => {
      expect(screen.getByTestId("evidence-graph-first-open-coach")).toBeInTheDocument();
    });

    expect(screen.getByText(EVIDENCE_GRAPH_FIRST_OPEN_COACH_HEADING)).toBeInTheDocument();
    expect(screen.getByText(EVIDENCE_GRAPH_FIRST_OPEN_COACH_LEAD)).toBeInTheDocument();
    expect(screen.getByTestId("evidence-graph-first-open-coach-section-what")).toBeInTheDocument();
    expect(screen.getByTestId("evidence-graph-first-open-coach-section-when")).toBeInTheDocument();
    expect(screen.getByTestId("evidence-graph-first-open-coach-section-modes")).toBeInTheDocument();
    expect(screen.getByTestId("evidence-graph-first-open-coach-section-when-not")).toBeInTheDocument();
  });

  it("dismisses and persists to localStorage", async () => {
    render(<EvidenceGraphFirstOpenCoach />);

    await waitFor(() => {
      expect(screen.getByTestId("evidence-graph-first-open-coach-dismiss")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("evidence-graph-first-open-coach-dismiss"));

    expect(screen.queryByTestId("evidence-graph-first-open-coach")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(EVIDENCE_GRAPH_FIRST_OPEN_COACH_DISMISS_KEY)).toBe("1");
  });

  it("does not render when already dismissed", async () => {
    window.localStorage.setItem(EVIDENCE_GRAPH_FIRST_OPEN_COACH_DISMISS_KEY, "1");

    render(<EvidenceGraphFirstOpenCoach />);

    await waitFor(() => {
      expect(screen.queryByTestId("evidence-graph-first-open-coach")).not.toBeInTheDocument();
    });
  });
});
