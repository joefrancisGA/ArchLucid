"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useState } from "react";

import type { components } from "@/lib/api-types.generated";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

import { buildProductLearningPlanningMaterializeUrl } from "./planning-materialize-url";
import {
  listPlanningRetrievalCitations,
  planningRetrievalCitationKey,
} from "./planning-retrieval-citations";

type MaterializeResult = components["schemas"]["ProductLearningPlanningMaterializeResult"];

type Props = {
  readonly since: string | null;
  readonly disabled: boolean;
};

/**
 * Convert ranked pilot-feedback opportunities into draft improvement plans (59R).
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
      const res = await fetch(
        url,
        mergeRegistrationScopeForProxy({
          method: "POST",
          credentials: "include",
        }),
      );

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
  const retrievalCitations = listPlanningRetrievalCitations(result?.retrievalCitations);

  return (
    <section className="mb-7" aria-labelledby="pl-planning-bridge-heading">
      <h3 id="pl-planning-bridge-heading" className={cn("mb-1", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        Create improvement plan drafts
      </h3>
      <p className={cn("mt-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>
        Convert recurring feedback themes into draft improvement plans for review. Uses the same scope and time range as
        the dashboard above.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className={cn("flex flex-col gap-1", OPERATOR_TYPOGRAPHY.body)}>
          <span className={OPERATOR_TYPOGRAPHY.helper}>Maximum drafts to create (1–50)</span>
          <input
            type="number"
            min={1}
            max={50}
            value={maxPlans}
            disabled={blocked}
            aria-label="Maximum draft plans to create per request"
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10);

              if (Number.isFinite(n)) {
                setMaxPlans(Math.min(50, Math.max(1, n)));
              }
            }}
            className={cn(
              "w-28 rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-900",
              OPERATOR_TYPOGRAPHY.body,
            )}
          />
        </label>
        <button
          type="button"
          className={cn(
            "rounded-md bg-neutral-900 px-3 py-2 text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white",
            OPERATOR_TYPOGRAPHY.button,
          )}
          disabled={blocked}
          onClick={() => void materialize()}
        >
          {busy ? "Creating drafts…" : "Create draft plans"}
        </button>
        <Link href="/insights/improvement-planning" className={OPERATOR_LINK.inline}>
          Open planning browse →
        </Link>
      </div>

      {errorText !== null ? (
        <div
          className={cn(
            "mt-3 rounded-md border border-rose-600/40 bg-al-surface-raised p-3 text-al-text-primary dark:border-rose-700/50",
            OPERATOR_TYPOGRAPHY.body,
          )}
          role="alert"
        >
          {errorText}
        </div>
      ) : null}

      {result !== null ? (
        <div
          className={cn(
            "mt-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/60",
            OPERATOR_TYPOGRAPHY.body,
          )}
          role="status"
        >
          <p className={cn("m-0 font-medium text-neutral-800 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Draft plans created
          </p>
          <ul className="mt-2 list-none space-y-1 p-0 text-neutral-700 dark:text-neutral-300">
            <li>Themes created: {result.themesInserted ?? 0}</li>
            <li>Plans created: {result.plansInserted ?? 0}</li>
            <li>Already existed (skipped): {result.skippedExistingThemeKeys ?? 0}</li>
            <li>Feedback items linked: {result.signalLinksInserted ?? 0}</li>
          </ul>
          {retrievalCitations.length > 0 ? (
            <div className="mt-3" data-testid="planning-bridge-retrieval-citations">
              <p className={cn("m-0 font-medium text-neutral-800 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
                Related pilot signals (semantic retrieval)
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-neutral-700 dark:text-neutral-300">
                {retrievalCitations.map((citation, index) => (
                  <li key={planningRetrievalCitationKey(citation, index)}>
                    {citation.themeKey ? (
                      <span className="font-medium">{citation.themeKey}: </span>
                    ) : null}
                    {citation.snippet ?? "Related pilot signal"}
                    {citation.signalId ? (
                      <span className="block text-neutral-500 dark:text-neutral-400">
                        Signal {citation.signalId}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
