"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

import { OperatorEmptyState } from "@/components/operator/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getGovernanceReviewsAwaitingAction,
  type GovernanceReviewAwaitingActionItem,
} from "@/lib/api/governance-stickiness-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

function formatRunId(runId: string): string {
  const normalized = runId.replace(/-/g, "");

  if (normalized.length <= 12) {
    return runId;
  }

  return `${normalized.slice(0, 8)}…${normalized.slice(-4)}`;
}

/** TB-263 — executed-but-uncommitted recurrence runs awaiting operator commit. */
export function ReviewsAwaitingActionCard() {
  const [items, setItems] = useState<GovernanceReviewAwaitingActionItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await getGovernanceReviewsAwaitingAction();
        if (!cancelled) {
          setItems(response.items ?? []);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load reviews awaiting action.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) {
    return <p className={cn("m-0 text-red-700 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}>{loadError}</p>;
  }

  if (items.length === 0) {
    return (
      <section data-testid="reviews-awaiting-action-card">
        <OperatorEmptyState title="No recurrence reviews awaiting your commit right now." />
      </section>
    );
  }

  return (
    <Card className="border-neutral-200 dark:border-neutral-800" data-testid="reviews-awaiting-action-card">
      <CardContent className="space-y-3 p-4">
        <h3 className={OPERATOR_TYPOGRAPHY.cardTitle}>Reviews awaiting your action</h3>
        <ul className="m-0 list-none space-y-3 p-0">
          {items.map((item) => {
            const runHex = item.runId.replace(/-/g, "");

            return (
              <li
                key={item.runId}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-3 last:border-0 last:pb-0 dark:border-neutral-800"
                data-testid={`reviews-awaiting-row-${runHex}`}
              >
                <div className="min-w-0">
                  <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>{item.name}</p>
                  <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                    Run {formatRunId(item.runId)}
                    {item.newFindingCount > 0 ? ` · ${item.newFindingCount} new finding(s)` : null}
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href={`/architecture/reviews/${runHex}`} data-testid={`reviews-awaiting-commit-${runHex}`}>
                    Review &amp; commit
                  </Link>
                </Button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
