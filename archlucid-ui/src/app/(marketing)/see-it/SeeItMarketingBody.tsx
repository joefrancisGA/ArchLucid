import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";
import type { SeeItPreviewSource } from "./load-see-it-demo-preview";

export type SeeItMarketingBodyProps = {
  source: SeeItPreviewSource;
  payload: DemoCommitPagePreviewResponse;
};

function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  return String(value);
}

/**
 * Anonymous “30 second” marketing slice — only fields present on `DemoCommitPagePreviewResponse`.
 */
export function SeeItMarketingBody({ source, payload }: SeeItMarketingBodyProps) {
  const artifactList = Array.isArray(payload.artifacts) ? payload.artifacts : [];
  const firstArtifacts = artifactList.slice(0, 3);
  const ruleSetId = payload.manifest?.ruleSetId ?? "";
  const ruleSetVersion = payload.manifest?.ruleSetVersion ?? "";
  const manifestVersionParts = [ruleSetId, ruleSetVersion].filter((s) => s.trim().length > 0);
  const manifestVersionLabel = manifestVersionParts.length ? manifestVersionParts.join(" · ") : "—";
  const runExplanation = payload.runExplanation;
  const findingCountDisplay = formatCount(runExplanation?.findingCount);
  const complianceGapDisplay = formatCount(runExplanation?.complianceGapCount);

  return (
    <div className="space-y-6">
      <div
        role="status"
        data-testid="see-it-demo-banner"
        className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
      >
        <p className="font-semibold">Sample healthcare architecture review — illustrative output for evaluation.</p>
        {source === "snapshot" ? (
          <p className="mt-1 text-xs text-amber-900 dark:text-amber-200" data-testid="see-it-snapshot-notice">
            Showing a checked-in snapshot because the live preview could not be loaded for this request.
          </p>
        ) : null}
      </div>

      <section
        data-testid="see-it-summary"
        className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      >
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Finalized demo run (read-only)</h2>
        <dl className="mt-3 space-y-2 text-sm text-neutral-800 dark:text-neutral-200">
          <div>
            <dt className="font-medium text-neutral-600 dark:text-neutral-400">Review id</dt>
            <dd>
              <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-900">
                {payload.run?.runId ?? "—"}
              </code>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-600 dark:text-neutral-400">Manifest version (rule set)</dt>
            <dd>
              <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-900">
                {manifestVersionLabel}
              </code>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-600 dark:text-neutral-400">Findings and compliance gaps</dt>
            <dd data-testid="see-it-finding-counts">
              Findings: {findingCountDisplay} · Compliance gaps: {complianceGapDisplay}
            </dd>
          </div>
        </dl>
      </section>

      <section
        data-testid="see-it-artifacts"
        className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      >
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">First three artifacts (descriptors)</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-800 dark:text-neutral-200">
          {firstArtifacts.length ? (
            firstArtifacts.map((artifact) => (
              <li key={artifact.artifactId}>
                <span className="font-medium">{artifact.name}</span> · {artifact.artifactType} · {artifact.format} · id{" "}
                <code className="text-xs">{artifact.artifactId}</code>
              </li>
            ))
          ) : (
            <li data-testid="see-it-no-artifacts">No artifacts in this preview payload.</li>
          )}
        </ul>
      </section>

      <section className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button asChild variant="primary">
          <a
            data-testid="see-it-proof-pack-download"
            href="/api/proxy/v1/marketing/why-archlucid-pack.pdf"
            download="why-archlucid-pack.pdf"
          >
            Download proof pack (PDF)
          </a>
        </Button>
        <Link
          data-testid="see-it-full-preview-link"
          className="inline-flex items-center justify-center rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-900"
          href="/demo/preview"
        >
          Open full demo preview
        </Link>
      </section>
      <p className="text-xs text-neutral-600 dark:text-neutral-400">
        The PDF is a no-sign-in marketing bundle aligned with this sample. Full artifact bytes for your tenant require a
        signed-in workspace.
      </p>
    </div>
  );
}
