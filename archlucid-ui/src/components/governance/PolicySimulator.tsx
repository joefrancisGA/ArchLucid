"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_CALLOUT_BLOCKED_CLASS, OPERATOR_CALLOUT_SUCCESS_CLASS, OPERATOR_CALLOUT_WARN_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { ReactNode } from "react";

import type { components } from "@/lib/openapi-schemas";
import { DOMAIN_TERMS } from "@/lib/i18n";

export type PolicySimulatorProps = {
  result: components["schemas"]["PolicyPackGovernanceDryRunResult"];
  className?: string;
};

const passedCardCls = cn("p-3", OPERATOR_CALLOUT_SUCCESS_CLASS);

const failedCardCls = cn("p-3", OPERATOR_CALLOUT_BLOCKED_CLASS);

const warningCardCls = cn("p-3", OPERATOR_CALLOUT_WARN_CLASS);

function checkList(title: string, checks: string[], tone: "passed" | "failed" | "warning"): ReactNode {
  if (checks.length === 0) {
    return null;
  }

  const cardCls = tone === "passed" ? passedCardCls : tone === "failed" ? failedCardCls : warningCardCls;

  return (
    <section className={cardCls} data-testid={`policy-simulator-${tone}-checks`}>
      <h4 className={cn("m-0 font-semibold", OPERATOR_TYPOGRAPHY.cardTitle)}>{title}</h4>
      <ul className="m-0 mt-2 list-disc space-y-1 ps-5">
        {checks.map((check) => (
          <li key={check} className={cn("font-mono break-all", OPERATOR_TYPOGRAPHY.helper)}>
            {check}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PolicySimulator({ result, className }: PolicySimulatorProps) {
  const passedChecks = result.passedChecks ?? [];
  const failedChecks = result.failedChecks ?? [];
  const warnings = result.warnings ?? [];
  const gateBlocked = result.gateResult?.blocked === true;
  const gateWarnOnly = result.gateResult?.warnOnly === true;

  return (
    <div
      className={cn("space-y-3", className)}
      data-testid="policy-simulator"
      aria-label={`${DOMAIN_TERMS.policyPack} dry-run simulation`}
    >
      <div className={cn("rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40", OPERATOR_TYPOGRAPHY.body)}>
        <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">Simulation outcome</p>
        {result.gateResult !== undefined ? (
          <p className="m-0 mt-1">
            {DOMAIN_TERMS.preCommitGate}:{" "}
            <strong>{gateBlocked ? "would block finalizing" : "would allow finalizing"}</strong>
            {gateWarnOnly ? " (warn-only)" : ""}
          </p>
        ) : null}
        {result.resolvedRunId !== undefined && result.resolvedRunId.trim().length > 0 ? (
          <p className={cn("m-0 mt-1 font-mono break-all", OPERATOR_TYPOGRAPHY.helper)}>Resolved run: {result.resolvedRunId}</p>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {checkList("Before commit (baseline checks passed)", passedChecks, "passed")}
        {checkList("After proposed policy (checks failed)", failedChecks, "failed")}
      </div>

      {warnings.length > 0 ? checkList("Warnings", warnings, "warning") : null}

      {passedChecks.length === 0 && failedChecks.length === 0 && warnings.length === 0 ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>No check details returned for this simulation.</p>
      ) : null}
    </div>
  );
}