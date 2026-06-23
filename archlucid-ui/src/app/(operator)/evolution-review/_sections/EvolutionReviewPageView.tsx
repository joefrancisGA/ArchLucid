"use client";

import Link from "next/link";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { SimulationRunDiffCard } from "@/components/evolution/SimulationRunDiffCard";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorEmptyState, OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { buildEvolutionSimulationReportFileUrl } from "@/lib/evolution-simulation-report-urls";

import type { EvolutionReviewPageViewModel } from "./evolution-review-view-model";

type Props = {
  readonly model: EvolutionReviewPageViewModel;
};

/**
 * Change simulation: browse proposed architecture changes, their expected impact, and before-and-after comparisons per review baseline.
 */
export function EvolutionReviewPageView(props: Props) {
  const m = props.model;

  if (m.isDemo) {
    return (
      <DemoWorkspaceCapabilityUnavailablePanel
        capability="Change simulation"
        description="In a connected tenant, operators preview the expected impact of a proposed architecture change with a before-and-after comparison."
      />
    );
  }

  const emptyList = !m.listLoading && m.candidates.length === 0 && m.listFailure === null;

  return (
    <div className="max-w-5xl">
      <OperatorPageHeader title="Change simulation" />
      <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed max-w-3xl">
        Preview the expected impact of a proposed architecture change before implementation. Each proposed change
        carries its expected impact and a side-by-side <strong>before-and-after comparison</strong> against the review
        baseline. Create a proposed change from{" "}
        <Link href="/planning" className="text-blue-700 dark:text-blue-400">
          Planning
        </Link>
        ; use <strong>Simulate change impact</strong> when your account has permission to refresh outcomes and scores.
      </p>

      <div className="flex flex-wrap gap-3 items-center mt-4 mb-5">
        <button type="button" onClick={() => void m.loadList()} disabled={m.listLoading}>
          Refresh list
        </button>
        <button
          type="button"
          onClick={() => void m.onSimulate()}
          disabled={m.simulateBusy || m.selectedId === null || m.detailLoading}
        >
          {m.simulateBusy ? "Simulating change impact…" : "Simulate change impact"}
        </button>
      </div>

      {m.listLoading && m.candidates.length === 0 ? (
        <OperatorLoadingNotice>
          <strong>Loading proposed changes.</strong>
          <p className="mt-2 text-sm">Fetching proposed architecture changes…</p>
        </OperatorLoadingNotice>
      ) : null}

      {m.listFailure !== null ? (
        <div role="alert" className="mb-4">
          <OperatorApiProblem
            problem={m.listFailure.problem}
            fallbackMessage={m.listFailure.message}
            correlationId={m.listFailure.correlationId}
          />
        </div>
      ) : null}

      {m.simulateFailure !== null ? (
        <div role="alert" className="mb-4">
          <OperatorApiProblem
            problem={m.simulateFailure.problem}
            fallbackMessage={m.simulateFailure.message}
            correlationId={m.simulateFailure.correlationId}
          />
        </div>
      ) : null}

      {m.selectedId !== null && m.selectedId !== "" ? (
        <section className="mb-[22px]" aria-labelledby="evolution-export-heading">
          <h3 id="evolution-export-heading" className="text-[15px] mb-1.5 text-neutral-700 dark:text-neutral-300">
            Export simulation summary
          </h3>
          <p className="m-0 text-[13px] text-neutral-500 dark:text-neutral-400 max-w-3xl">
            Markdown or JSON bundle for the selected proposed change: description, expected impact, saved simulation
            outcomes, evaluation scores, and before-and-after comparison lines.
          </p>
          <p className="mt-2.5 text-sm">
            <a href={buildEvolutionSimulationReportFileUrl(m.selectedId, "markdown")} download>
              Download Markdown
            </a>
            {" · "}
            <a href={buildEvolutionSimulationReportFileUrl(m.selectedId, "json")} download>
              Download JSON
            </a>
            {" · "}
            <a
              href={buildEvolutionSimulationReportFileUrl(m.selectedId, "json")}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open JSON in new tab
            </a>
          </p>
        </section>
      ) : null}

      {emptyList ? (
        <OperatorEmptyState title="No proposed changes available">
          <p className="m-0 text-sm">
            Create a proposed change from{" "}
            <Link href="/planning" className="text-blue-700 dark:text-blue-400">
              Planning
            </Link>{" "}
            before running a simulation.
          </p>
          <p className="mt-3 m-0 text-sm text-neutral-600 dark:text-neutral-400">
            A simulation compares the current review package with a proposed change and estimates likely impact on
            findings, risk, cost, and governance posture.
          </p>
          <p className="mt-3 text-sm">
            <Link href="/planning" className="text-blue-700 dark:text-blue-400">
              Open Planning
            </Link>
            {" · "}
            <Link href="/reviews?projectId=default" className="text-blue-700 dark:text-blue-400">
              Open review packages
            </Link>
          </p>
        </OperatorEmptyState>
      ) : null}

      {m.candidates.length > 0 ? (
        <section aria-labelledby="evolution-candidates-heading">
          <h3 id="evolution-candidates-heading" className="text-[17px] mb-2">
            Proposed changes
          </h3>
          <div className="flex flex-col gap-2 mb-5">
            {m.candidates.map((c) => {
              const sel = c.candidateChangeSetId === m.selectedId;

              return (
                <button
                  key={c.candidateChangeSetId}
                  type="button"
                  className={
                    sel
                      ? "text-left px-3 py-2.5 rounded-lg border border-blue-600 bg-white cursor-pointer text-sm shadow-[0_0_0_1px_#2563eb] dark:border-blue-500 dark:bg-neutral-950"
                      : "text-left px-3 py-2.5 rounded-lg border border-neutral-200 bg-white cursor-pointer text-sm dark:border-neutral-700 dark:bg-neutral-950"
                  }
                  onClick={() => m.setSelectedId(c.candidateChangeSetId)}
                >
                  <div className="font-semibold">{c.title}</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {c.status} · {new Date(c.createdUtc).toLocaleString()}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {m.selectedId !== null && m.detailLoading && m.detail === null ? (
        <OperatorLoadingNotice>
          <strong>Loading simulation results.</strong>
        </OperatorLoadingNotice>
      ) : null}

      {m.detailFailure !== null ? (
        <div role="alert" className="mb-4">
          <OperatorApiProblem
            problem={m.detailFailure.problem}
            fallbackMessage={m.detailFailure.message}
            correlationId={m.detailFailure.correlationId}
          />
        </div>
      ) : null}

      {m.detail !== null ? (
        <section aria-labelledby="evolution-detail-heading">
          <h3 id="evolution-detail-heading" className="text-[17px] mb-2">
            Description
          </h3>
          <p className="mb-1.5 text-sm leading-relaxed">
            <strong>{m.detail.candidate.title}</strong>
          </p>
          <p className="mb-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{m.detail.candidate.summary}</p>
          <p className="mb-5 text-[13px] text-neutral-500 dark:text-neutral-400">
            Status: <strong>{m.detail.candidate.status}</strong> · Source plan{" "}
            <Link
              href={`/planning/plans/${encodeURIComponent(m.detail.candidate.sourcePlanId)}`}
              className="text-blue-700 dark:text-blue-400"
            >
              {m.detail.candidate.sourcePlanId}
            </Link>
          </p>

          <h3 className="text-[17px] mb-2">Expected impact</h3>
          {m.planSnapshot !== null ? (
            <div className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 px-3.5 py-3 mb-[18px] text-sm leading-relaxed">
              <p className="mb-2">
                <strong>Priority score:</strong> {m.planSnapshot.priorityScore}
              </p>
              {m.planSnapshot.priorityExplanation !== null &&
              m.planSnapshot.priorityExplanation !== undefined &&
              m.planSnapshot.priorityExplanation !== "" ? (
                <p className="mb-2">
                  <strong>Priority explanation:</strong> {m.planSnapshot.priorityExplanation}
                </p>
              ) : (
                <p className="mb-2 text-neutral-500 dark:text-neutral-400">No priority explanation recorded.</p>
              )}
              <p className="mb-2">
                <strong>Action steps (count):</strong> {m.planSnapshot.actionStepCount}
              </p>
              <p className="m-0 text-[13px] text-indigo-700 dark:text-indigo-400">
                Summary: {m.planSnapshot.summary}
              </p>
            </div>
          ) : (
            <p className="text-amber-700 dark:text-amber-400 text-sm">Expected impact details could not be loaded.</p>
          )}

          <h3 className="text-[17px] mb-2">Simulation results</h3>
          <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mb-3 max-w-3xl">
            Each row is a <strong>before-and-after comparison</strong>:{" "}
            <span className="bg-al-surface-raised dark:bg-neutral-800/80 px-1.5 py-px">before</span> reflects the current
            review baseline; <span className="bg-al-surface-raised dark:bg-neutral-900/50 px-1.5 py-px">after</span>{" "}
            shows the estimated impact of the proposed change, including evaluation scores where available.
          </p>
          {m.detailLoading ? (
            <p className="text-neutral-500 dark:text-neutral-400 text-[13px]" role="status">
              Updating…
            </p>
          ) : null}
          {(m.detail.simulationRuns ?? []).length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No saved simulations yet. Select a proposed change and use <strong>Simulate change impact</strong> above.
            </p>
          ) : (
            (m.detail.simulationRuns ?? []).map((r) => (
              <SimulationRunDiffCard
                key={r.simulationRunId}
                run={r}
                planLinkedRunIds={m.planSnapshot?.linkedArchitectureRunIds ?? []}
              />
            ))
          )}
        </section>
      ) : null}
    </div>
  );
}
