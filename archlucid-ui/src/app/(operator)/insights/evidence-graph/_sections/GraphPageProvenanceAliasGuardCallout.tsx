"use client";

import { provenanceGraphAliasBlockedReason } from "@/lib/graph/provenance-graph-alias-blocked-reason";
import { authorityProvenanceAliasBlockedReason } from "@/lib/graph/authority-provenance-alias-blocked-reason";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type GraphPageProvenanceAliasGuardCalloutProps = {
  readonly loadFailure: ApiLoadFailureState | null;
  readonly mode: string;
};

/** Wave-62 suggestion 737: fail-closed provenance alias blocked-reason on evidence graph fetch. */
export function GraphPageProvenanceAliasGuardCallout(props: GraphPageProvenanceAliasGuardCalloutProps) {
  const blockedReason =
    props.mode === "provenance-full"
      ? (provenanceGraphAliasBlockedReason(props.loadFailure)
        ?? authorityProvenanceAliasBlockedReason(props.loadFailure))
      : authorityProvenanceAliasBlockedReason(props.loadFailure);

  if (blockedReason === null) {
    return null;
  }

  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="graph-page-provenance-alias-blocked"
    >
      {blockedReason}
    </p>
  );
}
