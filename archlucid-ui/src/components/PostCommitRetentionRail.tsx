"use client";

import Link from "next/link";
import { useState, type ReactElement } from "react";

import { useEnterpriseMutationCapability } from "@/hooks/use-enterprise-mutation-capability";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { getShowcaseManifestHref } from "@/lib/buyer-safe-review-navigation";
import { SHOWCASE_STATIC_DEMO_MANIFEST_ID, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const canMutate: boolean = useEnterpriseMutationCapability();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const [nextCycleDialogOpen, setNextCycleDialogOpen] = useState(false);
  const showcaseSpine =
    buyerShowcaseQuickLinks && canonicalizeDemoRunId(runId) === SHOWCASE_STATIC_DEMO_RUN_ID;

  return (
    <Card className="border-teal-200 bg-teal-50/50 dark:border-teal-900 dark:bg-teal-950/20" data-testid="post-commit-retention-rail">
      <CardHeader className="pb-2">
        <h2 className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100">Recommended next steps</h2>
        <CardDescription className="text-neutral-700 dark:text-neutral-300">
          {buyerPolishedShell
            ? showcaseSpine
              ? "After the sample review, continue Executive Summary → signed manifest → evidence graph → governance approval → audit trail."
              : "Finalized package — use Executive Summary, then manifest, graph, governance, and audit trail in order."
            : "You have a committed review package. Pick the next loop that fits your team—navigation stays inside this workspace."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {buyerPolishedShell ? (
          <>
            <Button type="button" asChild variant="default" size="sm" className="justify-center sm:justify-start">
              <Link href={`/executive/reviews/${encodeURIComponent(runId)}`}>View Executive Summary</Link>
            </Button>
            <Button type="button" asChild variant="secondary" size="sm" className="justify-center sm:justify-start">
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
            {showcaseSpine ? null : (
              <details className="rounded-md border border-neutral-200 bg-white/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950/40">
                <summary className="cursor-pointer text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  After this review — optional follow-up package
                </summary>
                <div className="mt-3 flex flex-col gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-center sm:justify-start"
                    onClick={() => {
                      setNextCycleDialogOpen(true);
                    }}
                  >
                    Start follow-up review
                  </Button>
                  <Dialog open={nextCycleDialogOpen} onOpenChange={setNextCycleDialogOpen}>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Start follow-up review</DialogTitle>
                        <DialogDescription>
                          Start another review when you need a new governed package. Clone preserves lineage context where
                          your tenant allows it; fresh starts a clean wizard without inheriting attachments by default.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-3 py-2">
                        <Button asChild variant="default" className="w-full">
                          <Link
                            href={`/reviews/new?intent=revised-clone&cloneFromRunId=${encodeURIComponent(runId)}`}
                            onClick={() => {
                              setNextCycleDialogOpen(false);
                            }}
                          >
                            Clone from this review
                          </Link>
                        </Button>
                        <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
                          Prefer when scope shifts but continuity with this manifest package is expected.
                        </p>
                        <Button asChild variant="outline" className="w-full">
                          <Link
                            href="/reviews/new?intent=revised-fresh"
                            onClick={() => {
                              setNextCycleDialogOpen(false);
                            }}
                          >
                            Start fresh
                          </Link>
                        </Button>
                        <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
                          Prefer when the next cycle should not inherit this review&apos;s attachments by default.
                        </p>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setNextCycleDialogOpen(false)}>
                          Cancel
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </details>
            )}
          </>
        ) : (
          <Button type="button" asChild variant="default" size="sm" className="justify-center sm:justify-start">
            <Link href="/reviews/new" title="Start another architecture review with your repository inputs">
              Run again
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
