"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReactElement } from "react";

import { CopyIdButton } from "@/components/CopyIdButton";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { getArtifactBusinessLabel } from "@/lib/artifact-review-helpers";
import type { ArtifactDescriptor } from "@/types/authority";

const CONTENT_FINGERPRINT_ALGORITHM = "SHA-256";

type ArtifactIntegrityTechnicalDetailsProps = {
  readonly artifacts: readonly ArtifactDescriptor[];
};

const VERIFICATION_GUIDANCE =
  "Recompute the SHA-256 digest of each downloaded file and compare it to the fingerprint below before sharing the package externally.";

/**
 * Sponsor/buyer appendix: compact fingerprint table with copy affordances — kept out of primary deliverable tables.
 */
export function ArtifactIntegrityTechnicalDetails(props: ArtifactIntegrityTechnicalDetailsProps): ReactElement | null {
  const { artifacts } = props;

  if (artifacts.length === 0) {
    return null;
  }

  async function copyAllFingerprints(): Promise<void> {
    const payload = artifacts
      .map((artifact) => {
        const label = getArtifactBusinessLabel(artifact.artifactType);

        return `${label}\t${CONTENT_FINGERPRINT_ALGORITHM}\t${artifact.contentHash}`;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <details
      className="mt-4 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="artifact-integrity-technical-details"
    >
      <summary className={cn("cursor-pointer select-none font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
        Integrity fingerprints
      </summary>
      <div className="mt-3 space-y-3">
        <p className={cn("m-0 max-w-prose text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {VERIFICATION_GUIDANCE}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void copyAllFingerprints()}>
            Copy all fingerprints
          </Button>
        </div>
        <EnterpriseTable ariaLabel="Deliverable integrity fingerprints">
          <EnterpriseTableHead>
            <EnterpriseTableRow>
              <EnterpriseTableHeaderCell scope="col">Deliverable</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell scope="col">Algorithm</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell scope="col">Fingerprint</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell scope="col">
                <span className="sr-only">Copy</span>
              </EnterpriseTableHeaderCell>
            </EnterpriseTableRow>
          </EnterpriseTableHead>
          <EnterpriseTableBody>
            {artifacts.map((artifact) => (
              <EnterpriseTableRow key={artifact.artifactId}>
                <EnterpriseTableCell className="font-medium text-al-text-primary">
                  {getArtifactBusinessLabel(artifact.artifactType)}
                </EnterpriseTableCell>
                <EnterpriseTableCell className="text-al-text-secondary">{CONTENT_FINGERPRINT_ALGORITHM}</EnterpriseTableCell>
                <EnterpriseTableCell>
                  <code className={cn("break-all font-mono text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.micro)}>
                    {artifact.contentHash}
                  </code>
                </EnterpriseTableCell>
                <EnterpriseTableCell>
                  <CopyIdButton
                    value={artifact.contentHash}
                    aria-label={`Copy fingerprint for ${getArtifactBusinessLabel(artifact.artifactType)}`}
                  />
                </EnterpriseTableCell>
              </EnterpriseTableRow>
            ))}
          </EnterpriseTableBody>
        </EnterpriseTable>
      </div>
    </details>
  );
}
