import { cn } from "@/lib/utils";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import {
  OPERATOR_DISCLOSURE_TRIGGER_CLASS,
  OPERATOR_LINK,
  OPERATOR_NAV_GROUP_LABEL,
} from "@/lib/design-tokens";
import { getShowcaseSponsorHref } from "@/lib/buyer/buyer-safe-review-navigation";
import type { RunSummary } from "@/types/authority";

export type RunInspectorExploreActionsProps = {
  readonly run: RunSummary;
  readonly buyerPolished: boolean;
  readonly buyerSafePrimary: boolean;
  readonly showcaseStory: boolean;
  readonly showcaseUseWorkspaceQuickLinks: boolean;
  readonly primaryExplore: { readonly href: string; readonly label: string };
  readonly signedManifestExplore: { readonly href: string; readonly label: string };
  readonly workspaceHref: string;
  readonly showcaseWalkthroughHref: string;
  readonly graphEvidenceHref: string;
  readonly compareHref: string;
  readonly replayHref: string;
  readonly manifestHref: string;
  readonly findingHref: string;
  readonly hasFindingsLink: boolean;
  readonly hasArtifactsLink: boolean;
  readonly showEvidenceGraphCta: boolean;
  readonly findingsQuickHref: string;
  readonly artifactsQuickHref: string;
  readonly timelineQuickHref: string;
  readonly findingsQuickLabel: string;
  readonly timelineQuickLabel: string;
  readonly moreOpen: boolean;
  readonly onToggleMoreOpen: () => void;
};

