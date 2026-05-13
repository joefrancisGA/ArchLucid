"use client";

import { formatIsoUtcForDisplay } from "@/lib/format-iso-utc";
import type { LearningPlanDetailResponse } from "@/types/learning";

type PlanningPlanDetailSectionsProps = {
  plan: LearningPlanDetailResponse;
};

export function PlanningPlanDetailSections({ plan }: PlanningPlanDetailSectionsProps) {
  return (
    <>
      <section className="mb-6" aria-labelledby="plan-detail-title">
        <h3 id="plan-detail-title" className="text-xl mb-2">
          {plan.title}
        </h3>
        <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mt-0">{plan.summary}</p>

        <div className="mt-4">
          <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-2 text-sm mb-2 items-baseline">
            <span className="text-neutral-500 dark:text-neutral-400">Priority score</span>
            <span>{plan.priorityScore}</span>
          </div>
          {plan.priorityExplanation ? (
            <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-2 text-sm mb-2 items-baseline">
              <span className="text-neutral-500 dark:text-neutral-400">Priority note</span>
              <span>{plan.priorityExplanation}</span>
            </div>
          ) : null}
          <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-2 text-sm mb-2 items-baseline">
            <span className="text-neutral-500 dark:text-neutral-400">Status</span>
            <span>{plan.status}</span>
          </div>
          <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-2 text-sm mb-2 items-baseline">
            <span className="text-neutral-500 dark:text-neutral-400">Created</span>
            <span>{formatIsoUtcForDisplay(plan.createdUtc)}</span>
          </div>
          <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-2 text-sm mb-2 items-baseline">
            <span className="text-neutral-500 dark:text-neutral-400">Theme id</span>
            <span className="font-mono text-[13px]">{plan.themeId}</span>
          </div>
        </div>
      </section>

      <section className="mb-6" aria-labelledby="plan-evidence-heading">
        <h4 id="plan-evidence-heading" className="text-base mb-2">
          Evidence counts (linked)
        </h4>
        <ul className="m-0 pl-5 text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <li>Pilot signals: {plan.evidenceCounts.linkedSignalCount}</li>
          <li>Artifacts: {plan.evidenceCounts.linkedArtifactCount}</li>
          <li>Architecture runs: {plan.evidenceCounts.linkedArchitectureRunCount}</li>
        </ul>
      </section>

      {plan.theme ? (
        <section className="mb-6" aria-labelledby="plan-theme-heading">
          <h4 id="plan-theme-heading" className="text-base mb-2">
            Parent theme
          </h4>
          <p className="mb-2 font-semibold">{plan.theme.title}</p>
          <p className="mb-2 text-sm text-neutral-600 dark:text-neutral-400">{plan.theme.summary}</p>
          <p className="m-0 text-[13px] text-neutral-500 dark:text-neutral-400">
            Evidence signals: {plan.theme.evidenceSignalCount} · Runs: {plan.theme.distinctRunCount} · Severity:{" "}
            {plan.theme.severityBand}
          </p>
        </section>
      ) : null}

      <section className="mb-6" aria-labelledby="plan-steps-heading">
        <h4 id="plan-steps-heading" className="text-base mb-2">
          Action steps
        </h4>
        {plan.actionSteps.length === 0 ? (
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">No steps recorded.</p>
        ) : (
          <ol className="m-0 pl-[22px] leading-relaxed text-neutral-700 dark:text-neutral-300">
            {[...plan.actionSteps].sort((a, b) => a.ordinal - b.ordinal).map((s) => (
              <li key={`${s.ordinal}-${s.actionType}`} className="mb-3">
                <strong>
                  {s.ordinal}. {s.actionType}
                </strong>
                <p className="mt-1.5 text-sm">{s.description}</p>
                {s.acceptanceCriteria ? (
                  <p className="mt-1.5 text-[13px] text-neutral-600 dark:text-neutral-400">
                    <em>Acceptance:</em> {s.acceptanceCriteria}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
