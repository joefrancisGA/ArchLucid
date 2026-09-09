"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DiagramEvidenceCitation } from "@/lib/findings/diagram-evidence-citation";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isMermaidDiagramSource } from "@/lib/help/help-mermaid";
import { sanitizeMermaidRenderId, prepareMermaidSvgForResponsiveLayout } from "@/lib/help/help-mermaid";
import { fetchRunStoredEvidenceFileBlob } from "@/lib/runs/run-stored-evidence-file-api";
import { applyStoredEvidenceMermaidShapeHighlight } from "@/lib/runs/stored-evidence-mermaid-shape-highlight";
import { showError } from "@/lib/toast";
import { useDocumentDarkMode } from "@/lib/use-document-dark-mode";
import { cn } from "@/lib/utils";

export type FindingInspectDiagramCitationPreviewDialogProps = {
  readonly runId: string;
  readonly citation: DiagramEvidenceCitation | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
};

function isMermaidContentType(contentType: string, fileName: string): boolean {
  const normalizedType = contentType.trim().toLowerCase();
  const lowerName = fileName.trim().toLowerCase();

  return (
    normalizedType === "text/vnd.mermaid"
    || lowerName.endsWith(".mmd")
    || lowerName.endsWith(".mermaid")
  );
}

/** Opens stored diagram evidence and highlights the cited shape (AS-024). */
export function FindingInspectDiagramCitationPreviewDialog(
  props: FindingInspectDiagramCitationPreviewDialogProps,
): ReactElement {
  const { runId, citation, open, onOpenChange } = props;
  const dark = useDocumentDarkMode();
  const reactId = useId();
  const renderId = useMemo(() => sanitizeMermaidRenderId(`finding-diagram-citation-${reactId}`), [reactId]);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [fileName, setFileName] = useState<string>("Diagram evidence");
  const [mermaidSource, setMermaidSource] = useState<string | null>(null);
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [highlightApplied, setHighlightApplied] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetState = useCallback((): void => {
    setFileName("Diagram evidence");
    setMermaidSource(null);
    setSvgMarkup(null);
    setHighlightApplied(false);
    setLoadError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open || citation === null) {
      resetState();

      return;
    }

    const activeCitation = citation;
    let canceled = false;

    async function loadEvidence(): Promise<void> {
      setLoading(true);
      setLoadError(null);
      setMermaidSource(null);
      setSvgMarkup(null);
      setHighlightApplied(false);

      try {
        const { blob, fileName: resolvedFileName, contentType: resolvedContentType } =
          await fetchRunStoredEvidenceFileBlob(runId, activeCitation.evidenceItemId, "inline");

        if (canceled) {
          return;
        }

        const resolvedName = resolvedFileName?.trim() || "Diagram evidence";
        const resolvedType = resolvedContentType?.trim() || "text/plain";
        const source = await blob.text();
        setFileName(resolvedName);

        if (!isMermaidContentType(resolvedType, resolvedName) && !isMermaidDiagramSource(source)) {
          setLoadError(`Open file; shape id ${activeCitation.shapeOrEdgeId}. Highlight is available for Mermaid sources only.`);

          return;
        }

        if (!isMermaidDiagramSource(source)) {
          setLoadError(`Open file; shape id ${activeCitation.shapeOrEdgeId}. Highlight is available for Mermaid sources only.`);

          return;
        }

        setMermaidSource(source);
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

  useEffect(() => {
    if (!open || mermaidSource === null || citation === null) {
      return;
    }

    const activeCitation = citation;
    const activeMermaidSource = mermaidSource;
    let canceled = false;

    async function renderDiagram(): Promise<void> {
      setSvgMarkup(null);
      setHighlightApplied(false);

      try {
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default;

        mermaid.initialize({
          startOnLoad: false,
          theme: dark ? "dark" : "neutral",
          securityLevel: "strict",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        });

        const result = await mermaid.render(renderId, activeMermaidSource.trim());

        if (!canceled) {
          setSvgMarkup(prepareMermaidSvgForResponsiveLayout(result.svg));
        }
      } catch {
        if (!canceled) {
          setLoadError(`Open file; shape id ${activeCitation.shapeOrEdgeId}. Mermaid preview could not be rendered.`);
        }
      }
    }

    void renderDiagram();

    return (): void => {
      canceled = true;
    };
  }, [citation, dark, mermaidSource, open, renderId]);

  useLayoutEffect(() => {
    if (svgMarkup === null || citation === null) {
      return;
    }

    const host = hostRef.current;
    const svg = host?.querySelector("svg");

    if (host === null || host === undefined || svg === null || !(svg instanceof SVGSVGElement)) {
      return;
    }

    const highlighted = applyStoredEvidenceMermaidShapeHighlight(svg, citation.shapeOrEdgeId);
    setHighlightApplied(highlighted);
  }, [citation, svgMarkup]);

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

          {svgMarkup !== null ? (
            <div
              ref={hostRef}
              className="w-full min-w-0 [&_svg]:block"
              data-testid="finding-inspect-diagram-citation-preview-svg"
              dangerouslySetInnerHTML={{ __html: svgMarkup }}
            />
          ) : null}

          {svgMarkup !== null && citation !== null && !highlightApplied ? (
            <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Open file; shape id {citation.shapeOrEdgeId}.
            </p>
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
