"use client";

import type { ReactElement } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  evaluateCareerArtifactHonesty,
  type CareerArtifactHonestyInput,
} from "@/lib/career-artifact/career-artifact-honesty";
import { cn } from "@/lib/utils";

export type RunDetailCareerArtifactHonestyStripProps = CareerArtifactHonestyInput & {
  readonly className?: string;
};

/** ADR 0078 — stamp-band honesty verdict before career export or finalize (FC-02). */
export function RunDetailCareerArtifactHonestyStrip(
  props: RunDetailCareerArtifactHonestyStripProps,
): ReactElement | null {
  const { isWorkingMode } = useWorkspaceMode();
  const { className, ...honestyInput } = props;
  const verdict = evaluateCareerArtifactHonesty(honestyInput);

  if (!isWorkingMode) {
    return null;
  }

  if (verdict.blockedReasons.length === 0 && verdict.warnings.length === 0 && verdict.headerLines.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(DESIGN_TOKENS.callout.info, "space-y-2 p-4", className)}
      data-testid="run-detail-career-artifact-honesty-strip"
      role="status"
    >
      {verdict.blockedReasons.map((reason) => (
        <p
          key={reason}
          className={cn("m-0 font-semibold text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)}
          data-testid="run-detail-career-artifact-blocked-reason"
        >
          Incomplete for career use: {reason}
        </p>
      ))}
      {verdict.warnings.map((warning) => (
        <p key={warning} className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {warning}
        </p>
      ))}
      {verdict.headerLines.slice(0, 2).map((line) => (
        <p key={line} className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {line}
        </p>
      ))}
    </div>
  );
}
