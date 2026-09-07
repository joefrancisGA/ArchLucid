"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";

import { RunDetailCaptureEvidenceSection } from "./RunDetailCaptureEvidenceSection";
import { RunDetailCreateHomeCapturedEvidenceInventory } from "@/components/runs/RunDetailCreateHomeCapturedEvidenceInventory";
import type { BulkEvidenceUploadSummary } from "@/lib/bulk-evidence-upload-outcome";
import { useRunStoredEvidenceCatalogQuery } from "@/hooks/use-run-stored-evidence-catalog-query";
import {
  deriveCapturedEvidenceFromArtifacts,
  deriveCapturedEvidenceFromCatalog,
  mergeCapturedEvidenceUploadOutcomes,
  readPersistedCapturedEvidenceInventory,
  reconcileCapturedEvidenceInventory,
  writePersistedCapturedEvidenceInventory,
  type RunDetailCreateHomeCapturedEvidenceItem,
} from "@/lib/runs/run-detail-create-home-captured-evidence";

export type RunDetailCreateHomeEvidenceCaptureRegionProps = {
  readonly runId: string;
  readonly buyerPolished: boolean;
  readonly artifacts: readonly { readonly artifactId: string; readonly name: string; readonly createdUtc: string }[];
};

export function RunDetailCreateHomeEvidenceCaptureRegion(
  props: RunDetailCreateHomeEvidenceCaptureRegionProps,
): ReactElement {
  const router = useRouter();
  const { catalog, isLoading: catalogLoading } = useRunStoredEvidenceCatalogQuery(props.runId);
  const catalogItems = useMemo(
    () =>
      deriveCapturedEvidenceFromCatalog(
        catalog.map((entry) => ({
          evidenceItemId: entry.evidenceItemId,
          originalFileName: entry.originalFileName,
          contentType: entry.contentType,
        })),
      ),
    [catalog],
  );
  const initialCaptured = useMemo(
    () =>
      reconcileCapturedEvidenceInventory(
        catalogItems.length > 0
          ? catalogItems
          : deriveCapturedEvidenceFromArtifacts(props.artifacts),
        readPersistedCapturedEvidenceInventory(props.runId),
      ),
    [catalogItems, props.artifacts, props.runId],
  );
  const [capturedItems, setCapturedItems] = useState<readonly RunDetailCreateHomeCapturedEvidenceItem[]>(initialCaptured);
  const trackedRunIdRef = useRef(props.runId);

  useEffect(() => {
    const runIdChanged = trackedRunIdRef.current !== props.runId;
    trackedRunIdRef.current = props.runId;

    if (runIdChanged) {
      setCapturedItems(initialCaptured);
      writePersistedCapturedEvidenceInventory(props.runId, initialCaptured);
      return;
    }

    setCapturedItems((current) => {
      const next = reconcileCapturedEvidenceInventory(initialCaptured, current);

      writePersistedCapturedEvidenceInventory(props.runId, next);

      return next;
    });
  }, [initialCaptured, props.runId]);

  const handleUploadSummary = useCallback(
    (summary: BulkEvidenceUploadSummary) => {
      if (summary.uploadedCount === 0) {
        return;
      }

      setCapturedItems((current) => {
        const next = mergeCapturedEvidenceUploadOutcomes(
          current,
          summary.outcomes,
          new Date().toISOString(),
          summary.evidenceItemIds,
        );

        writePersistedCapturedEvidenceInventory(props.runId, next);

        return next;
      });
      router.refresh();
    },
    [props.runId, router],
  );

  return (
    <div className="space-y-4" data-testid="run-detail-create-home-evidence-capture-region">
      <RunDetailCreateHomeCapturedEvidenceInventory
        runId={props.runId}
        items={capturedItems}
        catalogAvailable={!catalogLoading || catalog.length > 0}
      />
      <RunDetailCaptureEvidenceSection
        runId={props.runId}
        buyerPolished={props.buyerPolished}
        onUploadSummary={handleUploadSummary}
      />
    </div>
  );
}
