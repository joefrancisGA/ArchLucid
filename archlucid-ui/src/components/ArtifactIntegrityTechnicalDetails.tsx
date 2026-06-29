import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { ArtifactDescriptor } from "@/types/authority";
import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { cn } from "@/lib/utils";
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
      <summary className={cn("cursor-pointer select-none font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
        Integrity and format details
      </summary>
      <div className="mt-3 space-y-4">
        {artifacts.map((artifact) => (
          <div
            key={artifact.artifactId}
            className="border-t border-neutral-200 pt-3 first:border-t-0 first:pt-0 dark:border-neutral-700"
          >
            <p className={cn("m-0 font-semibold text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
              {getArtifactBusinessLabel(artifact.artifactType)}
            </p>
            <dl className={cn("m-0 mt-2 grid gap-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              <div>
                <dt className="m-0 font-medium text-neutral-700 dark:text-neutral-300">Media type / format</dt>
                <dd className="m-0 mt-0.5">
                  <code className={cn("break-all font-mono text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.badge)}>
                    {artifact.format}
                  </code>
                  <span className={cn("mt-1 block text-neutral-500 dark:text-neutral-500", OPERATOR_TYPOGRAPHY.badge)}>
                    Presentation: {getArtifactFormatLabel(artifact.format)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="m-0 font-medium text-neutral-700 dark:text-neutral-300">Content fingerprint</dt>
                <dd className={cn("m-0 mt-0.5 break-all font-mono text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.badge)}>
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
