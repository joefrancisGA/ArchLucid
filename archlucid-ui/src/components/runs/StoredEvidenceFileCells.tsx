"use client";

import { cn } from "@/lib/utils";
import { useCallback, useRef, useState, type ReactElement, type RefObject } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RunStoredEvidenceDiagramPreviewBody } from "@/components/runs/RunStoredEvidenceDiagramPreviewBody";
import { showError } from "@/lib/toast";
import { downloadRunStoredEvidenceFile, fetchRunStoredEvidenceFileBlob } from "@/lib/runs/run-stored-evidence-file-api";
import {
  parseRunStoredEvidencePreviewShapeFromSearch,
  RUN_STORED_EVIDENCE_PREVIEW_SHAPE_PARAM,
  runStoredEvidencePreviewShapeHrefFromSearch,
} from "@/lib/runs/run-stored-evidence-preview-shape-url";
import { StoredEvidenceFileContentSafety } from "@/lib/runs/run-stored-evidence-preview-policy";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type RunStoredEvidencePreviewState = {
  readonly evidenceItemId: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly previewKind: "image" | "text" | "pdf";
  readonly objectUrl: string;
  readonly textContent?: string;
  readonly highlightShapeId?: string | null;
};

export type RunStoredEvidencePreviewDialogProps = {
  readonly runId: string;
  readonly preview: RunStoredEvidencePreviewState | null;
  readonly onClose: () => void;
};

export async function openRunStoredEvidencePreview(
  runId: string,
  evidenceItemId: string,
  fileName: string,
  contentType: string,
  highlightShapeId: string | null = null,
): Promise<RunStoredEvidencePreviewState | "download-only" | null> {
  const previewKind = StoredEvidenceFileContentSafety.resolvePreviewKind(contentType, fileName);

  if (previewKind === "download-only") {
    return "download-only";
  }

  try {
    const { blob } = await fetchRunStoredEvidenceFileBlob(runId, evidenceItemId, "inline");
    const objectUrl = URL.createObjectURL(blob);

    if (previewKind === "text") {
      const textContent = await blob.text();

      return {
        evidenceItemId,
        fileName,
        contentType,
        previewKind,
        objectUrl,
        textContent,
        highlightShapeId,
      };
    }

    return {
      evidenceItemId,
      fileName,
      contentType,
      previewKind,
      objectUrl,
      highlightShapeId,
    };
  } catch {
    return null;
  }
}

