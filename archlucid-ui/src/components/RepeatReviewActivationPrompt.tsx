"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useMemo, type ReactElement } from "react";

import { OperatorHomeGuidanceLink } from "@/components/operator-home/OperatorHomeGuidanceLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  resolveRepeatReviewActivation,
  type RepeatReviewActivationPrompt,
} from "@/lib/repeat-review-activation";
import { REPEAT_REVIEW_LOOP_HELP_INBOUND_LABEL } from "@/lib/repeat-review-loop-help-title-honesty-surfaces";

/**
 * Non-blocking repeat-review activation rail (assessment improvement #24).
 */
export function RepeatReviewActivationPrompt(): ReactElement | null {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const { data, isPending } = useCorePilotCommitContextQuery();

  const prompt = useMemo((): RepeatReviewActivationPrompt | null => {
    if (isPending || data === undefined) {
      return null;
    }

    return resolveRepeatReviewActivation({
      committedReviewCount: data.committedReviewCount,
      latestRunId: data.latestRunId,
      firstCommittedRunId: data.firstCommittedRunId,
      secondCommittedRunId: data.secondCommittedRunId,
    });
  }, [data, isPending]);

  if (prompt === null) {
    return null;
  }

  return (
    <section aria-labelledby="repeat-review-activation-heading" data-testid="repeat-review-activation">
      <Card className="border-neutral-200 bg-al-surface-raised dark:border-neutral-800">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="repeat-review-activation-heading"
              className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}
            >
              {prompt.headline}
            </h2>
          </div>
        </CardHeader>
        <CardContent className={cn("space-y-3 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          <OperatorHomeGuidanceLink helpSlug="repeat-review-loop" label={REPEAT_REVIEW_LOOP_HELP_INBOUND_LABEL} />
          <p className="m-0">{prompt.summary}</p>
          <div>
            <Button asChild size="sm" variant="default">
              <Link href={prompt.primaryHref}>{prompt.primaryCta}</Link>
            </Button>
          </div>
          <ul className="m-0 list-none space-y-2 p-0">
            {prompt.actions.map((action) => (
              <li key={action.label}>
                <Link
                  href={action.href}
                  className={OPERATOR_BODY_INLINE_LINK_CLASS}
                >
                  {action.label}
                </Link>
                <p className={cn("m-0 mt-0.5 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{action.reason}</p>
              </li>
            ))}
          </ul>
          {buyerPolishedShell ? (
            <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Optional follow-up — not required to finish your first proof export.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
