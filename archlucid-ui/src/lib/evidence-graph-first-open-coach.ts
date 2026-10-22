/**
 * TB-2244 — Evidence graph first-open coach.
 *
 * Plain teaching for first visit to `/insights/evidence-graph`: what the surface
 * is, when to use it, which modes exist, and when not to use it. Distinct from
 * the collapsed GraphEvidenceTrailGuidanceDisclosure and from ExplainThisView
 * (route-view-explanations intentionally returns null for this path).
 */

export const EVIDENCE_GRAPH_FIRST_OPEN_COACH_DISMISS_KEY =
  "archlucid_evidence_graph_first_open_coach_dismissed_v1" as const;

export type EvidenceGraphFirstOpenCoachSectionId = "what" | "when" | "modes" | "when-not";

export type EvidenceGraphFirstOpenCoachSection = {
  readonly id: EvidenceGraphFirstOpenCoachSectionId;
  readonly label: string;
  readonly body: string;
};

export type EvidenceGraphFirstOpenCoachModel = {
  readonly heading: string;
  readonly lead: string;
  readonly sections: readonly EvidenceGraphFirstOpenCoachSection[];
  readonly dismissLabel: string;
};

export const EVIDENCE_GRAPH_FIRST_OPEN_COACH_HEADING = "How the evidence graph works" as const;

export const EVIDENCE_GRAPH_FIRST_OPEN_COACH_LEAD =
  "The evidence graph shows how evidence connects to findings, decisions, approvals, and audit records for one completed architecture package review." as const;

export const EVIDENCE_GRAPH_FIRST_OPEN_COACH_SECTIONS: readonly EvidenceGraphFirstOpenCoachSection[] = [
  {
    id: "what",
    label: "What",
    body: "A visual map of the evidence trail for a single architecture package — not a list of packages and not a live inventory.",
  },
  {
    id: "when",
    label: "When",
    body: "Use it after a review is complete when you need to inspect how a finding, decision, or architecture element links to supporting evidence.",
  },
  {
    id: "modes",
    label: "Modes",
    body: "Evidence provenance follows finding lineage; Decision traceability focuses on one decision; Architecture context shows structural neighbors. Pick the mode that matches the question you are answering.",
  },
  {
    id: "when-not",
    label: "When not",
    body: "Do not use this to search across packages, ask review questions with citations, or configure integrations — those are separate jobs on other surfaces.",
  },
] as const;

export const EVIDENCE_GRAPH_FIRST_OPEN_COACH_DISMISS_LABEL = "Dismiss" as const;

/** Full first-open coach model (heading, lead, what/when/modes/when-not). */
export function buildEvidenceGraphFirstOpenCoach(): EvidenceGraphFirstOpenCoachModel {
  return {
    heading: EVIDENCE_GRAPH_FIRST_OPEN_COACH_HEADING,
    lead: EVIDENCE_GRAPH_FIRST_OPEN_COACH_LEAD,
    sections: EVIDENCE_GRAPH_FIRST_OPEN_COACH_SECTIONS,
    dismissLabel: EVIDENCE_GRAPH_FIRST_OPEN_COACH_DISMISS_LABEL,
  };
}

/** True when the operator has already dismissed the first-open coach. */
export function isEvidenceGraphFirstOpenCoachDismissed(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    return window.localStorage.getItem(EVIDENCE_GRAPH_FIRST_OPEN_COACH_DISMISS_KEY) === "1";
  } catch {
    return true;
  }
}

/** Persist dismiss so the coach does not reappear on later visits. */
export function dismissEvidenceGraphFirstOpenCoach(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(EVIDENCE_GRAPH_FIRST_OPEN_COACH_DISMISS_KEY, "1");
  } catch {
    /* private mode */
  }
}
