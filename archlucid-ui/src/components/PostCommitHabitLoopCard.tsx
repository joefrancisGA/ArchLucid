"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
  /** When the review package Do-this-next strip owns the page primary, keep only optional follow-ons here. */
  readonly pagePrimaryOwnedElsewhere?: boolean;
};

/**
 * Post-commit habit loop: exactly one primary next action and a short optional list.
 */
export function PostCommitHabitLoopCard({
  runId,
  showCompareCta = true,
  buyerShowcaseQuickLinks = false,
  goldenManifestId = null,
  pagePrimaryOwnedElsewhere = false,
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
      className="border-neutral-200 bg-al-surface-raised dark:border-neutral-800"
      data-testid="post-commit-habit-loop-card"
    >
      <CardHeader className="pb-2">
        <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Next after commit</h2>
        <CardDescription className="text-neutral-700 dark:text-neutral-300">
          {pagePrimaryOwnedElsewhere
            ? "Optional follow-ons after the Do this next step above — use only when you have a concrete question."
            : "One primary action for sponsor handoff; optional loops stay secondary unless you have a concrete question."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!pagePrimaryOwnedElsewhere ? (
          <div className="flex flex-col gap-2">
            <p className={cn("m-0 font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Primary
            </p>
            <Button
              type="button"
              asChild
              variant="primary"
              size="sm"
              className="w-fit justify-center sm:justify-start"
              data-testid="post-commit-habit-primary"
            >
              <Link href={loop.primary.href} title={loop.primary.description}>
                {loop.primary.label}
              </Link>
            </Button>
            <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>{loop.primary.description}</p>
          </div>
        ) : null}

        {pagePrimaryOwnedElsewhere || loop.optional.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className={cn("m-0 font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Optional
            </p>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {pagePrimaryOwnedElsewhere ? (
                <li key={loop.primary.id}>
                  <Link
                    href={loop.primary.href}
                    className={OPERATOR_BODY_INLINE_LINK_CLASS}
                    data-testid="post-commit-habit-primary-as-optional"
                    title={loop.primary.description}
                  >
                    {loop.primary.label}
                  </Link>
                  <span className={cn("block text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{loop.primary.description}</span>
                </li>
              ) : null}
              {loop.optional.map((action) => (
                <li key={action.id}>
                  <Link
                    href={action.href}
                    className={OPERATOR_BODY_INLINE_LINK_CLASS}
                    data-testid={`post-commit-habit-optional-${action.id}`}
                    title={action.description}
                  >
                    {action.label}
                  </Link>
                  <span className={cn("block text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{action.description}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
