import type { ReactElement } from "react";

import type { RunSavingsSummaryModel, RunSavingsSummarySourceKind } from "@/lib/run-savings-summary-model";

function formatUsdWhole(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function sourceBadgeLabel(sourceKind: RunSavingsSummarySourceKind): string {
  if (sourceKind === "server-findings") {
    return "findings snapshot • tenant ROI resolver";
  }

  if (sourceKind === "static-demo") {
    return "demonstration KPI";
  }

  return "cost-actual.json";
}

/** Highlights annualized savings opportunity on run detail (server resolver or demo-only heuristics). */
export function RunSavingsSummary(props: { readonly model: RunSavingsSummaryModel }): ReactElement {
  const formatted = formatUsdWhole(props.model.annualizedUsd);
  const badgeLabel = sourceBadgeLabel(props.model.sourceKind);

  return (
    <section aria-label="Annualized savings opportunity" className="scroll-mt-24">
      <div className="relative overflow-visible rounded-xl border border-emerald-700/35 bg-gradient-to-br from-emerald-50 via-white to-white px-4 py-3 shadow-sm ring-1 ring-black/5 dark:border-emerald-400/35 dark:from-emerald-950/50 dark:via-neutral-950/40 dark:to-neutral-950 dark:shadow-none">
        <p className="m-0 mb-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-950/80 dark:text-emerald-300/95">
          Annualized savings opportunity
        </p>
        <div className="flex flex-wrap items-baseline gap-3">
          <p className="m-0 text-3xl font-semibold tracking-tight text-neutral-950 tabular-nums dark:text-neutral-50 sm:text-[2.125rem]">
            {formatted}
          </p>
          <span className="rounded-full bg-white/85 px-2 py-1 font-mono text-[10px] font-medium text-emerald-900 shadow-sm backdrop-blur dark:bg-emerald-950/85 dark:text-emerald-100">
            {badgeLabel}
          </span>
        </div>
        {props.model.basisFootnotes.length === 0 ? null : (
          <ul className="mt-3 space-y-1 pl-5 text-[11px] leading-snug text-neutral-700 marker:text-neutral-400 dark:text-neutral-300 dark:marker:text-neutral-600">
            {props.model.basisFootnotes.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
