"use client";

import { useCallback, useEffect, useState, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RunStoredEvidenceDiagramPreviewBody } from "@/components/runs/RunStoredEvidenceDiagramPreviewBody";
import type { DiagramEvidenceCitation } from "@/lib/findings/diagram-evidence-citation";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { fetchRunStoredEvidenceFileBlob } from "@/lib/runs/run-stored-evidence-file-api";
import { cn } from "@/lib/utils";

export type FindingInspectDiagramCitationPreviewDialogProps = {
  readonly runId: string;
  readonly citation: DiagramEvidenceCitation | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
};

/** Opens stored diagram evidence and highlights the cited shape (AS-024 / AS-025). */
export function FindingInspectDiagramCitationPreviewDialog(
  props: FindingInspectDiagramCitationPreviewDialogProps,
): ReactElement {
  const { runId, citation, open, onOpenChange } = props;
  const [fileName, setFileName] = useState<string>("Diagram evidence");
  const [contentType, setContentType] = useState<string>("text/plain");
  const [textContent, setTextContent] = useState<string>("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetState = useCallback((): void => {
    setFileName("Diagram evidence");
    setContentType("text/plain");
    setTextContent("");
    setLoadError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open || citation === null) {
      resetState();

      return;
    }

    const evidenceItemId = citation.evidenceItemId;
    let canceled = false;

    async function loadEvidence(): Promise<void> {
      setLoading(true);
      setLoadError(null);
      setTextContent("");

      try {
        const { blob, fileName: resolvedFileName, contentType: resolvedContentType } =
          await fetchRunStoredEvidenceFileBlob(runId, evidenceItemId, "inline");

        if (canceled) {
          return;
        }

        setFileName(resolvedFileName?.trim() || "Diagram evidence");
        setContentType(resolvedContentType?.trim() || "text/plain");
        setTextContent(await blob.text());
      } catch {
        if (!canceled) {
          setLoadError("Could not open this diagram evidence file.");
        }
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    }

    void loadEvidence();

    return (): void => {
      canceled = true;
    };
  }, [citation, open, resetState, runId]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        resetState();
      }

      onOpenChange(nextOpen);
    },
    [onOpenChange, resetState],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-4xl overflow-hidden"
        data-testid="finding-inspect-diagram-citation-preview-dialog"
      >
        <DialogHeader>
          <DialogTitle>{fileName}</DialogTitle>
          <DialogDescription>
            Diagram evidence preview for cited shape
            {citation !== null ? ` “${citation.shapeOrEdgeId}”` : ""}. This is submitted evidence, not the sealed review
            record.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 max-h-[65vh] overflow-auto">
          {loading ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} aria-live="polite">
              Loading diagram preview…
            </p>
          ) : null}

          {loadError !== null ? (
            <p className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
              {loadError}
            </p>
          ) : null}

          {!loading && loadError === null && textContent.length > 0 ? (
            <RunStoredEvidenceDiagramPreviewBody
              fileName={fileName}
              contentType={contentType}
              textContent={textContent}
              highlightShapeId={citation?.shapeOrEdgeId ?? null}
            />
          ) : null}
        </div>

        <div className="mt-4 flex justify-end">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
