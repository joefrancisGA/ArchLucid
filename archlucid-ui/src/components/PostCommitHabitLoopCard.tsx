"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { buildPostCommitHabitLoop } from "@/lib/post-commit-habit-loop";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

type PostCommitHabitLoopCardProps = {
  readonly runId: string;
  readonly showCompareCta?: boolean;
  readonly buyerShowcaseQuickLinks?: boolean;
  readonly goldenManifestId?: string | null;
};

/**
 * Post-commit habit loop: exactly one primary next action and a short optional list.
 */
export function PostCommitHabitLoopCard({
  runId,
  showCompareCta = true,
  buyerShowcaseQuickLinks = false,
  goldenManifestId = null,
}: PostCommitHabitLoopCardProps): ReactElement {
  const loop = buildPostCommitHabitLoop({
    runId,
    manifestId: goldenManifestId,
    showCompareCta,
    buyerShowcaseQuickLinks,
    goldenManifestId,
  });

  return (
    <Card
      className="border-teal-200 bg-teal-50/50 dark:border-teal-900 dark:bg-teal-950/20"
      data-testid="post-commit-habit-loop-card"
    >
      <CardHeader className="pb-2">
        <h2 className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100">Next after commit</h2>
        <CardDescription className="text-neutral-700 dark:text-neutral-300">
          One primary action for sponsor handoff; optional loops stay secondary unless you have a concrete question.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
            Primary
          </p>
          <Button
            type="button"
            asChild
            variant="default"
            size="sm"
            className="w-fit justify-center sm:justify-start"
            data-testid="post-commit-habit-primary"
          >
            <Link href={loop.primary.href} title={loop.primary.description}>
              {loop.primary.label}
            </Link>
          </Button>
          <p className="m-0 text-sm text-neutral-700 dark:text-neutral-300">{loop.primary.description}</p>
        </div>

        {loop.optional.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
              Optional
            </p>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {loop.optional.map((action) => (
                <li key={action.id}>
                  <Link
                    href={action.href}
                    className="text-sm font-medium text-teal-800 underline-offset-2 hover:underline dark:text-teal-300"
                    data-testid={`post-commit-habit-optional-${action.id}`}
                    title={action.description}
                  >
                    {action.label}
                  </Link>
                  <span className="block text-xs text-neutral-600 dark:text-neutral-400">{action.description}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
