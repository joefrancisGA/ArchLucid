"use client";

import Link from "next/link";
import { useState, type ReactElement } from "react";

import { useEnterpriseMutationCapability } from "@/hooks/use-enterprise-mutation-capability";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
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
};

/**
 * After a committed architecture manifest exists, surface three concrete operating loops (second run, weekly habit, connectors).
 */
export function PostCommitRetentionRail({
  runId,
  showCompareCta = true,
}: PostCommitRetentionRailProps): ReactElement {
  const canMutate: boolean = useEnterpriseMutationCapability();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const [revisedChooserOpen, setRevisedChooserOpen] = useState(false);

  return (
    <Card className="border-teal-200 bg-teal-50/50 dark:border-teal-900 dark:bg-teal-950/20" data-testid="post-commit-retention-rail">
      <CardHeader className="pb-2">
        <h2 className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100">Recommended next steps</h2>
        <CardDescription className="text-neutral-700 dark:text-neutral-300">
          {buyerPolishedShell
            ? "This review is finalized. Share the executive view with sponsors, route the finding through remediation, or start a revised review when scope changes."
            : "You have a committed review package. Pick the next loop that fits your team—navigation stays inside this workspace."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {buyerPolishedShell ? (
          <>
            <Button
              type="button"
              variant="default"
              size="sm"
              className="justify-center sm:justify-start"
              onClick={() => {
                setRevisedChooserOpen(true);
              }}
            >
              Create revised review
            </Button>
            <Dialog open={revisedChooserOpen} onOpenChange={setRevisedChooserOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create a revised review</DialogTitle>
                  <DialogDescription>
                    Pick how prior context carries forward. Both paths use the same wizard; backend lineage attachment is
                    tenant-dependent.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <Button asChild variant="default" className="w-full">
                    <Link
                      href={`/reviews/new?intent=revised-clone&cloneFromRunId=${encodeURIComponent(runId)}`}
                      onClick={() => {
                        setRevisedChooserOpen(false);
                      }}
                    >
                      Clone from this review
                    </Link>
                  </Button>
                  <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
                    Prefer when scope shifts but regulators expect continuity with this manifest package.
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <Link
                      href="/reviews/new?intent=revised-fresh"
                      onClick={() => {
                        setRevisedChooserOpen(false);
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
                  <Button type="button" variant="ghost" onClick={() => setRevisedChooserOpen(false)}>
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
            <Link href={`/compare?leftRunId=${encodeURIComponent(runId)}`} title="Compare this review to another finalized review">
              Compare with another review
            </Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