export function RunStoredEvidencePreviewDialog(props: RunStoredEvidencePreviewDialogProps): ReactElement {
  const handleDownload = useCallback(async () => {
    if (props.preview === null) {
      return;
    }

    try {
      await downloadRunStoredEvidenceFile(props.runId, props.preview.evidenceItemId, props.preview.fileName);
    } catch {
      showError("Download", "Could not download this submitted evidence file.");
    }
  }, [props.preview, props.runId]);

  return (
    <Dialog
      open={props.preview !== null}
      onOpenChange={(open) => {
        if (!open) {
          props.onClose();
        }
      }}
    >
      <DialogContent
        className="max-h-[90vh] max-w-4xl overflow-hidden"
        data-testid="run-stored-evidence-preview-dialog"
      >
        {props.preview !== null ? (
          <>
            <DialogHeader>
              <DialogTitle>{props.preview.fileName}</DialogTitle>
              <DialogDescription>
                Submitted evidence preview. Use Download to save a copy — this is not the sealed review record.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-3 max-h-[65vh] overflow-auto">
              {props.preview.previewKind === "image" ? (
                <img
                  src={props.preview.objectUrl}
                  alt={props.preview.fileName}
                  className="mx-auto max-h-[60vh] max-w-full object-contain"
                />
              ) : null}
              {props.preview.previewKind === "pdf" ? (
                <iframe
                  title={props.preview.fileName}
                  src={props.preview.objectUrl}
                  className="h-[60vh] w-full border border-neutral-200"
                />
              ) : null}
              {props.preview.previewKind === "text" ? (
                <RunStoredEvidenceDiagramPreviewBody
                  fileName={props.preview.fileName}
                  contentType={props.preview.contentType}
                  textContent={props.preview.textContent ?? ""}
                  highlightShapeId={props.preview.highlightShapeId ?? null}
                />
              ) : null}
            </div>
            <div className="mt-4 flex justify-end">
              <Button type="button" variant="outline" onClick={() => void handleDownload()}>
                Download
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export type StoredEvidenceFileActionHandlers = {
  readonly onOpen: (input: {
    readonly evidenceItemId: string;
    readonly fileName: string;
    readonly contentType: string;
  }) => void;
  readonly onDownload: (input: {
    readonly evidenceItemId: string;
    readonly fileName: string;
  }) => void;
};

export type StoredEvidenceFileCellsProps = {
  readonly runId: string;
  readonly evidenceItemId: string;
  readonly fileName: string;
  readonly contentType?: string;
  readonly handlers: StoredEvidenceFileActionHandlers;
  readonly openButtonRef?: RefObject<HTMLElement | null>;
};

export function StoredEvidenceFileCells(props: StoredEvidenceFileCellsProps): ReactElement {
  const contentType = props.contentType ?? "application/octet-stream";
  const previewKind = StoredEvidenceFileContentSafety.resolvePreviewKind(contentType, props.fileName);
  const canPreview = previewKind !== "download-only";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canPreview ? (
        <button
          type="button"
          className={cn(
            "font-medium text-al-link underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-al-focus",
          )}
          onClick={(event) => {
            if (props.openButtonRef !== undefined) {
              props.openButtonRef.current = event.currentTarget;
            }

            props.handlers.onOpen({
              evidenceItemId: props.evidenceItemId,
              fileName: props.fileName,
              contentType,
            });
          }}
        >
          {props.fileName}
        </button>
      ) : (
        <span className="font-medium text-al-text-primary">{props.fileName}</span>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid={`run-detail-evidence-download-${props.evidenceItemId}`}
        aria-label={`Download ${props.fileName}`}
        onClick={() =>
          props.handlers.onDownload({
            evidenceItemId: props.evidenceItemId,
            fileName: props.fileName,
          })
        }
      >
        Download
      </Button>
    </div>
  );
}

export function useStoredEvidenceFileActions(runId: string): {
  readonly preview: RunStoredEvidencePreviewState | null;
  readonly closePreview: () => void;
  readonly handlers: StoredEvidenceFileActionHandlers;
  readonly openButtonRef: RefObject<HTMLElement | null>;
} {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const highlightShapeId = parseRunStoredEvidencePreviewShapeFromSearch(
    searchParams.get(RUN_STORED_EVIDENCE_PREVIEW_SHAPE_PARAM),
  );
  const [preview, setPreview] = useState<RunStoredEvidencePreviewState | null>(null);
  const openButtonRef = useRef<HTMLElement | null>(null);

  const closePreview = useCallback(() => {
    setPreview((current) => {
      if (current !== null) {
        URL.revokeObjectURL(current.objectUrl);
      }

      return null;
    });

    router.replace(runStoredEvidencePreviewShapeHrefFromSearch(searchParamsString, null, pathname), {
      scroll: false,
    });

    queueMicrotask(() => {
      openButtonRef.current?.focus();
    });
  }, [pathname, router, searchParamsString]);

  const handlers: StoredEvidenceFileActionHandlers = {
    onOpen: (input) => {
      void (async () => {
        const result = await openRunStoredEvidencePreview(
          runId,
          input.evidenceItemId,
          input.fileName,
          input.contentType,
          highlightShapeId,
        );

        if (result === null) {
          showError("Open evidence", "Could not open this submitted evidence file.");

          return;
        }

        if (result === "download-only") {
          try {
            await downloadRunStoredEvidenceFile(runId, input.evidenceItemId, input.fileName);
          } catch {
            showError("Download", "Could not download this submitted evidence file.");
          }

          return;
        }

        setPreview((current) => {
          if (current !== null) {
            URL.revokeObjectURL(current.objectUrl);
          }

          return result;
        });
      })();
    },
    onDownload: (input) => {
      void (async () => {
        try {
          await downloadRunStoredEvidenceFile(runId, input.evidenceItemId, input.fileName);
        } catch {
          showError("Download", "Could not download this submitted evidence file.");
        }
      })();
    },
  };

  return { preview, closePreview, handlers, openButtonRef };
}
