import type { OperatorAttentionKindId } from "@/lib/operator/operator-attention-taxonomy";
import { OPERATOR_ATTENTION_KIND_IDS } from "@/lib/operator/operator-attention-taxonomy";
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
  /** Attention kind promoted by the metrics-strip lead card — omit matching chip below. */
  readonly promotedAttentionKind?: OperatorAttentionKindId | null;
  /** Partition counts from useOperatorAttentionSummary — drives attention-taxonomy omission. */
  readonly attentionCountsByKind?: Partial<Record<OperatorAttentionKindId, number>>;
};

const ATTENTION_KINDS_IN_METRICS_STRIP: readonly OperatorAttentionKindId[] = ["awaiting-approval"];

function mergeAttentionSuppressKinds(
  base: readonly OperatorAttentionKindId[],
  promotedAttentionKind: OperatorAttentionKindId | null | undefined,
): readonly OperatorAttentionKindId[] {
  if (promotedAttentionKind === null || promotedAttentionKind === undefined) {
    return base;
  }

  if (base.includes(promotedAttentionKind)) {
    return base;
  }

  return [...base, promotedAttentionKind];
}

function attentionKindsSurfacedInMetricsStrip(
  metrics: OperatorHomeWorkspaceMetricsSnapshot,
  attentionCountsByKind: Partial<Record<OperatorAttentionKindId, number>>,
): readonly OperatorAttentionKindId[] {
  if (!shouldShowHomeMetricsStrip(metrics)) {
    return [];
  }

  return ATTENTION_KINDS_IN_METRICS_STRIP.filter(
    (kind) => (attentionCountsByKind[kind] ?? 0) > 0,
  );
}

function shouldOmitAttentionTaxonomySection(
  metrics: OperatorHomeWorkspaceMetricsSnapshot,
  attentionCountsByKind: Partial<Record<OperatorAttentionKindId, number>>,
  suppressAttentionKinds: readonly OperatorAttentionKindId[],
): boolean {
  const suppressSet = new Set(suppressAttentionKinds);
  const nonZeroKinds = OPERATOR_ATTENTION_KIND_IDS.filter(
    (kind) => (attentionCountsByKind[kind] ?? 0) > 0,
  );

  if (nonZeroKinds.length === 0) {
    return false;
  }

  return nonZeroKinds.every((kind) => suppressSet.has(kind));
}

function attentionTaxonomySection(
  suppressAttentionKinds?: readonly OperatorAttentionKindId[],
  promotedAttentionKind?: OperatorAttentionKindId | null,
  metrics?: OperatorHomeWorkspaceMetricsSnapshot,
  attentionCountsByKind?: Partial<Record<OperatorAttentionKindId, number>>,
): OperatorHomeSectionDescriptor | null {
  const metricsStripKinds =
    metrics !== undefined && attentionCountsByKind !== undefined
      ? attentionKindsSurfacedInMetricsStrip(metrics, attentionCountsByKind)
      : [];
  const mergedSuppressKinds = mergeAttentionSuppressKinds(
    [...(suppressAttentionKinds ?? []), ...metricsStripKinds],
    promotedAttentionKind,
  );

  if (
    metrics !== undefined &&
    attentionCountsByKind !== undefined &&
    shouldOmitAttentionTaxonomySection(metrics, attentionCountsByKind, mergedSuppressKinds)
  ) {
    return null;
  }

  return {
    id: "attention-taxonomy",
    testId: "operator-home-attention-taxonomy",
    ...(mergedSuppressKinds.length > 0 ? { suppressAttentionKinds: mergedSuppressKinds } : {}),
  };
}

