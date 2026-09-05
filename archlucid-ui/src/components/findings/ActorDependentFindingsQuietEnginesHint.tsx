"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_ARCHITECTURE_LINK_LABEL,
  ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_BODY,
  ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_DRAFT_LINK_LABEL,
  ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_GUIDED_INTAKE_HREF,
  ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_GUIDED_INTAKE_LINK_LABEL,
  ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_GUIDED_RECOVERY,
  ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_WORKING_RECOVERY,
  buildActorDependentQuietEnginesArchitectureHref,
  buildActorDependentQuietEnginesDraftHref,
} from "@/lib/findings/actor-dependent-findings-quiet-engines-recovery";
import { cn } from "@/lib/utils";

/** @deprecated Use {@link ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_BODY} plus recovery copy from the recovery module. */
export const ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_COPY = ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_BODY;

export type ActorDependentFindingsQuietEnginesHintProps = {
  readonly show: boolean;
  readonly runId?: string;
  readonly workingMode?: boolean;
  readonly draftArchitectureId?: string | null;
  readonly draftHandoffLocked?: boolean;
};

function resolveWorkingMode(
  workingModeProp: boolean | undefined,
  providerWorkingMode: boolean,
): boolean {
  if (workingModeProp !== undefined) {
    return workingModeProp;
  }

  return providerWorkingMode;
}

function resolveDraftActorsHref(
  draftArchitectureId: string | null | undefined,
  draftHandoffLocked: boolean | undefined,
): string | null {
  const trimmedDraftId = draftArchitectureId?.trim() ?? "";

  if (trimmedDraftId.length === 0 || draftHandoffLocked === true) {
    return null;
  }

  return buildActorDependentQuietEnginesDraftHref(trimmedDraftId);
}

/** Honest findings-panel hint when actor-dependent engines stay silent (WK-18; RS-01). */
export function ActorDependentFindingsQuietEnginesHint(
  props: ActorDependentFindingsQuietEnginesHintProps,
): ReactElement | null {
  const { isWorkingMode } = useWorkspaceMode();

  if (!props.show) {
    return null;
  }

  const workingMode = resolveWorkingMode(props.workingMode, isWorkingMode);
  const trimmedRunId = props.runId?.trim() ?? "";
  const architectureHref =
    trimmedRunId.length > 0 ? buildActorDependentQuietEnginesArchitectureHref(trimmedRunId) : null;
  const draftActorsHref = resolveDraftActorsHref(props.draftArchitectureId, props.draftHandoffLocked);
  const recoveryCopy = workingMode
    ? ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_WORKING_RECOVERY
    : ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_GUIDED_RECOVERY;

  return (
    <div
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      role="status"
      data-testid="run-detail-actor-engines-quiet-hint"
      data-working-mode={workingMode ? "true" : "false"}
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
        {ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_BODY} {recoveryCopy}
      </p>
      <p className={cn("m-0 mt-2 flex flex-wrap items-center gap-x-4 gap-y-1", OPERATOR_TYPOGRAPHY.helper)}>
        {architectureHref !== null ? (
          <Link
            className={OPERATOR_LINK.nav}
            href={architectureHref}
            data-testid="actor-quiet-engines-architecture-link"
          >
            {ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_ARCHITECTURE_LINK_LABEL}
          </Link>
        ) : null}
        {draftActorsHref !== null ? (
          <Link
            className={OPERATOR_LINK.nav}
            href={draftActorsHref}
            data-testid="actor-quiet-engines-draft-link"
          >
            {ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_DRAFT_LINK_LABEL}
          </Link>
        ) : null}
        {!workingMode ? (
          <Link
            className={OPERATOR_LINK.nav}
            href={ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_GUIDED_INTAKE_HREF}
            data-testid="actor-quiet-engines-guided-intake-link"
          >
            {ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_GUIDED_INTAKE_LINK_LABEL}
          </Link>
        ) : null}
      </p>
    </div>
  );
}
