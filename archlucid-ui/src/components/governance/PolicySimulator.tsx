"use client";

import type { ReactNode } from "react";

import type { components } from "@/lib/openapi-schemas";
import { DOMAIN_TERMS } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type PolicySimulatorProps = {
  result: components["schemas"]["PolicyPackGovernanceDryRunResult"];
  className?: string;
};

const passedCardCls =
  "rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100";

const failedCardCls =
  "rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-950 dark:border-red-700 dark:bg-red-950/40 dark:text-red-100";

const warningCardCls =
  "rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100";

function checkList(title: string, checks: string[], tone: "passed" | "failed" | "warning"): ReactNode {
  if (checks.length === 0) {
    return null;
  }

  const cardCls = tone === "passed" ? passedCardCls : tone === "failed" ? failedCardCls : warningCardCls;

  return (
    <section className={cardCls} data-testid={`policy-simulator-${tone}-checks`}>
      <h4 className="m-0 text-sm font-semibold">{title}</h4>
      <ul className="m-0 mt-2 list-disc space-y-1 ps-5">
        {checks.map((check) => (
          <li key={check} className="font-mono text-xs break-all">
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
      <div className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900/40">
        <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">Simulation outcome</p>
        {result.gateResult !== undefined ? (
          <p className="m-0 mt-1">
            {DOMAIN_TERMS.preCommitGate}:{" "}
            <strong>{gateBlocked ? "would block commit" : "would allow commit"}</strong>
            {gateWarnOnly ? " (warn-only)" : ""}
          </p>
        ) : null}
        {result.resolvedRunId !== undefined && result.resolvedRunId.trim().length > 0 ? (
          <p className="m-0 mt-1 font-mono text-xs break-all">Resolved run: {result.resolvedRunId}</p>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {checkList("Before commit (baseline checks passed)", passedChecks, "passed")}
        {checkList("After proposed policy (checks failed)", failedChecks, "failed")}
      </div>

      {warnings.length > 0 ? checkList("Warnings", warnings, "warning") : null}

      {passedChecks.length === 0 && failedChecks.length === 0 && warnings.length === 0 ? (
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">No check details returned for this simulation.</p>
      ) : null}
    </div>
  );
}