"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isMermaidDiagramSource, prepareMermaidSvgForResponsiveLayout, sanitizeMermaidRenderId } from "@/lib/help/help-mermaid";
import {
  resolveStoredEvidenceDiagramPreviewFormat,
  storedEvidenceDiagramShapeHighlightHonestyMessage,
} from "@/lib/runs/stored-evidence-diagram-preview-format";
import { applyStoredEvidenceDiagramShapeHighlight } from "@/lib/runs/stored-evidence-diagram-shape-highlight";
import { useDocumentDarkMode } from "@/lib/use-document-dark-mode";
import { cn } from "@/lib/utils";

export type RunStoredEvidenceDiagramPreviewBodyProps = {
  readonly fileName: string;
  readonly contentType: string;
  readonly textContent: string;
  readonly highlightShapeId?: string | null;
};

/** Renders stored diagram evidence with optional cited-shape highlight (AS-025). */
export function RunStoredEvidenceDiagramPreviewBody(
  props: RunStoredEvidenceDiagramPreviewBodyProps,
): ReactElement {
  const { fileName, contentType, textContent, highlightShapeId = null } = props;
  const dark = useDocumentDarkMode();
  const reactId = useId();
  const renderId = useMemo(() => sanitizeMermaidRenderId(`stored-evidence-diagram-${reactId}`), [reactId]);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const diagramFormat = resolveStoredEvidenceDiagramPreviewFormat(contentType, fileName, textContent);
  const trimmedShapeId = highlightShapeId?.trim() ?? "";
  const honestyMessage =
    trimmedShapeId.length > 0
      ? storedEvidenceDiagramShapeHighlightHonestyMessage(trimmedShapeId, diagramFormat)
      : null;
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [highlightApplied, setHighlightApplied] = useState(false);

  useEffect(() => {
    if (diagramFormat !== "mermaid" || !isMermaidDiagramSource(textContent)) {
      setSvgMarkup(null);
      setRenderError(null);
      setHighlightApplied(false);

      return;
    }

    let canceled = false;

    async function renderDiagram(): Promise<void> {
      setRenderError(null);
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

        const result = await mermaid.render(renderId, textContent.trim());

        if (!canceled) {
          setSvgMarkup(prepareMermaidSvgForResponsiveLayout(result.svg));
        }
      } catch {
        if (!canceled) {
          setRenderError(
            trimmedShapeId.length > 0
              ? `Open file; shape id ${trimmedShapeId}. Mermaid preview could not be rendered.`
              : "Mermaid preview could not be rendered.",
          );
        }
      }
    }

    void renderDiagram();

    return (): void => {
      canceled = true;
    };
  }, [dark, diagramFormat, renderId, textContent, trimmedShapeId]);

  useEffect(() => {
    if (svgMarkup === null || trimmedShapeId.length === 0) {
      setHighlightApplied(false);

      return;
    }

    const host = hostRef.current;
    const svg = host?.querySelector("svg");

    if (host === null || host === undefined || svg === null || !(svg instanceof SVGSVGElement)) {
      return;
    }

    const highlighted = applyStoredEvidenceDiagramShapeHighlight(svg, trimmedShapeId);
    setHighlightApplied(highlighted);
  }, [svgMarkup, trimmedShapeId]);

  if (honestyMessage !== null) {
    return (
      <p className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
        {honestyMessage}
      </p>
    );
  }

  if (renderError !== null) {
    return (
      <p className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
        {renderError}
      </p>
    );
  }

  if (svgMarkup !== null) {
    return (
      <>
        <div
          ref={hostRef}
          className="w-full min-w-0 [&_svg]:block"
          data-testid="run-stored-evidence-diagram-preview-svg"
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
        />
        {trimmedShapeId.length > 0 && !highlightApplied ? (
          <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Open file; shape id {trimmedShapeId}.
          </p>
        ) : null}
      </>
    );
  }

  if (diagramFormat === "mermaid") {
    return (
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} aria-live="polite">
        Rendering diagram preview…
      </p>
    );
  }

  return (
    <pre className="whitespace-pre-wrap break-words rounded-md bg-neutral-50 p-3 font-mono text-sm text-al-text-primary">
      {textContent}
    </pre>
  );
}
