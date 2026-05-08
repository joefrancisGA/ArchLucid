"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { useEnterpriseMutationCapability } from "@/hooks/use-enterprise-mutation-capability";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

type PostCommitRetentionRailProps = {
  readonly runId: string;
};

/**
 * After a committed architecture manifest exists, surface three concrete operating loops (second run, weekly habit, connectors).
 */
export function PostCommitRetentionRail({ runId }: PostCommitRetentionRailProps): ReactElement {
  const canMutate: boolean = useEnterpriseMutationCapability();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <Card className="border-teal-200 bg-teal-50/50 dark:border-teal-900 dark:bg-teal-950/20" data-testid="post-commit-retention-rail">
      <CardHeader className="pb-2">
        <h2 className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100">Keep the momentum</h2>
        <CardDescription className="text-neutral-700 dark:text-neutral-300">
          You have a committed review package. Pick the next loop that fits your team—navigation stays inside this workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button type="button" asChild variant="default" size="sm" className="justify-center sm:justify-start">
          <Link href="/reviews/new" title="Start another architecture review with your repository inputs">
            {buyerPolishedShell ? "Create revised review" : "Run again"}
          </Link>
        </Button>
        {!buyerPolishedShell ? (
          <>
            <Button type="button" asChild variant="secondary" size="sm" className="justify-center sm:justify-start">
              <Link href="/digests" title="Advisory scans, architecture digests, and executive email">
                Weekly architecture digest
              </Link>
            </Button>
            <Button type="button" asChild variant="secondary" size="sm" className="justify-center sm:justify-start">
              <Link
                href="/integrations/operations"
                title={canMutate ? "Connector readiness and Service Bus posture" : "View connector readiness (read-only at your rank)"}
              >
                Connector operations
              </Link>
            </Button>
          </>
        ) : null}
        <Button type="button" asChild variant="outline" size="sm" className="justify-center sm:justify-start">
          <Link href={`/compare?leftRunId=${encodeURIComponent(runId)}`} title="Compare this review to another finalized review">
            Compare with another review
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
