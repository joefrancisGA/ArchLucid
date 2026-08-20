import type { OperatorHomeWorkspaceMetricsSnapshot } from "@/lib/operator/operator-home-workspace-metrics";
import {
  resolveOperatorHomeWorkspacePhase,
  type OperatorHomeWorkspacePhase,
  type OperatorHomeWorkspacePhaseSignals,
} from "@/lib/resolve-operator-home-workspace-phase";

export type OperatorHomeSectionId =
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
  const sections: OperatorHomeSectionDescriptor[] = [
    { id: "unfinished", testId: "operator-home-unfinished-work" },
    { id: "hero", testId: "operator-home-hero-section" },
    { id: "recent-reviews", testId: "operator-home-recent-reviews" },
    { id: "buyer-chrome", testId: "operator-home-orientation-top" },
    { id: "below-fold", testId: "operator-home-below-fold" },
  ];

  if (phase !== "operational") {
    sections.push({ id: "stickiness", testId: "operator-home-stickiness-cockpit" });
  }

  sections.push({ id: "sponsor-roi", testId: "operator-home-sponsor-roi" });

  return sections;
}

function operatorShellSections(phase: OperatorHomeWorkspacePhase): OperatorHomeSectionDescriptor[] {
  const sections: OperatorHomeSectionDescriptor[] = [
    { id: "unfinished", testId: "operator-home-unfinished-work" },
    { id: "command-center", testId: "operator-home-pilot-command-center-host" },
    { id: "recent-reviews", testId: "operator-home-recent-reviews" },
    { id: "below-fold", testId: "operator-home-below-fold" },
  ];

  if (phase !== "operational") {
    sections.push({ id: "stickiness", testId: "operator-home-stickiness-cockpit" });
  }

  sections.push({ id: "sponsor-roi", testId: "operator-home-sponsor-roi" });

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
