"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import type { components } from "@/lib/api-types.generated";

import { buildProductLearningPlanningMaterializeUrl } from "./planning-materialize-url";

type MaterializeResult = components["schemas"]["ProductLearningPlanningMaterializeResult"];

type Props = {
  readonly since: string | null;
  readonly disabled: boolean;
};

/**
 * 59R planning bridge: bounded POST to `/v1/learning/planning/materialize` (ExecuteAuthority).
 */
export function PlanningBridgePanel(props: Props) {
  const [maxPlans, setMaxPlans] = useState(10);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<MaterializeResult | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const materialize = useCallback(async () => {
    setBusy(true);
    setErrorText(null);
    setResult(null);

    try {
      const url = buildProductLearningPlanningMaterializeUrl(props.since, maxPlans);
      const res = await fetch(url, { method: "POST", credentials: "include" });

      if (!res.ok) {
        const body = await res.text();

        setErrorText(body.length > 0 ? body : `HTTP ${String(res.status)}`);

        return;
      }

      const json = (await res.json()) as MaterializeResult;

      setResult(json);
    } catch (e) {
      setErrorText(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }, [props.since, maxPlans]);

  const blocked = props.disabled || busy;

  return (
    <section className="mb-7" aria-labelledby="pl-planning-bridge-heading">
      <h3 id="pl-planning-bridge-heading" className="text-[17px] mb-1">
        Planning bridge (materialize drafts)
      </h3>
      <p className="text-neutral-500 dark:text-neutral-400 text-[13px] mt-0 max-w-3xl">
        Turn ranked pilot-feedback opportunities into deterministic improvement themes and plan stubs — same scope and{" "}
        <strong>since</strong> window as the dashboard above. Requires ExecuteAuthority. Idempotent per theme key; zero
        counters usually mean everything already materialized.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-500 dark:text-neutral-400">Max plans to materialize (1–50)</span>
          <input
            type="number"
            min={1}
            max={50}
            value={maxPlans}
            disabled={blocked}
            aria-label="Maximum plans to materialize per request"
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10);

              if (Number.isFinite(n)) {
                setMaxPlans(Math.min(50, Math.max(1, n)));
              }
            }}
            className="w-28 rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-900"
          />
        </label>
        <button
          type="button"
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          disabled={blocked}
          onClick={() => void materialize()}
        >
          {busy ? "Materializing…" : "Materialize planning drafts"}
        </button>
        <Link href="/planning" className="text-sm text-blue-700 dark:text-blue-400">
          Open planning browse →
        </Link>
      </div>

      {errorText !== null ? (
        <div className="rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-rose-700/50 mt-3 p-3 text-sm" role="alert">
          {errorText}
        </div>
      ) : null}

      {result !== null ? (
        <div className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900/60" role="status">
          <p className="m-0 font-medium text-neutral-800 dark:text-neutral-100">Materialization result</p>
          <ul className="mt-2 list-none space-y-1 p-0 text-neutral-700 dark:text-neutral-300">
            <li>Themes inserted: {result.themesInserted ?? 0}</li>
            <li>Plans inserted: {result.plansInserted ?? 0}</li>
            <li>Skipped existing theme keys: {result.skippedExistingThemeKeys ?? 0}</li>
            <li>Signal links inserted: {result.signalLinksInserted ?? 0}</li>
          </ul>
        </div>
      ) : null}
    </section>
  );
}