export function RunInspectorExploreActions({
  run,
  buyerPolished,
  buyerSafePrimary,
  showcaseStory,
  showcaseUseWorkspaceQuickLinks,
  primaryExplore,
  signedManifestExplore,
  workspaceHref,
  showcaseWalkthroughHref,
  graphEvidenceHref,
  compareHref,
  replayHref,
  manifestHref,
  findingHref,
  hasFindingsLink,
  hasArtifactsLink,
  showEvidenceGraphCta,
  findingsQuickHref,
  artifactsQuickHref,
  timelineQuickHref,
  findingsQuickLabel,
  timelineQuickLabel,
  moreOpen,
  onToggleMoreOpen,
}: RunInspectorExploreActionsProps) {
  return (
    <>
      {/* Primary exploration — buyer shell leads with the full package; secondary links stay one click away under collapsible groups. */}
      <div className="space-y-2 border-t border-neutral-200 pt-3 dark:border-neutral-700">
        {buyerPolished ? (
          <>
            {!showcaseStory ? (
              <Button variant="primary" size="sm" className="w-full" asChild>
                <Link href={primaryExplore.href}>{primaryExplore.label}</Link>
              </Button>
            ) : null}
            <details className="rounded-md border border-neutral-200 bg-neutral-50/40 dark:border-neutral-700 dark:bg-neutral-950/20">
              <summary className={cn("cursor-pointer select-none px-3 py-2", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
                Related actions
              </summary>
              <div className="flex flex-col gap-2 border-t border-neutral-200 px-3 py-3 dark:border-neutral-700">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={signedManifestExplore.href}>{signedManifestExplore.label}</Link>
                </Button>
                {showEvidenceGraphCta ? (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={graphEvidenceHref}>View evidence graph</Link>
                  </Button>
                ) : null}
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/governance/approval-queue?runId=${encodeURIComponent(run.runId)}`}>View approval</Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={auditTrailNavHref(run.runId)}>View audit trail</Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/insights/ask-review-questions?runId=${encodeURIComponent(run.runId)}`}>Ask about this review</Link>
                </Button>
              </div>
            </details>
            <details className="rounded-md border border-neutral-200 bg-neutral-50/40 dark:border-neutral-700 dark:bg-neutral-950/20">
              <summary className={cn("cursor-pointer select-none px-3 py-2", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
                Open specific artifact
              </summary>
              <div className="flex flex-col gap-2 border-t border-neutral-200 px-3 py-3 dark:border-neutral-700">
                {buyerSafePrimary ? (
                  <>
                    {showcaseStory ? (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={getShowcaseSponsorHref()}>Sponsor report</Link>
                      </Button>
                    ) : null}
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={showcaseWalkthroughHref}>Read-only walkthrough</Link>
                    </Button>
                    {!(buyerPolished && showcaseStory) ? (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={workspaceHref}>Full review detail</Link>
                      </Button>
                    ) : null}
                  </>
                ) : null}

                {!(buyerSafePrimary && showcaseStory && !buyerPolished) ? (
                  <>
                    {!buyerSafePrimary ? (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={manifestHref}>{signedManifestExplore.label}</Link>
                      </Button>
                    ) : null}
                    {hasFindingsLink ? (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={findingsQuickHref}>{findingsQuickLabel}</Link>
                      </Button>
                    ) : null}
                    {hasArtifactsLink ? (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={artifactsQuickHref}>Deliverables</Link>
                      </Button>
                    ) : null}
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={timelineQuickHref}>{timelineQuickLabel}</Link>
                    </Button>
                  </>
                ) : null}
              </div>
            </details>
          </>
        ) : (
          <div
            className={cn(
              "grid gap-2",
              showEvidenceGraphCta ? "sm:grid-cols-3" : "sm:grid-cols-2",
            )}
          >
            <Button variant="primary" size="sm" className="w-full" asChild>
              <Link href={primaryExplore.href}>{primaryExplore.label}</Link>
            </Button>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href={signedManifestExplore.href}>{signedManifestExplore.label}</Link>
            </Button>
            {showEvidenceGraphCta ? (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={graphEvidenceHref}>View evidence graph</Link>
              </Button>
            ) : null}
          </div>
        )}
        {!buyerPolished ? (
          <>
            {showcaseStory || run.hasGraphSnapshot === true ? (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={graphEvidenceHref}>View evidence graph</Link>
              </Button>
            ) : null}
            {buyerSafePrimary ? (
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={showcaseWalkthroughHref}>Public walkthrough</Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={workspaceHref}>Technical workspace detail</Link>
                </Button>
              </div>
            ) : null}
            {!(buyerSafePrimary && showcaseStory && !buyerPolished) ? (
              <div>
                <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "text-neutral-500 dark:text-neutral-400")}>
                  Quick links
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {!buyerSafePrimary ? (
                    <Button variant="outline" size="sm" className="h-8" asChild>
                      <Link href={manifestHref}>{SIGNED_MANIFEST_LABEL}</Link>
                    </Button>
                  ) : null}
                  {hasFindingsLink ? (
                    <Button variant="outline" size="sm" className="h-8" asChild>
                      <Link href={findingsQuickHref}>{findingsQuickLabel}</Link>
                    </Button>
                  ) : null}
                  {hasArtifactsLink ? (
                    <Button variant="outline" size="sm" className="h-8" asChild>
                      <Link href={artifactsQuickHref}>Artifacts</Link>
                    </Button>
                  ) : null}
                  <Button variant="outline" size="sm" className="h-8" asChild>
                    <Link href={timelineQuickHref}>{timelineQuickLabel}</Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {!buyerPolished ? (
        <div>
          <button
            type="button"
            className={cn(OPERATOR_LINK.optional, "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200")}
            onClick={onToggleMoreOpen}
            aria-expanded={moreOpen ? "true" : "false"}
          >
            {moreOpen ? "▾ Less" : "▸ More actions"}
          </button>
          {moreOpen ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {showcaseStory ? (
                <>
                  <Button variant="outline" size="sm" className="h-8" asChild>
                    <Link href={findingHref}>Primary finding</Link>
                  </Button>
                  <Button variant="outline" size="sm" className="h-8" asChild>
                    <Link href={timelineQuickHref}>{timelineQuickLabel}</Link>
                  </Button>
                </>
              ) : null}
              {run.hasGraphSnapshot === true || showcaseStory ? (
                <Button variant="outline" size="sm" className="h-8" asChild>
                  <Link href={graphEvidenceHref}>Trail graph</Link>
                </Button>
              ) : null}
              <Button variant="outline" size="sm" className="h-8" asChild>
                <Link href={compareHref}>Compare</Link>
              </Button>
              <Button variant="outline" size="sm" className="h-8" asChild>
                <Link href={replayHref}>Replay</Link>
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
