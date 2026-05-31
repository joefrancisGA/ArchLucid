"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { useOperateCapability } from "@/hooks/use-operate-capability";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { getShowcaseManifestHref } from "@/lib/buyer-safe-review-navigation";
import { SHOWCASE_STATIC_DEMO_MANIFEST_ID, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

type PostCommitRetentionRailProps = {
  readonly runId: string;
  /** When false, hides compare — avoids a dead-end CTA when the workspace has only one review. */
  readonly showCompareCta?: boolean;
  /** Curated demo spine — adds compact links for the polished buyer path (PHI risk, evidence graph, audit trail). */
  readonly buyerShowcaseQuickLinks?: boolean;
  /** Present after finalize — unlocks manifest package deep link on the polished demo row. */
  readonly goldenManifestId?: string | null;
};

/**
 * After a committed architecture manifest exists, surface three concrete operating loops (second run, weekly habit, connectors).
 */
export function PostCommitRetentionRail({
  runId,
  showCompareCta = true,
  buyerShowcaseQuickLinks = false,
  goldenManifestId = null,
}: PostCommitRetentionRailProps): ReactElement {
  const canMutate: boolean = useOperateCapability();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const showcaseSpine =
    buyerShowcaseQuickLinks && canonicalizeDemoRunId(runId) === SHOWCASE_STATIC_DEMO_RUN_ID;

  return (
    <Card className="border-neutral-200 bg-al-surface-raised dark:border-neutral-800" data-testid="post-commit-retention-rail">
      <CardHeader className="pb-2">
        <h2 className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100">Recommended next steps</h2>
        <CardDescription className="text-neutral-700 dark:text-neutral-300">
          {buyerPolishedShell
            ? showcaseSpine
              ? "After the sample review, continue Executive Summary → signed manifest → evidence trail → governance approval → audit trail."
              : "Finalized package — use Executive Summary, then manifest, evidence trail, governance, and audit trail in order."
            : "You have a committed review package. Pick the next loop that fits your team—navigation stays inside this workspace."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {buyerPolishedShell ? (
          <>
            {/*
              Executive summary is already the prominent CTA on review detail; this rail continues the package path.
            */}
            <Button type="button" asChild variant="default" size="sm" className="justify-center sm:justify-start">
              <Link href={`/governance?runId=${encodeURIComponent(runId)}`}>View governance approval</Link>
            </Button>
            {goldenManifestId !== null && goldenManifestId.trim().length > 0 ? (
              <Button type="button" asChild variant="secondary" size="sm" className="justify-center sm:justify-start">
                <Link
                  href={
                    canonicalizeDemoRunId(runId) === SHOWCASE_STATIC_DEMO_RUN_ID &&
                    goldenManifestId.trim() === SHOWCASE_STATIC_DEMO_MANIFEST_ID
                      ? getShowcaseManifestHref()
                      : `/manifests/${encodeURIComponent(goldenManifestId.trim())}`
                  }
                >
                  View signed manifest
                </Link>
              </Button>
            ) : null}
          </>
        ) : (
          <Button type="button" asChild variant="default" size="sm" className="justify-center sm:justify-start">
            <Link href="/reviews/new" title="Start another architecture review with your repository inputs">
              Review again
            </Link>
          </Button>
        )}
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
        {showCompareCta ? (
          <Button type="button" asChild variant="outline" size="sm" className="justify-center sm:justify-start">
            <Link href={comparePageHrefAdaptive(runId)} title="Compare this review to another finalized review">
              Compare with another review
            </Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