function shouldShowHomeMetricsStrip(metrics: OperatorHomeWorkspaceMetricsSnapshot): boolean {
  return metrics.reviewPackagesCommitted > 0;
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
  promotedAttentionKind?: OperatorAttentionKindId | null,
  attentionCountsByKind?: Partial<Record<OperatorAttentionKindId, number>>,
): OperatorHomeSectionDescriptor[] {
  if (phase === "eval-empty" || phase === "eval-with-drafts") {
    return earlyPhaseSections(phase);
  }

  const attentionSection = attentionTaxonomySection(
    ["unfinished-work"],
    promotedAttentionKind,
    metrics,
    attentionCountsByKind,
  );
  const sections: OperatorHomeSectionDescriptor[] = [
    ...(shouldShowHomeMetricsStrip(metrics) ? [metricsStripSection()] : []),
    ...(attentionSection !== null ? [attentionSection] : []),
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
  promotedAttentionKind?: OperatorAttentionKindId | null,
  attentionCountsByKind?: Partial<Record<OperatorAttentionKindId, number>>,
): OperatorHomeSectionDescriptor[] {
  if (phase === "eval-empty" || phase === "eval-with-drafts") {
    return earlyPhaseSections(phase);
  }

  const attentionSection = attentionTaxonomySection(
    ["unfinished-work"],
    promotedAttentionKind,
    metrics,
    attentionCountsByKind,
  );
  const sections: OperatorHomeSectionDescriptor[] = [
    ...(shouldShowHomeMetricsStrip(metrics) ? [metricsStripSection()] : []),
    ...(attentionSection !== null ? [attentionSection] : []),
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
  promotedAttentionKind?: OperatorAttentionKindId | null,
  attentionCountsByKind?: Partial<Record<OperatorAttentionKindId, number>>,
): OperatorHomeSectionDescriptor[] {
  if (phase === "eval-empty" || phase === "eval-with-drafts") {
    return workingModeEarlyPhaseSections(phase);
  }

  const attentionSection = attentionTaxonomySection(
    ["unfinished-work"],
    promotedAttentionKind,
    metrics,
    attentionCountsByKind,
  );

  return [
    ...(shouldShowHomeMetricsStrip(metrics) ? [metricsStripSection()] : []),
    ...(attentionSection !== null ? [attentionSection] : []),
    { id: "in-flight", testId: "operator-home-in-flight-analysis" },
    { id: "unfinished", testId: "operator-home-unfinished-work" },
    { id: "recent-reviews", testId: "operator-home-recent-reviews" },
    { id: "start-something", testId: "operator-home-start-something" },
  ];
}

function resolvePromotedAttentionKindForComposition(
  metrics: OperatorHomeWorkspaceMetricsSnapshot,
  promotedAttentionKind: OperatorAttentionKindId | null | undefined,
): OperatorAttentionKindId | null | undefined {
  if (!shouldShowHomeMetricsStrip(metrics)) {
    return null;
  }

  return promotedAttentionKind;
}

/** TB-2368 — single layout matrix for buyer-polished and operator home shells. */
export function composeOperatorHomeSections(
  input: ComposeOperatorHomeSectionsInput,
): readonly OperatorHomeSectionDescriptor[] {
  const phase = resolveOperatorHomeWorkspacePhase(input.phaseSignals);
  const promotedAttentionKind = resolvePromotedAttentionKindForComposition(
    input.metrics,
    input.promotedAttentionKind,
  );

  if (input.buyerPolishedShell) {
    return buyerPolishedSections(phase, input.metrics, promotedAttentionKind, input.attentionCountsByKind);
  }

  if (input.workingMode === true) {
    return workingModeOperatorShellSections(
      phase,
      input.metrics,
      promotedAttentionKind,
      input.attentionCountsByKind,
    );
  }

  return operatorShellSections(phase, input.metrics, promotedAttentionKind, input.attentionCountsByKind);
}

export function operatorHomeSectionDescriptor(
  sections: readonly OperatorHomeSectionDescriptor[],
  id: OperatorHomeSectionId,
): OperatorHomeSectionDescriptor | undefined {
  return sections.find((section) => section.id === id);
}
