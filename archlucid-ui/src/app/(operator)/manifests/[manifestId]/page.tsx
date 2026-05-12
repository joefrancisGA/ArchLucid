import Link from "next/link";

import { notFound } from "next/navigation";

import { OperatorDemoStaticBanner } from "@/components/OperatorDemoStaticBanner";
import {
  OperatorEvidenceLimitsFooter,
} from "@/components/OperatorEvidenceLimitsFooter";

import { ArtifactListTable } from "@/components/ArtifactListTable";
import { ManifestDetailSummaryPanel } from "@/components/ManifestDetailSummaryPanel";
import { ManifestTopDecisionsCard } from "@/components/ManifestTopDecisionsCard";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorErrorUiReferenceLine } from "@/components/OperatorErrorUiReferenceLine";
import {
  OperatorEmptyState,
  OperatorErrorCallout,
  OperatorMalformedCallout,
} from "@/components/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { isApiNotFoundFailure, toApiLoadFailure } from "@/lib/api-load-failure";
import {
  coerceArtifactDescriptorList,
  coerceManifestSummary,
} from "@/lib/operator-response-guards";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { tryStaticDemoArtifacts, tryStaticDemoManifestSummary } from "@/lib/operator-static-demo";
import { isInvalidManifestRouteId } from "@/lib/route-dynamic-param";
import {
  SHOWCASE_BUYER_REVIEW_TITLE,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";
import { getBundleDownloadUrl, getManifestSummary, listArtifacts } from "@/lib/api";
import { tryLoadRunExecutionFootnote } from "@/lib/try-load-run-execution-footnote";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { ArtifactDescriptor, ManifestSummary } from "@/types/authority";

/** Server-rendered manifest detail page. Shows manifest summary, artifacts table, and download links. */
export default async function ManifestDetailPage({
  params,
}: {
  params: Promise<{ manifestId: string }>;
}) {
  const { manifestId } = await params;

  const buyerPolishedLayout = isBuyerPolishedOperatorShellEnv();

  if (isInvalidManifestRouteId(manifestId)) {
    notFound();
  }

  let summary: ManifestSummary | null = null;
  let artifacts: ArtifactDescriptor[] = [];
  let summaryFailure: ApiLoadFailureState | null = null;
  let artifactsFailure: ApiLoadFailureState | null = null;
  let summaryMalformed: string | null = null;
  let artifactsMalformed: string | null = null;
  let usedStaticDemoManifest = false;

  try {
    const rawSummary: unknown = await getManifestSummary(manifestId);
    const coercedSummary = coerceManifestSummary(rawSummary);

    if (!coercedSummary.ok) {
      summaryMalformed = coercedSummary.message;
    } else {
      summary = coercedSummary.value;
    }
  } catch (e) {
    summaryFailure = toApiLoadFailure(e);
  }

  const staticSummaryFallback =
    summary === null ? tryStaticDemoManifestSummary(manifestId) : null;

  if (staticSummaryFallback !== null) {
    summary = staticSummaryFallback;
    summaryFailure = null;
    summaryMalformed = null;
    usedStaticDemoManifest = true;
  }

  if (summaryFailure !== null && isApiNotFoundFailure(summaryFailure)) {
    notFound();
  }

  try {
    const rawArtifacts: unknown = await listArtifacts(manifestId);
    const coercedArtifacts = coerceArtifactDescriptorList(rawArtifacts);

    if (!coercedArtifacts.ok) {
      artifacts = [];
      artifactsMalformed = coercedArtifacts.message;
    } else {
      artifacts = coercedArtifacts.items;
    }
  } catch (e) {
    artifactsFailure = toApiLoadFailure(e);
    const staticArtifacts =
      summary !== null ? tryStaticDemoArtifacts(summary.runId, manifestId) : null;

    if (staticArtifacts !== null) {
      artifacts = staticArtifacts;
      artifactsFailure = null;
      artifactsMalformed = null;
    }
  }

  if (summaryFailure) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-1 py-2 sm:px-0">
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-600 dark:text-neutral-400">
          <Link className="text-teal-800 underline dark:text-teal-300" href="/">
            Home
          </Link>
          {" · "}
          <Link className="text-teal-800 underline dark:text-teal-300" href="/reviews?projectId=default">
            Reviews
          </Link>
        </nav>
        <h1 className="m-0 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          {buyerPolishedLayout ? "Architecture review package" : "Finalized Architecture Manifest"}
        </h1>
        <p className="m-0 text-sm font-semibold">Manifest summary could not be loaded.</p>
        <OperatorApiProblem
          problem={summaryFailure.problem}
          fallbackMessage={summaryFailure.message}
          correlationId={summaryFailure.correlationId}
        />
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
          Try reloading, or return to the reviews list, open a review, then the manifest from review detail.
        </p>
        <p className="text-sm">
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/reviews?projectId=default">Reviews</Link>
        </p>
      </div>
    );
  }

  if (summaryMalformed) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-1 py-2 sm:px-0">
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-600 dark:text-neutral-400">
          <Link className="text-teal-800 underline dark:text-teal-300" href="/">
            Home
          </Link>
          {" · "}
          <Link className="text-teal-800 underline dark:text-teal-300" href="/reviews?projectId=default">
            Reviews
          </Link>
        </nav>
        <h1 className="m-0 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          {buyerPolishedLayout ? "Architecture review package" : "Finalized Architecture Manifest"}
        </h1>
        <OperatorMalformedCallout>
          <strong>Manifest summary response was not usable.</strong>
          <p className="mt-2">{summaryMalformed}</p>
        </OperatorMalformedCallout>
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
          The server response was unexpected. If this persists, contact support.
        </p>
        <p className="text-sm">
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/reviews?projectId=default">Reviews</Link>
        </p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-1 py-2 sm:px-0">
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-600 dark:text-neutral-400">
          <Link className="text-teal-800 underline dark:text-teal-300" href="/">
            Home
          </Link>
          {" · "}
          <Link className="text-teal-800 underline dark:text-teal-300" href="/reviews?projectId=default">
            Reviews
          </Link>
        </nav>
        <h1 className="m-0 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          {buyerPolishedLayout ? "Architecture review package" : "Finalized Architecture Manifest"}
        </h1>
        <OperatorErrorCallout>
          <strong>Manifest summary missing.</strong>
          <p className="mt-2">
            The response did not include manifest details. Try reloading once, or return from review detail instead
            of a pasted link.
          </p>
          <OperatorErrorUiReferenceLine />
        </OperatorErrorCallout>
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
          If this continues, try reloading, or return to the reviews list and open a review, then the manifest.
        </p>
        <p className="text-sm">
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/reviews?projectId=default">Reviews</Link>
        </p>
      </div>
    );
  }

  const manifestFooterExecution = await tryLoadRunExecutionFootnote(summary.runId.trim());

  const showcasePackage =
    summary.manifestId === SHOWCASE_STATIC_DEMO_MANIFEST_ID ||
    canonicalizeDemoRunId(summary.runId.trim()) === SHOWCASE_STATIC_DEMO_RUN_ID;

  const showcaseBuyerManifestHeadline =
    buyerPolishedLayout === true && showcasePackage === true;

  const primaryFindingHref = showcasePackage
    ? `/reviews/${encodeURIComponent(summary.runId)}/findings/${encodeURIComponent(SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID)}`
    : null;

  const overviewSummaryCard = (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{buyerPolishedLayout ? "Overview" : "Summary"}</CardTitle>
        <CardDescription>
          {buyerPolishedLayout
            ? "Status, policy posture, and what is included in this package."
            : "Status, rules, and counts for this manifest."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ManifestDetailSummaryPanel summary={summary} buyerPolishedLayout={buyerPolishedLayout} />
      </CardContent>
    </Card>
  );

  const decisionsLeadCard =
    !buyerPolishedLayout || !showcasePackage ? (
      <ManifestTopDecisionsCard summary={summary} buyerPolishedLayout={buyerPolishedLayout} />
    ) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-1 py-2 sm:px-0">
      <nav aria-label="Breadcrumb" className="text-sm text-neutral-600 dark:text-neutral-400">
        <Link className="text-teal-800 underline dark:text-teal-300" href="/">
          Home
        </Link>
        {" · "}
        <Link className="text-teal-800 underline dark:text-teal-300" href="/reviews?projectId=default">
          Reviews
        </Link>
        {" · "}
        <Link className="text-teal-800 underline dark:text-teal-300" href={`/reviews/${summary.runId}`}>
          {buyerPolishedLayout === true && showcasePackage === true
            ? SHOWCASE_BUYER_REVIEW_TITLE
            : "Open review"}
        </Link>
        {" · "}
        <span className="font-medium text-neutral-800 dark:text-neutral-200" aria-current="page">
          {buyerPolishedLayout === true && showcasePackage === true
            ? "Signed manifest for this package"
            : "Manifest"}
        </span>
        {showcasePackage === true && buyerPolishedLayout !== true ? (
          <>
            {" · "}
            <Link
              className="text-teal-800 underline dark:text-teal-300"
              href={`/showcase/${encodeURIComponent(summary.runId)}`}
            >
              Public showcase
            </Link>
          </>
        ) : null}
      </nav>

      {usedStaticDemoManifest ? <OperatorDemoStaticBanner /> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <h1 className="m-0 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            {showcaseBuyerManifestHeadline === true
              ? "Signed manifest — Claims Intake Modernization Review Package"
              : buyerPolishedLayout
                ? "Architecture review package"
                : "Finalized Architecture Manifest"}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" asChild>
            <a href={getBundleDownloadUrl(manifestId)}>
              {buyerPolishedLayout ? "Download evidence package (ZIP)" : "Export manifest bundle"}
            </a>
          </Button>
        </div>
      </div>

      <p className="m-0 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
        {buyerPolishedLayout ? (
          <>
            {showcasePackage === true ? (
              <>
                This <strong>signed, versioned manifest</strong> is the reviewed architecture record for this package —
                decisions, findings, and downloadable deliverables.
              </>
            ) : (
              <>
                This is the reviewed, versioned record for the architecture review: decisions, findings, and the files you can
                open or download.
              </>
            )}
          </>
        ) : (
          <>
            A finalized manifest is the reviewed, versioned architecture record for this review. It captures decisions,
            findings, and the downloadable artifact bundle linked from review detail.
          </>
        )}
      </p>

      {buyerPolishedLayout ? (
        <>
          {overviewSummaryCard}
          {decisionsLeadCard}
        </>
      ) : (
        <>
          {decisionsLeadCard}
          {overviewSummaryCard}
        </>
      )}

      {summary.warningCount > 0 || summary.unresolvedIssueCount > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Related findings</CardTitle>
            <CardDescription>
              {buyerPolishedLayout
                ? "Open items tied to this package also appear on the originating review."
                : "Warnings or unresolved issues on this manifest correspond to surfaced findings on the originating review."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="m-0 max-w-prose text-sm text-neutral-700 dark:text-neutral-300">
              {buyerPolishedLayout
                ? "Use the review summary to open each finding with full context and trace detail when available."
                : "Open the aggregate architecture review summary on review detail — per-finding links appear when trace confidence rows are available."}
            </p>
            {buyerPolishedLayout && primaryFindingHref ? (
                <div className="mt-3 space-y-3 rounded-lg border border-amber-200/90 bg-amber-50/80 p-3 dark:border-amber-900/60 dark:bg-amber-950/25">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-amber-700 text-white hover:bg-amber-700">High severity</Badge>
                    <p className="m-0 text-xs font-semibold uppercase tracking-wide text-amber-950/90 dark:text-amber-100/90">
                      PHI minimization — monitored control
                    </p>
                  </div>
                  <ul className="m-0 list-none space-y-2 p-0 text-sm leading-snug text-neutral-800 dark:text-neutral-200">
                    <li>
                      <strong className="text-neutral-900 dark:text-neutral-100">Risk:</strong> expanded breach and audit
                      scope if minimization is understated.
                    </li>
                    <li>
                      <strong className="text-neutral-900 dark:text-neutral-100">Mitigation:</strong> classification at
                      ingress, adapter boundaries, retention controls tied to evidence in this package.
                    </li>
                    <li>
                      <strong className="text-neutral-900 dark:text-neutral-100">Validation:</strong> trace exception paths
                      and attachment volume through go-live monitoring.
                    </li>
                  </ul>
                </div>
            ) : null}
            <div className="mt-4">
              <Button variant="secondary" size="sm" asChild>
                <Link
                  href={
                    primaryFindingHref ?? `/reviews/${encodeURIComponent(summary.runId)}#run-explanation`
                  }
                >
                  {primaryFindingHref
                    ? "High severity · PHI minimization · open finding detail"
                    : buyerPolishedLayout
                      ? "View findings on review"
                      : "Open review findings"}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            {buyerPolishedLayout ? "Deliverables" : "Generated artifacts"}
          </CardTitle>
          <CardDescription>
            {buyerPolishedLayout
              ? "Files produced for this review — open in the browser or download."
              : "Outputs produced during this review — available for preview and download."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button variant={buyerPolishedLayout ? "primary" : "outline"} size="sm" asChild>
              <a href={getBundleDownloadUrl(manifestId)}>
                {buyerPolishedLayout ? "Download evidence package (ZIP)" : "Download bundle (ZIP)"}
              </a>
            </Button>
          </div>

          {artifactsFailure && (
            <>
              <p className="m-0 text-sm font-semibold">
                {buyerPolishedLayout ? "Deliverables list could not be loaded." : "Artifact list could not be loaded."}
              </p>
              <OperatorApiProblem
                problem={artifactsFailure.problem}
                fallbackMessage={artifactsFailure.message}
                correlationId={artifactsFailure.correlationId}
                variant="warning"
              />
              <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
                {buyerPolishedLayout ? (
                  <>
                    Try reloading, or return to the review. You can still use Download all files (ZIP) when the bundle is
                    available.
                  </>
                ) : (
                  <>
                    Try reloading, or return to the review detail page. You can still use Download bundle (ZIP) if the list
                    endpoint is unavailable.
                  </>
                )}
              </p>
            </>
          )}

          {!artifactsFailure && artifactsMalformed && (
            <>
              <OperatorMalformedCallout>
                <strong>
                  {buyerPolishedLayout
                    ? "Deliverables response was not usable."
                    : "Artifact list response was not usable."}
                </strong>
                <p className="mt-2">{artifactsMalformed}</p>
              </OperatorMalformedCallout>
              <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
                {buyerPolishedLayout
                  ? "Try reloading, or return to the review. ZIP download may still work."
                  : "Try reloading, or return to the review detail page. Bundle download may still work."}
              </p>
            </>
          )}

          {!artifactsFailure && !artifactsMalformed && artifacts.length === 0 && (
            <OperatorEmptyState title={buyerPolishedLayout ? "No deliverables listed yet" : "No artifacts listed for this manifest"}>
              {buyerPolishedLayout ? (
                <>
                  <p className="m-0">
                    The overview loaded, but no individual files are listed yet. Try the ZIP if your workspace publishes a
                    bundle for this review.
                  </p>
                  <p className="m-0 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                    This is a <strong>valid empty result</strong> (the deliverables list succeeded with zero items), not an
                    artifact-list failure. <strong>Bundle ZIP may return 404</strong> when no packaged bundle exists yet.
                  </p>
                </>
              ) : (
                <>
                  <p className="m-0">
                    The summary loaded, but the artifact descriptor list is empty. Bundle download may be available when
                    there is a bundle.
                  </p>
                  <p className="m-0 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                    This is a <strong>valid empty result</strong> (HTTP 200 with an empty list), not a failed artifact-list
                    request. <strong>Bundle ZIP may return 404</strong> when no packaged bundle exists yet.
                  </p>
                </>
              )}
            </OperatorEmptyState>
          )}

          {!artifactsFailure && !artifactsMalformed && artifacts.length > 0 && (
            <ArtifactListTable
              manifestId={manifestId}
              artifacts={artifacts}
              sponsorMode={buyerPolishedLayout}
              audienceSections={buyerPolishedLayout}
            />
          )}
        </CardContent>
      </Card>

      <OperatorEvidenceLimitsFooter
        runId={summary.runId}
        execution={manifestFooterExecution}
        showArchitectureReviewSummaryLink
      />
    </div>
  );
}
