import type { OperatorHomeWorkspaceMetricsSnapshot } from "@/lib/operator/operator-home-workspace-metrics";
import {
  resolveOperatorHomeWorkspacePhase,
  type OperatorHomeWorkspacePhase,
  type OperatorHomeWorkspacePhaseSignals,
} from "@/lib/resolve-operator-home-workspace-phase";

export type OperatorHomeSectionId =
  | "recommended-next"
  | "metrics-strip"
  | "start-something"
  | "unfinished"
  | "hero"
  | "command-center"
  | "recent-reviews"
  | "buyer-chrome"
  | "below-fold"
  | "stickiness"
  | "sponsor-roi";

export type OperatorHomeSectionDescriptor = {
  readonly id: OperatorHomeSectionId;
  readonly testId: string;
};

export type ComposeOperatorHomeSectionsInput = {
  readonly phaseSignals: OperatorHomeWorkspacePhaseSignals;
  readonly buyerPolishedShell: boolean;
  readonly metrics: OperatorHomeWorkspaceMetricsSnapshot;
};

function buyerPolishedSections(phase: OperatorHomeWorkspacePhase): OperatorHomeSectionDescriptor[] {
  if (phase === "eval-empty" || phase === "eval-with-drafts") {
    return [
      { id: "hero", testId: "operator-home-hero-section" },
      { id: "recent-reviews", testId: "operator-home-recent-reviews" },
      { id: "below-fold", testId: "operator-home-below-fold" },
      { id: "sponsor-roi", testId: "operator-home-sponsor-roi" },
    ];
  }

  const sections: OperatorHomeSectionDescriptor[] = [
    { id: "recommended-next", testId: "operator-home-recommended-next" },
    { id: "metrics-strip", testId: "operator-home-metrics-strip" },
    { id: "unfinished", testId: "operator-home-unfinished-work" },
    { id: "start-something", testId: "operator-home-start-something" },
    { id: "recent-reviews", testId: "operator-home-recent-reviews" },
  ];

  if (phase === "operational") {
    sections.push({ id: "buyer-chrome", testId: "operator-home-orientation-top" });
  }

  sections.push({ id: "below-fold", testId: "operator-home-below-fold" });
  sections.push({ id: "sponsor-roi", testId: "operator-home-sponsor-roi" });

  return sections;
}

function operatorShellSections(phase: OperatorHomeWorkspacePhase): OperatorHomeSectionDescriptor[] {
  if (phase === "eval-empty" || phase === "eval-with-drafts") {
    return [
      { id: "hero", testId: "operator-home-hero-section" },
      { id: "recent-reviews", testId: "operator-home-recent-reviews" },
      { id: "below-fold", testId: "operator-home-below-fold" },
      { id: "sponsor-roi", testId: "operator-home-sponsor-roi" },
    ];
  }

  const sections: OperatorHomeSectionDescriptor[] = [
    { id: "recommended-next", testId: "operator-home-recommended-next" },
    { id: "metrics-strip", testId: "operator-home-metrics-strip" },
    { id: "unfinished", testId: "operator-home-unfinished-work" },
    { id: "start-something", testId: "operator-home-start-something" },
    { id: "recent-reviews", testId: "operator-home-recent-reviews" },
    { id: "below-fold", testId: "operator-home-below-fold" },
    { id: "sponsor-roi", testId: "operator-home-sponsor-roi" },
  ];

  return sections;
}

/** TB-2368 — single layout matrix for buyer-polished and operator home shells. */
export function composeOperatorHomeSections(
  input: ComposeOperatorHomeSectionsInput,
): readonly OperatorHomeSectionDescriptor[] {
  const phase = resolveOperatorHomeWorkspacePhase(input.phaseSignals);

  if (input.buyerPolishedShell) {
    return buyerPolishedSections(phase);
  }

  return operatorShellSections(phase);
}

export function operatorHomeSectionDescriptor(
  sections: readonly OperatorHomeSectionDescriptor[],
  id: OperatorHomeSectionId,
): OperatorHomeSectionDescriptor | undefined {
  return sections.find((section) => section.id === id);
}
