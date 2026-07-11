"use client";

import { useMemo } from "react";

import { ArchitectureCreateWorkItemSection } from "@/components/architecture/ArchitectureCreateWorkItemSection";
import { ArchitectureCreatedHomeViewport } from "@/components/architecture/ArchitectureCreatedHomeViewport";
import { ArchitectureDiagramPanel } from "@/components/architecture/ArchitectureDiagramPanel";
import {
  buildArchitectureCreatedHomeModel,
  mergeArchitectureCreatedHomeInput,
  type BuildArchitectureCreatedHomeModelInput,
} from "@/lib/architecture-created-home-model";
import { readArchitectureCreationHandoff } from "@/lib/architecture-creation-handoff";
import type { ArchitectureCreationUserAssertions } from "@/lib/architecture-structured-content-types";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { REVIEWS_NEW_CREATE_ARCHITECTURE_HREF } from "@/lib/reviews-new-path-copy";

export type RunDetailArchitectureCreatedFirstViewportProps = {
  readonly baseline: BuildArchitectureCreatedHomeModelInput;
  readonly architectureSourceText: string;
  readonly canEditDiagram: boolean;
  readonly findings: readonly QuickDecisionFinding[];
};

function resolveUserAssertions(
  runId: string,
  merged: BuildArchitectureCreatedHomeModelInput,
): ArchitectureCreationUserAssertions {
  const snapshot = readArchitectureCreationHandoff(runId);

  return {
    architectureName: merged.architectureName,
    architectureOverview: merged.architectureOverview,
    businessOutcome: merged.businessOutcome,
    peopleAndSystems: merged.peopleAndSystems,
  };
}

/** Merges session handoff snapshot with server run detail for the architecture home viewport. */
export function RunDetailArchitectureCreatedFirstViewport(
  props: RunDetailArchitectureCreatedFirstViewportProps,
): React.JSX.Element {
  const merged = useMemo(() => {
    const snapshot = readArchitectureCreationHandoff(props.baseline.runId);

    return mergeArchitectureCreatedHomeInput(props.baseline, snapshot);
  }, [props.baseline]);

  const model = useMemo(() => buildArchitectureCreatedHomeModel(merged), [merged]);
  const userAssertions = useMemo(() => resolveUserAssertions(props.baseline.runId, merged), [props.baseline.runId, merged]);

  return (
    <div className="space-y-5" data-testid="architecture-created-first-viewport">
      <ArchitectureDiagramPanel
        runId={props.baseline.runId}
        architectureName={merged.architectureName}
        sourceText={props.architectureSourceText}
        userAssertions={userAssertions}
        canEdit={props.canEditDiagram}
        clarifyHref={REVIEWS_NEW_CREATE_ARCHITECTURE_HREF}
      />
      <ArchitectureCreatedHomeViewport model={model} />
      <ArchitectureCreateWorkItemSection
        runId={props.baseline.runId}
        architectureName={merged.architectureName}
        architectureOverview={merged.architectureOverview}
        ownerLabel={merged.ownerLabel}
        findings={props.findings}
      />
    </div>
  );
}
