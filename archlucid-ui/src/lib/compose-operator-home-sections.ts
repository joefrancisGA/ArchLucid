import type { OperatorAttentionKindId } from "@/lib/operator/operator-attention-taxonomy";
import type { OperatorHomeWorkspaceMetricsSnapshot } from "@/lib/operator/operator-home-workspace-metrics";
import {
  resolveOperatorHomeWorkspacePhase,
  type OperatorHomeWorkspacePhase,
  type OperatorHomeWorkspacePhaseSignals,
} from "@/lib/resolve-operator-home-workspace-phase";

export type OperatorHomeSectionId =
  | "metrics-strip"
  | "attention-taxonomy"
  | "in-flight"
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
  /** When set on attention-taxonomy, hides chips already surfaced elsewhere on home. */
  readonly suppressAttentionKinds?: readonly OperatorAttentionKindId[];
};

export type ComposeOperatorHomeSectionsInput = {
  readonly phaseSignals: OperatorHomeWorkspacePhaseSignals;
  readonly buyerPolishedShell: boolean;
  readonly metrics: OperatorHomeWorkspaceMetricsSnapshot;
  readonly workingMode?: boolean;
};

function shouldShowHomeMetricsStrip(metrics: OperatorHomeWorkspaceMetricsSnapshot): boolean {
  return metrics.reviewPackagesCommitted > 0;
}

function attentionTaxonomySection(
  suppressAttentionKinds?: readonly OperatorAttentionKindId[],
): OperatorHomeSectionDescriptor {
  return {
    id: "attention-taxonomy",
    testId: "operator-home-attention-taxonomy",
    ...(suppressAttentionKinds !== undefined && suppressAttentionKinds.length > 0
      ? { suppressAttentionKinds }
      : {}),
  };
}

function metricsStripSection(): OperatorHomeSectionDescriptor {
  return { id: "metrics-strip", testId: "operator-home-metrics-strip" };
}

function earlyPhaseSections(phase: OperatorHomeWorkspacePhase): OperatorHomeSectionDescriptor[] {
  if (phase === "eval-empty") {
    return [{ id: "hero", testId: "operator-home-hero-section" }];
  }

  return [
    { id: "hero", testId: "operator-home-hero-section" },
    { id: "recent-reviews", testId: "operator-home-recent-reviews" },
    { id: "below-fold", testId: "operator-home-below-fold" },
    { id: "sponsor-roi", testId: "operator-home-sponsor-roi" },
  ];
}

function buyerPolishedSections(
  phase: OperatorHomeWorkspacePhase,
  metrics: OperatorHomeWorkspaceMetricsSnapshot,
): OperatorHomeSectionDescriptor[] {
  if (phase === "eval-empty" || phase === "eval-with-drafts") {
    return earlyPhaseSections(phase);
  }

  const sections: OperatorHomeSectionDescriptor[] = [
    ...(shouldShowHomeMetricsStrip(metrics) ? [metricsStripSection()] : []),
    attentionTaxonomySection(["unfinished-work"]),
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

function operatorShellSections(
  phase: OperatorHomeWorkspacePhase,
  metrics: OperatorHomeWorkspaceMetricsSnapshot,
): OperatorHomeSectionDescriptor[] {
  if (phase === "eval-empty" || phase === "eval-with-drafts") {
    return earlyPhaseSections(phase);
  }

  const sections: OperatorHomeSectionDescriptor[] = [
    ...(shouldShowHomeMetricsStrip(metrics) ? [metricsStripSection()] : []),
    attentionTaxonomySection(["unfinished-work"]),
    { id: "unfinished", testId: "operator-home-unfinished-work" },
    { id: "start-something", testId: "operator-home-start-something" },
    { id: "recent-reviews", testId: "operator-home-recent-reviews" },
    { id: "below-fold", testId: "operator-home-below-fold" },
    { id: "sponsor-roi", testId: "operator-home-sponsor-roi" },
  ];

  return sections;
}

function workingModeEarlyPhaseSections(phase: OperatorHomeWorkspacePhase): OperatorHomeSectionDescriptor[] {
  if (phase === "eval-empty") {
    return [
      { id: "in-flight", testId: "operator-home-in-flight-analysis" },
      { id: "unfinished", testId: "operator-home-unfinished-work" },
      { id: "start-something", testId: "operator-home-start-something" },
      { id: "recent-reviews", testId: "operator-home-recent-reviews" },
    ];
  }

  return [
    { id: "in-flight", testId: "operator-home-in-flight-analysis" },
    { id: "unfinished", testId: "operator-home-unfinished-work" },
    { id: "recent-reviews", testId: "operator-home-recent-reviews" },
    { id: "start-something", testId: "operator-home-start-something" },
  ];
}

function workingModeOperatorShellSections(
  phase: OperatorHomeWorkspacePhase,
  metrics: OperatorHomeWorkspaceMetricsSnapshot,
): OperatorHomeSectionDescriptor[] {
  if (phase === "eval-empty" || phase === "eval-with-drafts") {
    return workingModeEarlyPhaseSections(phase);
  }

  return [
    ...(shouldShowHomeMetricsStrip(metrics) ? [metricsStripSection()] : []),
    attentionTaxonomySection(["unfinished-work"]),
    { id: "in-flight", testId: "operator-home-in-flight-analysis" },
    { id: "unfinished", testId: "operator-home-unfinished-work" },
    { id: "recent-reviews", testId: "operator-home-recent-reviews" },
    { id: "start-something", testId: "operator-home-start-something" },
  ];
}

/** TB-2368 — single layout matrix for buyer-polished and operator home shells. */
export function composeOperatorHomeSections(
  input: ComposeOperatorHomeSectionsInput,
): readonly OperatorHomeSectionDescriptor[] {
  const phase = resolveOperatorHomeWorkspacePhase(input.phaseSignals);

  if (input.buyerPolishedShell) {
    return buyerPolishedSections(phase, input.metrics);
  }

  if (input.workingMode === true) {
    return workingModeOperatorShellSections(phase, input.metrics);
  }

  return operatorShellSections(phase, input.metrics);
}

export function operatorHomeSectionDescriptor(
  sections: readonly OperatorHomeSectionDescriptor[],
  id: OperatorHomeSectionId,
): OperatorHomeSectionDescriptor | undefined {
  return sections.find((section) => section.id === id);
}
