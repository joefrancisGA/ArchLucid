import type { ArtifactDescriptor } from "@/types/authority";
import type { ReactElement } from "react";

import { getArtifactBusinessLabel, getArtifactFormatLabel } from "@/lib/artifact-review-helpers";

type ArtifactIntegrityTechnicalDetailsProps = {
  readonly artifacts: readonly ArtifactDescriptor[];
};

/**
 * Sponsor/buyer appendix: MIME, presentation label, and fingerprint — kept out of primary deliverable tables.
 */
export function ArtifactIntegrityTechnicalDetails(props: ArtifactIntegrityTechnicalDetailsProps): ReactElement | null {
  const { artifacts } = props;

  if (artifacts.length === 0) {
    return null;
  }

  return (
    <details className="mt-4 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40">
      <summary className="cursor-pointer select-none text-sm font-medium text-neutral-800 dark:text-neutral-200">
        Integrity and format details
      </summary>
      <div className="mt-3 space-y-4">
        {artifacts.map((artifact) => (
          <div
            key={artifact.artifactId}
            className="border-t border-neutral-200 pt-3 first:border-t-0 first:pt-0 dark:border-neutral-700"
          >
            <p className="m-0 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              {getArtifactBusinessLabel(artifact.artifactType)}
            </p>
            <dl className="m-0 mt-2 grid gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
              <div>
                <dt className="m-0 font-medium text-neutral-700 dark:text-neutral-300">Media type / format</dt>
                <dd className="m-0 mt-0.5">
                  <code className="break-all font-mono text-[10px] text-neutral-800 dark:text-neutral-200">
                    {artifact.format}
                  </code>
                  <span className="mt-1 block text-[10px] text-neutral-500 dark:text-neutral-500">
                    Presentation: {getArtifactFormatLabel(artifact.format)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="m-0 font-medium text-neutral-700 dark:text-neutral-300">Content fingerprint</dt>
                <dd className="m-0 mt-0.5 break-all font-mono text-[10px] text-neutral-800 dark:text-neutral-200">
                  {artifact.contentHash}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </details>
  );
}
