"use client";

import { formatIsoUtcForDisplay } from "@/lib/format-iso-utc";

import { StatusTag } from "@/components/StatusTag";
import { TechnicalIdDisclosure } from "@/components/usability/TechnicalIdDisclosure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveEnterpriseStatusKind } from "@/lib/enterprise-status-kind-resolver";
import { PLANNING_PLAN_DETAIL_THEME_ID_LABEL } from "@/lib/planning-plan-detail-evidence-copy";

import { cn } from "@/lib/utils";

import type { LearningPlanDetailResponse } from "@/types/learning";

type PlanningPlanDetailSectionsProps = {

  plan: LearningPlanDetailResponse;

};

const detailGridClass = cn("mb-2 grid grid-cols-[160px_1fr] items-baseline gap-x-4 gap-y-2", OPERATOR_TYPOGRAPHY.body);

export function PlanningPlanDetailSections({ plan }: PlanningPlanDetailSectionsProps) {

  const statusKind = resolveEnterpriseStatusKind(plan.status, "general");

  return (

    <>

      <section className="mb-6" aria-labelledby="plan-detail-title">

        <h3 id="plan-detail-title" className={cn("mb-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>

          {plan.title}

        </h3>

        <p className={cn("mt-0 leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{plan.summary}</p>

        <div className="mt-4">

          <div className={detailGridClass}>

            <span className="text-al-text-secondary">Priority score</span>

            <span>{plan.priorityScore}</span>

          </div>

          {plan.priorityExplanation ? (

            <div className={detailGridClass}>

              <span className="text-al-text-secondary">Priority note</span>

              <span>{plan.priorityExplanation}</span>

            </div>

          ) : null}

          <div className={detailGridClass}>

            <span className="text-al-text-secondary">Status</span>

            <StatusTag kind={statusKind} label={plan.status} data-testid="planning-plan-detail-status" />

          </div>

          <div className={detailGridClass}>

            <span className="text-al-text-secondary">Created</span>

            <span>{formatIsoUtcForDisplay(plan.createdUtc)}</span>

          </div>

          <div className={detailGridClass}>

            <span className="text-al-text-secondary">{PLANNING_PLAN_DETAIL_THEME_ID_LABEL}</span>

            <TechnicalIdDisclosure label={PLANNING_PLAN_DETAIL_THEME_ID_LABEL} value={plan.themeId} />

          </div>

        </div>

      </section>

      <section className="mb-6" aria-labelledby="plan-evidence-heading">

        <h4 id="plan-evidence-heading" className={cn("mb-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>

          Evidence counts (linked)

        </h4>

        <ul className={cn("m-0 pl-5 leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>

          <li>Pilot signals: {plan.evidenceCounts.linkedSignalCount}</li>

          <li>Artifacts: {plan.evidenceCounts.linkedArtifactCount}</li>

          <li>Architecture reviews: {plan.evidenceCounts.linkedArchitectureRunCount}</li>

        </ul>

      </section>

      {plan.theme ? (

        <section className="mb-6" aria-labelledby="plan-theme-heading">

          <h4 id="plan-theme-heading" className={cn("mb-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>

            Parent theme

          </h4>

          <p className="mb-2 font-semibold">{plan.theme.title}</p>

          <p className={cn("mb-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{plan.theme.summary}</p>

          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>

            Evidence signals: {plan.theme.evidenceSignalCount} · Reviews: {plan.theme.distinctRunCount} · Severity:{" "}

            {plan.theme.severityBand}

          </p>

        </section>

      ) : null}

      <section className="mb-6" aria-labelledby="plan-steps-heading">

        <h4 id="plan-steps-heading" className={cn("mb-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>

          Action steps

        </h4>

        {plan.actionSteps.length === 0 ? (

          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No steps recorded.</p>

        ) : (

          <ol className={cn("m-0 pl-[22px] leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>

            {[...plan.actionSteps].sort((a, b) => a.ordinal - b.ordinal).map((s) => (

              <li key={`${s.ordinal}-${s.actionType}`} className="mb-3">

                <strong>

                  {s.ordinal}. {s.actionType}

                </strong>

                <p className={cn("mt-1.5", OPERATOR_TYPOGRAPHY.body)}>{s.description}</p>

                {s.acceptanceCriteria ? (

                  <p className={cn("mt-1.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>

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
