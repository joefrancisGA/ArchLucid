import Link from "next/link";

import { OperatorDemoStaticBanner } from "@/components/OperatorDemoStaticBanner";
import {
  OperatorEvidenceLimitsFooter,
} from "@/components/OperatorEvidenceLimitsFooter";
import { ArtifactListTable } from "@/components/ArtifactListTable";
import { BuyerTitleHint } from "@/components/BuyerTitleHint";
import { ManifestDetailSummaryPanel } from "@/components/ManifestDetailSummaryPanel";
import { ManifestTopDecisionsCard } from "@/components/ManifestTopDecisionsCard";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import {
  OperatorEmptyState,
  OperatorMalformedCallout,
} from "@/components/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { getBundleDownloadUrl } from "@/lib/api";
import {
  SHOWCASE_BUYER_REVIEW_TITLE,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

import type { ManifestDetailPageSuccessModel } from "./manifest-detail-page-model";

type ManifestDetailPageViewProps = {
  readonly model: ManifestDetailPageSuccessModel;
};

/** Server-rendered success layout: manifest summary, findings card, artifacts, footer. */
export function ManifestDetailPageView(props: ManifestDetailPageViewProps) {
  const model = props.model;
  const { manifestId, buyerPolishedLayout, summary, artifacts } = model;

  const showcasePackage =
    summary.manifestId === SHOWCASE_STATIC_DEMO_MANIFEST_ID ||
    canonicalizeDemoRunId(summary.runId.trim()) === SHOWCASE_STATIC_DEMO_RUN_ID;

  const showcaseBuyerManifestHeadline =
    buyerPolishedLayout === true && showcasePackage === true;

  const primaryFindingHref = showcasePackage
    ? `/reviews/${encodeURIComponent(canonicalizeDemoRunId(summary.runId.trim()))}/findings/${encodeURIComponent(SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID)}`
    : null;

  const overviewSummaryCard = (
    <Card id="manifest-overview" className="scroll-mt-24">
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

  const decisionsLeadCard = <ManifestTopDecisionsCard summary={summary} buyerPolishedLayout={buyerPolishedLayout} />;

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

      {model.usedStaticDemoManifest && buyerPolishedLayout !== true ? <OperatorDemoStaticBanner /> : null}

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
        {buyerPolishedLayout !== true ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" asChild>
              <a href={getBundleDownloadUrl(manifestId)}>Export manifest bundle</a>
            </Button>
          </div>
        ) : null}
      </div>

      <p className="m-0 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
        {buyerPolishedLayout ? (
          <>
            {showcasePackage === true ? (
              <>
                This <strong>signed, versioned manifest</strong> is the authoritative reviewed architecture record for this
                package — decisions, findings, and downloadable deliverables.
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

      {showcaseBuyerManifestHeadline === true ? (
        <section
          aria-labelledby="manifest-authority-summary-heading"
          className="rounded-xl border-2 border-teal-600/70 bg-teal-50/60 p-4 shadow-sm dark:border-teal-500/40 dark:bg-teal-950/35"
          data-testid="manifest-buyer-authority-summary"
        >
          <h2 id="manifest-authority-summary-heading" className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100">
            What this signed manifest proves
          </h2>
          <p className="m-0 mt-2 max-w-prose text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
            This signed manifest is the authoritative reviewed architecture record for the Claims Intake Modernization
            package — decisions, findings, and downloadable deliverables.
          </p>
        </section>
      ) : null}

      {buyerPolishedLayout ? (
        <nav
          aria-label="On this page"
          className="flex flex-wrap gap-x-4 gap-y-1 rounded-md border border-neutral-200 bg-neutral-50/90 px-3 py-2 text-sm text-neutral-700 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-200"
        >
          <a className="font-medium text-teal-800 underline decoration-teal-700/30 underline-offset-2 dark:text-teal-300" href="#manifest-overview">
            Overview
          </a>
          <a
            className="font-medium text-teal-800 underline decoration-teal-700/30 underline-offset-2 dark:text-teal-300"
            href="#manifest-decisions"
          >
            Decisions
          </a>
          <a className="font-medium text-teal-800 underline decoration-teal-700/30 underline-offset-2 dark:text-teal-300" href="#manifest-bundle-zip">
            Bundle download
          </a>
          {summary.warningCount > 0 || summary.unresolvedIssueCount > 0 ? (
            <a
              className="font-medium text-teal-800 underline decoration-teal-700/30 underline-offset-2 dark:text-teal-300"
              href="#manifest-monitored-risk"
            >
              Monitored risk
            </a>
          ) : null}
          <a className="font-medium text-teal-800 underline decoration-teal-700/30 underline-offset-2 dark:text-teal-300" href="#manifest-ask">
            Diligence questions
          </a>
          <a
            className="font-medium text-teal-800 underline decoration-teal-700/30 underline-offset-2 dark:text-teal-300"
            href="#manifest-deliverables"
          >
            Deliverables
          </a>
        </nav>
      ) : null}

      {buyerPolishedLayout ? (
        <>
          {overviewSummaryCard}
          <div id="manifest-decisions" className="scroll-mt-24 space-y-6">
            {decisionsLeadCard}
          </div>
        </>
      ) : (
        <>
          {decisionsLeadCard}
          {overviewSummaryCard}
        </>
      )}

      {summary.warningCount > 0 || summary.unresolvedIssueCount > 0 ? (
        <Card
          id={buyerPolishedLayout ? "manifest-monitored-risk" : undefined}
          className={buyerPolishedLayout ? "scroll-mt-24" : undefined}
        >
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              {buyerPolishedLayout ? "Related monitored risk" : "Related findings"}
            </CardTitle>
            <CardDescription>
              {buyerPolishedLayout
                ? "This package records a monitored risk that maps back to the originating review and evidence trail."
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
                <dl className="m-0 grid gap-2 text-sm text-neutral-800 dark:text-neutral-200 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Severity
                    </dt>
                    <dd className="m-0 mt-0.5">High</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Risk area
                    </dt>
                    <dd className="m-0 mt-0.5">PHI minimization</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Disposition
                    </dt>
                    <dd className="m-0 mt-0.5">Accepted with monitoring</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Blocking status
                    </dt>
                    <dd className="m-0 mt-0.5">Non-blocking</dd>
                  </div>
                </dl>
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
                    ? "View PHI minimization risk and evidence"
                    : buyerPolishedLayout
                      ? "View findings on review"
                      : "Open review findings"}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {buyerPolishedLayout ? (
        <Card id="manifest-ask" className="scroll-mt-24 border border-blue-200/80 bg-blue-50/50 shadow-sm dark:border-blue-950/60 dark:bg-blue-950/25">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-50">Questions during diligence?</CardTitle>
            <CardDescription>
              Align questionnaire formats, bundled downloads, and security follow-ups through our Trust Center contact.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button variant="outline" size="sm" asChild>
              <Link href="/trust#trust-contact-review">Open Trust Center contact</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card
        id={buyerPolishedLayout ? "manifest-deliverables" : undefined}
        className={buyerPolishedLayout ? "scroll-mt-24" : undefined}
      >
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1.5">
            <CardTitle className="text-base font-semibold">
              {buyerPolishedLayout ? "Deliverables" : "Generated artifacts"}
            </CardTitle>
            <CardDescription>
              {buyerPolishedLayout
                ? "These deliverables package the executive decision, architecture review board record, and audit evidence for sign-off and diligence."
                : "Outputs produced during this review — available for preview and download."}
            </CardDescription>
          </div>
          {buyerPolishedLayout ? (
            <BuyerTitleHint text="Rows below list individual deliverable artifacts. Prefer the consolidated package download above when your workspace publishes a full bundle." />
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {!buyerPolishedLayout ? (
            <div>
              <Button variant="outline" size="sm" asChild>
                <a href={getBundleDownloadUrl(manifestId)}>Download bundle (ZIP)</a>
              </Button>
            </div>
          ) : null}

          {model.artifactsFailure && (
            <>
              <p className="m-0 text-sm font-semibold">
                {buyerPolishedLayout ? "Deliverables list could not be loaded." : "Artifact list could not be loaded."}
              </p>
              <OperatorApiProblem
                problem={model.artifactsFailure.problem}
                fallbackMessage={model.artifactsFailure.message}
                correlationId={model.artifactsFailure.correlationId}
                variant="warning"
              />
              <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
                {buyerPolishedLayout ? (
                  <>
                    Try reloading, or return to the review. You can still use Download finalized review package when the
                    bundle is available.
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

          {!model.artifactsFailure && model.artifactsMalformed && (
            <>
              <OperatorMalformedCallout>
                <strong>
                  {buyerPolishedLayout
                    ? "Deliverables response was not usable."
                    : "Artifact list response was not usable."}
                </strong>
                <p className="mt-2">{model.artifactsMalformed}</p>
              </OperatorMalformedCallout>
              <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
                {buyerPolishedLayout
                  ? "Try reloading, or return to the review. ZIP download may still work."
                  : "Try reloading, or return to the review detail page. Bundle download may still work."}
              </p>
            </>
          )}

          {!model.artifactsFailure && !model.artifactsMalformed && artifacts.length === 0 && (
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

          {!model.artifactsFailure && !model.artifactsMalformed && artifacts.length > 0 && buyerPolishedLayout ? (
            <details className="group rounded-md border border-neutral-200/90 bg-neutral-50/40 p-3 dark:border-neutral-800 dark:bg-neutral-950/30">
              <summary className="cursor-pointer select-none text-sm font-medium text-neutral-900 outline-none marker:text-neutral-500 focus-visible:ring-2 focus-visible:ring-teal-500/80 dark:text-neutral-100">
                Show deliverable artifacts ({artifacts.length})
              </summary>
              <div className="mt-4">
                <ArtifactListTable
                  manifestId={manifestId}
                  artifacts={artifacts}
                  sponsorMode={buyerPolishedLayout}
                  audienceSections={buyerPolishedLayout}
                />
              </div>
            </details>
          ) : null}
          {!model.artifactsFailure && !model.artifactsMalformed && artifacts.length > 0 && !buyerPolishedLayout ? (
            <ArtifactListTable
              manifestId={manifestId}
              artifacts={artifacts}
              sponsorMode={buyerPolishedLayout}
              audienceSections={buyerPolishedLayout}
            />
          ) : null}
        </CardContent>
      </Card>

      <OperatorEvidenceLimitsFooter
        runId={summary.runId}
        execution={model.manifestFooterExecution}
        showArchitectureReviewSummaryLink
      />
    </div>
  );
}
