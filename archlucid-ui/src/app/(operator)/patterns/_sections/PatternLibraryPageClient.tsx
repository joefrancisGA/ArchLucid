"use client";

import { useEffect, useState } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type PatternInsightCard = {
  patternKey: string;
  industryVertical: string;
  summary: string;
  contributingTenantCount: number;
};

export function PatternLibraryPageClient() {
  const [cards, setCards] = useState<PatternInsightCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const res = await fetch("/api/proxy/v1/analytics/patterns", {
          headers: { Accept: "application/json" },
        });

        const text = await res.text();

        if (!res.ok) {
          if (!cancelled) setError(text || `Request failed (${res.status})`);
          return;
        }

        const parsed = text.length > 0 ? (JSON.parse(text) as PatternInsightCard[]) : [];

        if (!cancelled) setCards(parsed);
      } catch (ex) {
        if (!cancelled) setError(ex instanceof Error ? ex.message : "Failed to load patterns.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="w-full max-w-[1200px] px-4 py-8">
      <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Pattern library</h1>
      <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        Anonymized aggregates (k ≥ 5 tenants). No tenant-identifying data is shown.
      </p>

      {loading ? <p className={cn("mt-6 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p> : null}

      {error ? (
        <p
          className={cn(
            "mt-6 rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-rose-700/50",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
          {error}
        </p>
      ) : null}

      {!loading && !error && cards.length === 0 ? (
        <p className={cn("mt-6 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No published patterns yet for your vertical.</p>
      ) : null}

      <ul className="mt-6 space-y-4">
        {cards.map((card) => (
          <li
            key={card.patternKey}
            className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{card.patternKey}</span>
              <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {card.industryVertical} · {card.contributingTenantCount} tenants
              </span>
            </div>
            <p className={cn("mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{card.summary}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
