"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { useAdminConfigLintSummaryQuery } from "@/hooks/use-admin-config-lint-summary-query";
import { useCorePilotTeamChecklistQuery } from "@/hooks/use-core-pilot-team-checklist-query";
import { useHealthReadySummaryQuery } from "@/hooks/use-health-ready-summary-query";
import { resolveInAppDocHref } from "@/lib/in-app-doc-href";

type EvidenceChecklistRow = {
  readonly id: string;
  readonly label: string;
  readonly status: "ready" | "attention" | "pending";
  readonly actionHref?: string;
  readonly actionLabel?: string;
};

/** Live first-run evidence checklist with config/API health signals (assessment improvement #9). */
export function InProductEvidenceChecklist() {
  const healthQuery = useHealthReadySummaryQuery();
  const configLintQuery = useAdminConfigLintSummaryQuery();
  const checklistQuery = useCorePilotTeamChecklistQuery();

  const phase =
    healthQuery.isPending || configLintQuery.isPending || checklistQuery.isPending ? "loading" : "ready";

  const rows = useMemo((): EvidenceChecklistRow[] => {
    if (phase === "loading") {
      return [];
    }

    const health = healthQuery.data;
    const configLint = configLintQuery.data;
    const teamChecklist = checklistQuery.isError ? [] : (checklistQuery.data ?? []);

    // Harden against a malformed (non-array) checklist body from the API/mock: `.some` would throw.
    const checklistSteps = Array.isArray(teamChecklist) ? teamChecklist : [];

    const apiReady =
      health !== null
      && health !== undefined
      && (health.status?.toLowerCase().includes("healthy") || health.status?.toLowerCase().includes("ok"));
    const configReady =
      configLint !== null
      && configLint !== undefined
      && !configLint.loadFailed
      && configLint.blockingCount === 0;
    const evidenceAck = checklistSteps.some((step) => step.stepIndex === 1 && step.isCompleted);

    return [
      {
        id: "api-health",
        label: "Service connectivity",
        status: apiReady ? "ready" : health === null ? "pending" : "attention",
        actionHref: "/help/troubleshooting",
        actionLabel: "Troubleshoot",
      },
      {
        id: "config-lint",
        label: "Workspace configuration validated",
        status: configReady ? "ready" : configLint === null || configLint === undefined ? "pending" : "attention",
        actionHref: "/administration/workspace-settings",
        actionLabel: "Open settings",
      },
      {
        id: "evidence-intake",
        label: "Evidence attached or sample review opened",
        status: evidenceAck ? "ready" : "attention",
        actionHref: "/architecture/reviews/new",
        actionLabel: "Add evidence",
      },
      {
        id: "first-commit",
        label: "First review committed",
        status: checklistSteps.some((step) => step.stepIndex === 4 && step.isCompleted) ? "ready" : "pending",
        actionHref: "/architecture/reviews",
        actionLabel: "Open reviews",
      },
    ];
  }, [
    checklistQuery.data,
    checklistQuery.isError,
    configLintQuery.data,
    healthQuery.data,
    phase,
  ]);

  return (
    <section
      aria-labelledby="in-product-evidence-checklist-heading"
      className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
      data-testid="in-product-evidence-checklist"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 id="in-product-evidence-checklist-heading" className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
          First-run evidence checklist
        </h3>
        <Link
          href={resolveInAppDocHref("/docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md")}
          className={cn("font-medium text-teal-800 underline dark:text-teal-300", OPERATOR_TYPOGRAPHY.helper)}
        >
          Open setup guide
        </Link>
      </div>

      {phase === "loading" ? (
        <p className={cn("m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.body)}>Checking workspace readiness…</p>
      ) : (
        <ul className="m-0 list-none space-y-2 p-0">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2">
              <span className={cn("text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>{row.label}</span>
              <div className="flex items-center gap-2">
                <StatusTag
                  kind={
                    row.status === "ready"
                      ? "ready"
                      : row.status === "attention"
                        ? "needs-attention"
                        : "draft"
                  }
                  label={row.status === "ready" ? "Ready" : row.status === "attention" ? "Needs attention" : "Pending"}
                />
                {row.actionHref !== undefined && row.status !== "ready" ? (
                  <Button type="button" variant="outline" size="sm" className="h-7" asChild>
                    <Link href={row.actionHref}>{row.actionLabel ?? "Open"}</Link>
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
