import Link from "next/link";

import type { ArtifactDescriptor } from "@/types/authority";
import { getArtifactDownloadUrl } from "@/lib/api";
import { getArtifactTypeLabel } from "@/lib/artifact-review-helpers";

/** Formats an ISO 8601 date string for display, falling back to the raw string on failure. */
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/**
 * Builds the Review link URL: run-scoped (/runs/{runId}/artifacts/...) when runId is provided
 * (redirects to manifest canonical), otherwise manifest-scoped (/manifests/{manifestId}/artifacts/...).
 */
function reviewHrefForArtifact(
  manifestId: string,
  artifactId: string,
  runId: string | undefined,
): string {
  if (runId) {
    return `/runs/${encodeURIComponent(runId)}/artifacts/${encodeURIComponent(artifactId)}`;
  }

  return `/manifests/${encodeURIComponent(manifestId)}/artifacts/${encodeURIComponent(artifactId)}`;
}

/**
 * Deterministic artifact list for run and manifest pages (review + download).
 */
export function ArtifactListTable(props: {
  manifestId: string;
  artifacts: ArtifactDescriptor[];
  /** When set, the matching row is visually emphasized (e.g. on artifact review page). */
  currentArtifactId?: string;
  /**
   * When set, Review links use /runs/.../artifacts/... (redirects to manifest-scoped review).
   * Improves run-centric navigation from run detail.
   */
  runId?: string;
}) {
  const { manifestId, artifacts, currentArtifactId, runId } = props;
  const sorted = [...artifacts].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-300 text-left dark:border-neutral-600">
            <th className="px-2 py-2.5">Artifact</th>
            <th className="px-2 py-2.5">Type</th>
            <th className="px-2 py-2.5">Format</th>
            <th className="px-2 py-2.5">Created</th>
            <th className="px-2 py-2.5">Hash (short)</th>
            <th className="px-2 py-2.5">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((artifact) => {
            const reviewHref = reviewHrefForArtifact(manifestId, artifact.artifactId, runId);
            const hashShort =
              artifact.contentHash.length > 12
                ? `${artifact.contentHash.slice(0, 8)}…`
                : artifact.contentHash;

            const isCurrent =
              currentArtifactId !== undefined && currentArtifactId === artifact.artifactId;

            return (
              <tr
                key={artifact.artifactId}
                className={`border-b border-neutral-100 dark:border-neutral-800 ${isCurrent ? "bg-blue-50 dark:bg-blue-950/30" : ""}`}
              >
                <td className="max-w-[280px] px-2 py-2.5">
                  <strong className="font-semibold">{artifact.name}</strong>
                </td>
                <td className="px-2 py-2.5 text-neutral-600 dark:text-neutral-400">
                  {getArtifactTypeLabel(artifact.artifactType)}
                </td>
                <td className="px-2 py-2.5 font-mono text-[13px]">
                  {artifact.format}
                </td>
                <td className="whitespace-nowrap px-2 py-2.5 text-neutral-600 dark:text-neutral-400">
                  {formatDate(artifact.createdUtc)}
                </td>
                <td className="px-2 py-2.5 font-mono text-xs" title={artifact.contentHash}>
                  {hashShort}
                </td>
                <td className="px-2 py-2.5">
                  <Link href={reviewHref}>Review</Link>
                  <span className="mx-2 text-neutral-300 dark:text-neutral-600">|</span>
                  <a href={getArtifactDownloadUrl(manifestId, artifact.artifactId)}>Download</a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
