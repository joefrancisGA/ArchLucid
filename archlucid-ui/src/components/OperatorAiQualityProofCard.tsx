"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { resolveInAppDocHref } from "@/lib/in-app-doc-href";
import {
  dispositionClass,
  dispositionLabel,
  type OperatorAiQualitySnapshot,
} from "@/lib/operator-ai-quality-snapshot";

function formatMetric(value: number | null, digits: number): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  return value.toFixed(digits);
}

/** Readiness diagnostics: offline retrieval trend + remediation links (static snapshot from CI/proof). */
export function OperatorAiQualityProofCard(props: { readonly embedded?: boolean } = {}) {
  const embedded = props.embedded === true;
  const [snapshot, setSnapshot] = useState<OperatorAiQualitySnapshot | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const response = await fetch("/operator-ai-quality-snapshot.json", { cache: "no-store" });

        if (!response.ok) {
          if (!cancelled) {
            setLoadFailed(true);
          }

          return;
        }

        const json = (await response.json()) as OperatorAiQualitySnapshot;

        if (!cancelled) {
          setSnapshot(json);
          setLoadFailed(false);
        }
      }
      catch {
        if (!cancelled) {
          setLoadFailed(true);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const shellClassName = embedded
    ? "rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-950"
    : "rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950";

  if (loadFailed || snapshot === null) {
    return (
      <section className={shellClassName} data-testid="operator-ai-quality-proof-card">
        <h2 className="m-0 text-sm font-semibold text-al-text-primary">Assistant readiness</h2>
        <p className="m-0 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Run <code className="font-mono text-xs">python scripts/ci/write_operator_ai_quality_snapshot.py</code> after
          retrieval evaluation to populate assistant readiness diagnostics.
        </p>
      </section>
    );
  }

  const disposition = snapshot.disposition;
  const history = snapshot.history ?? [];
  const prior = history.length >= 2 ? history[history.length - 2] : null;
  const recallDelta =
    prior !== null
      && snapshot.retrievalIr.meanRecallAt5 !== null
      && prior.retrievalIr.meanRecallAt5 !== null
      ? snapshot.retrievalIr.meanRecallAt5 - prior.retrievalIr.meanRecallAt5
      : null;

  return (
    <section
      className={`${embedded ? "rounded-md border p-3" : "rounded-lg border p-4"} ${dispositionClass(disposition)}`}
      data-testid="operator-ai-quality-proof-card"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="m-0 text-sm font-semibold text-al-text-primary">Assistant readiness</h2>
        <span className="rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
          {dispositionLabel(disposition)}
        </span>
      </div>
      <p className="m-0 mt-2 text-sm leading-relaxed">
        Offline retrieval evaluation snapshot (not live tenant corpus). Mean recall@5{" "}
        <span className="font-mono tabular-nums">{formatMetric(snapshot.retrievalIr.meanRecallAt5, 4)}</span> · MRR{" "}
        <span className="font-mono tabular-nums">{formatMetric(snapshot.retrievalIr.meanMrr, 4)}</span>
        {snapshot.retrievalIr.casesEvaluated !== null ? (
          <>
            {" "}
            · <span className="font-mono tabular-nums">{snapshot.retrievalIr.casesEvaluated}</span> cases
          </>
        ) : null}
        {recallDelta !== null ? (
          <>
            {" "}
            · recall Δ{" "}
            <span className="font-mono tabular-nums">
              {recallDelta >= 0 ? "+" : ""}
              {recallDelta.toFixed(4)}
            </span>{" "}
            vs prior snapshot
          </>
        ) : null}
      </p>
      {history.length > 1 ? (
        <p className="m-0 mt-1 text-xs opacity-80">
          Trend: {history.length} snapshot{history.length === 1 ? "" : "s"} in{" "}
          <span className="font-mono">operator-ai-quality-history.json</span>
        </p>
      ) : null}
      <ul className="m-0 mt-3 list-none space-y-1 p-0 text-xs">
        {snapshot.remediationLinks.map((link) => (
          <li key={link.path}>
            {link.path.startsWith("/") ? (
              <Link href={link.path} className="font-medium underline underline-offset-2">
                {link.label}
              </Link>
            ) : (
              <Link
                href={resolveInAppDocHref(link.path)}
                className="font-medium underline underline-offset-2"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
