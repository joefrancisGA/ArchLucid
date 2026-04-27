import Link from "next/link";

import { ArtifactListTable } from "@/components/ArtifactListTable";
import { CopyIdButton } from "@/components/CopyIdButton";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import {
  OperatorEmptyState,
  OperatorErrorCallout,
  OperatorMalformedCallout,
} from "@/components/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { coerceArtifactDescriptorList, coerceManifestSummary } from "@/lib/operator-response-guards";
import { getBundleDownloadUrl, getManifestSummary, listArtifacts } from "@/lib/api";
import type { ArtifactDescriptor, ManifestSummary } from "@/types/authority";

function manifestStatusForDisplay(status: string): string {
  const t = status.trim();

  if (/^committed$/i.test(t)) {
    return "Finalized";
  }

  return t;
}

/** Server-rendered manifest detail page. Shows manifest summary, artifacts table, and download links. */
export default async function ManifestDetailPage({
  params,
}: {
  params: Promise<{ manifestId: string }>;
}) {
  const { manifestId } = await params;

  let summary: ManifestSummary | null = null;
  let artifacts: ArtifactDescriptor[] = [];
  let summaryFailure: ApiLoadFailureState | null = null;
  let artifactsFailure: ApiLoadFailureState | null = null;
  let summaryMalformed: string | null = null;
  let artifactsMalformed: string | null = null;

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
  }

  if (summaryFailure) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 px-1 py-2 sm:px-0">
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-600 dark:text-neutral-400">
          <Link className="text-teal-800 underline dark:text-teal-300" href="/">
            Home
          </Link>
          {" · "}
          <Link className="text-teal-800 underline dark:text-teal-300" href="/runs?projectId=default">
            Runs
          </Link>
        </nav>
        <h1 className="m-0 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Finalized architecture manifest
        </h1>
        <p className="m-0 text-sm font-semibold">Manifest summary could not be loaded.</p>
        <OperatorApiProblem
          problem={summaryFailure.problem}
          fallbackMessage={summaryFailure.message}
          correlationId={summaryFailure.correlationId}
        />
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
          Try reloading, or return to the run list and open a run, then the manifest from run detail.
        </p>
        <p className="text-sm">
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/runs?projectId=default">Runs</Link>
        </p>
      </main>
    );
  }

  if (summaryMalformed) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 px-1 py-2 sm:px-0">
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-600 dark:text-neutral-400">
          <Link className="text-teal-800 underline dark:text-teal-300" href="/">
            Home
          </Link>
          {" · "}
          <Link className="text-teal-800 underline dark:text-teal-300" href="/runs?projectId=default">
            Runs
          </Link>
        </nav>
        <h1 className="m-0 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Finalized architecture manifest
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
          <Link href="/runs?projectId=default">Runs</Link>
        </p>
      </main>
    );
  }

  if (!summary) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 px-1 py-2 sm:px-0">
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-600 dark:text-neutral-400">
          <Link className="text-teal-800 underline dark:text-teal-300" href="/">
            Home
          </Link>
          {" · "}
          <Link className="text-teal-800 underline dark:text-teal-300" href="/runs?projectId=default">
            Runs
          </Link>
        </nav>
        <h1 className="m-0 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Finalized architecture manifest
        </h1>
        <OperatorErrorCallout>
          <strong>Manifest summary missing.</strong>
          <p className="mt-2">
            The response did not include manifest details. Try reloading once, or return from run detail instead
            of a pasted link.
          </p>
        </OperatorErrorCallout>
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
          If this continues, try reloading, or return to the run list and open a run, then the manifest.
        </p>
        <p className="text-sm">
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/runs?projectId=default">Runs</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-1 py-2 sm:px-0">
      <nav aria-label="Breadcrumb" className="text-sm text-neutral-600 dark:text-neutral-400">
        <Link className="text-teal-800 underline dark:text-teal-300" href="/">
          Home
        </Link>
        {" · "}
        <Link className="text-teal-800 underline dark:text-teal-300" href="/runs?projectId=default">
          Runs
        </Link>
        {" · "}
        <Link className="text-teal-800 underline dark:text-teal-300" href={`/runs/${summary.runId}`}>
          Run detail
        </Link>
      </nav>

      <h1 className="m-0 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        Finalized architecture manifest
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Summary</CardTitle>
          <CardDescription>Status, rules, and counts for this manifest.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {summary.operatorSummary ? (
            <p className="m-0 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {summary.operatorSummary}
            </p>
          ) : null}
          <dl className="m-0 grid gap-3 sm:grid-cols-[minmax(8rem,auto)_1fr] sm:gap-x-6">
            <dt className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Manifest ID</dt>
            <dd className="m-0 flex min-w-0 flex-wrap items-center gap-2 text-sm text-neutral-900 dark:text-neutral-100">
              <code className="min-w-0 break-all font-mono text-xs">{summary.manifestId}</code>
              <CopyIdButton value={summary.manifestId} aria-label="Copy manifest ID" />
            </dd>
            <dt className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Status</dt>
            <dd className="m-0 text-sm text-neutral-900 dark:text-neutral-100">
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100">
                {manifestStatusForDisplay(summary.status)}
              </span>
            </dd>
            <dt className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Rule set</dt>
            <dd className="m-0 text-sm text-neutral-900 dark:text-neutral-100">
              {summary.ruleSetId} {summary.ruleSetVersion}
            </dd>
            <dt className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Decisions</dt>
            <dd className="m-0 text-sm text-neutral-900 dark:text-neutral-100">{summary.decisionCount}</dd>
            <dt className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Warnings</dt>
            <dd className="m-0 text-sm text-neutral-900 dark:text-neutral-100">{summary.warningCount}</dd>
            <dt className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Unresolved issues</dt>
            <dd className="m-0 text-sm text-neutral-900 dark:text-neutral-100">
              {summary.unresolvedIssueCount}
            </dd>
          </dl>
          {summary.manifestHash ? (
            <p className="m-0 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="font-medium text-neutral-600 dark:text-neutral-300">Hash:</span>{" "}
              <span className="font-mono text-[12px]">{summary.manifestHash}</span>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Artifacts</CardTitle>
          <CardDescription>Generated files for review and download.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button variant="outline" size="sm" asChild>
              <a href={getBundleDownloadUrl(manifestId)}>Download bundle (ZIP)</a>
            </Button>
          </div>

          {artifactsFailure && (
            <>
              <p className="m-0 text-sm font-semibold">Artifact list could not be loaded.</p>
              <OperatorApiProblem
                problem={artifactsFailure.problem}
                fallbackMessage={artifactsFailure.message}
                correlationId={artifactsFailure.correlationId}
                variant="warning"
              />
              <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
                Try reloading, or return to the run detail page. You can still use Download bundle (ZIP) if
                the list endpoint is unavailable.
              </p>
            </>
          )}

          {!artifactsFailure && artifactsMalformed && (
            <>
              <OperatorMalformedCallout>
                <strong>Artifact list response was not usable.</strong>
                <p className="mt-2">{artifactsMalformed}</p>
              </OperatorMalformedCallout>
              <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
                Try reloading, or return to the run detail page. Bundle download may still work.
              </p>
            </>
          )}

          {!artifactsFailure && !artifactsMalformed && artifacts.length === 0 && (
            <OperatorEmptyState title="No artifacts listed for this manifest">
              <p className="m-0">
                The summary loaded, but the artifact descriptor list is empty. Bundle download may be
                available when there is a bundle.
              </p>
            </OperatorEmptyState>
          )}

          {!artifactsFailure && !artifactsMalformed && artifacts.length > 0 && (
            <ArtifactListTable manifestId={manifestId} artifacts={artifacts} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
