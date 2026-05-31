"use client";

import { useEffect, useState } from "react";

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
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Pattern library</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        Anonymized aggregates (k ≥ 5 tenants). No tenant-identifying data is shown.
      </p>

      {loading ? <p className="mt-6 text-sm text-neutral-500">Loading…</p> : null}

      {error ? (
        <p className="mt-6 rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-rose-700/50 px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}

      {!loading && !error && cards.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">No published patterns yet for your vertical.</p>
      ) : null}

      <ul className="mt-6 space-y-4">
        {cards.map((card) => (
          <li
            key={card.patternKey}
            className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-neutral-900 dark:text-neutral-100">{card.patternKey}</span>
              <span className="text-xs text-neutral-500">
                {card.industryVertical} · {card.contributingTenantCount} tenants
              </span>
            </div>
            <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{card.summary}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
