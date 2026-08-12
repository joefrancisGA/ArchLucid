"use client";

import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SeverityTag } from "@/components/ui/severity-tag";
import {
  ARCHITECTURE_DIAGRAM_FULLSCREEN_ACTION,
  ARCHITECTURE_DIAGRAM_RENDER_FAILURE,
  ARCHITECTURE_DIAGRAM_RESET_ZOOM_LABEL,
  ARCHITECTURE_DIAGRAM_RETRY_ACTION,
  ARCHITECTURE_DIAGRAM_ZOOM_IN_LABEL,
  ARCHITECTURE_DIAGRAM_ZOOM_OUT_LABEL,
} from "@/lib/architecture/architecture-diagram-copy";
import { sanitizeMermaidRenderId } from "@/lib/help/help-mermaid";
import { useDocumentDarkMode } from "@/lib/use-document-dark-mode";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;

export type ArchitectureDiagramViewerProps = {
  readonly mermaidSource: string;
  readonly textAlternative: string;
  readonly onRenderFailure?: () => void;
  readonly onRetry?: () => void;
};

/** Interactive architecture diagram canvas with zoom, pan, fullscreen, and accessible fallback text. */
export function ArchitectureDiagramViewer(props: ArchitectureDiagramViewerProps): React.JSX.Element {
  const { mermaidSource, onRenderFailure } = props;
  const reactId = useId();
  const renderId = useMemo(() => sanitizeMermaidRenderId(`arch-diagram-${reactId}`), [reactId]);
  const dark = useDocumentDarkMode();
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram(): Promise<void> {
      setRenderError(null);
      setSvgMarkup(null);

      try {
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default;

        mermaid.initialize({
          startOnLoad: false,
          theme: dark ? "dark" : "neutral",
          securityLevel: "strict",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        });

        const result = await mermaid.render(renderId, mermaidSource.trim());

        if (!cancelled) {
          setSvgMarkup(result.svg);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : ARCHITECTURE_DIAGRAM_RENDER_FAILURE;
          setRenderError(message);
          onRenderFailure?.();
        }
      }
    }

    void renderDiagram();

    return (): void => {
      cancelled = true;
    };
  }, [mermaidSource, dark, renderId, onRenderFailure]);

  const adjustZoom = useCallback((delta: number) => {
    setZoom((current) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((current + delta).toFixed(2)))));
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (viewport === null) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        adjustZoom(ZOOM_STEP);
      }

      if (event.key === "-") {
        event.preventDefault();
        adjustZoom(-ZOOM_STEP);
      }

      if (event.key === "0") {
        event.preventDefault();
        setZoom(1);
      }
    };

    viewport.addEventListener("keydown", onKeyDown);

    return (): void => {
      viewport.removeEventListener("keydown", onKeyDown);
    };
  }, [adjustZoom]);

  const sanitizedSvg = useMemo(() => {
    if (svgMarkup === null) {
      return null;
    }

    // SVG profile allowlists attributes; event handlers (on*) are not permitted.
    return DOMPurify.sanitize(svgMarkup, {
      USE_PROFILES: { svg: true, svgFilters: true },
      FORBID_TAGS: ["script", "foreignObject"],
    });
  }, [svgMarkup]);

  const diagramBody = (
    <>
      {renderError !== null ? (
        <div className="space-y-3" role="alert" data-testid="architecture-diagram-render-failure">
          <SeverityTag severity="high" label="Diagram render error" />
          <p className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.body)}>{renderError}</p>
          {props.onRetry !== undefined ? (
            <Button type="button" variant="outline" size="sm" onClick={props.onRetry}>
              {ARCHITECTURE_DIAGRAM_RETRY_ACTION}
            </Button>
          ) : null}
        </div>
      ) : sanitizedSvg === null ? (
        <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)} aria-live="polite">
          Rendering architecture diagram…
        </p>
      ) : (
        <div
          className="origin-top-left transition-transform"
          style={{ transform: `scale(${zoom})` }}
          dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
        />
      )}
    </>
  );

  return (
    <figure data-testid="architecture-diagram-viewer">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" aria-label={ARCHITECTURE_DIAGRAM_ZOOM_OUT_LABEL} onClick={() => adjustZoom(-ZOOM_STEP)}>
          −
        </Button>
        <Button type="button" variant="outline" size="sm" aria-label={ARCHITECTURE_DIAGRAM_ZOOM_IN_LABEL} onClick={() => adjustZoom(ZOOM_STEP)}>
          +
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setZoom(1)}>
          {ARCHITECTURE_DIAGRAM_RESET_ZOOM_LABEL}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setFullscreenOpen(true)}>
          {ARCHITECTURE_DIAGRAM_FULLSCREEN_ACTION}
        </Button>
      </div>

      <div
        ref={viewportRef}
        tabIndex={0}
        role="img"
        aria-label="Architecture diagram"
        aria-describedby={`${renderId}-alt`}
        className="max-h-[28rem] overflow-auto rounded-md border border-neutral-200 bg-white p-4 outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:border-neutral-700 dark:bg-neutral-950/80"
        data-testid="architecture-diagram-viewport"
      >
        {diagramBody}
      </div>

      <p id={`${renderId}-alt`} className="sr-only">
        {props.textAlternative}
      </p>

      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent className="max-h-[95vh] max-w-[95vw] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Architecture diagram</DialogTitle>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-auto p-2">{diagramBody}</div>
        </DialogContent>
      </Dialog>
    </figure>
  );
}
