"use client";

import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type SetStateAction } from "react";

import { ShortcutHint } from "@/components/ShortcutHint";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SeverityTag } from "@/components/ui/severity-tag";
import {
  ARCHITECTURE_DIAGRAM_FIT_TO_VIEW_LABEL,
  ARCHITECTURE_DIAGRAM_FULLSCREEN_ACTION,
  ARCHITECTURE_DIAGRAM_RENDER_FAILURE,
  ARCHITECTURE_DIAGRAM_RETRY_ACTION,
  ARCHITECTURE_DIAGRAM_ZOOM_IN_LABEL,
  ARCHITECTURE_DIAGRAM_ZOOM_OUT_LABEL,
} from "@/lib/architecture/architecture-diagram-copy";
import {
  architectureDiagramFullscreenHrefFromSearch,
  architectureDiagramZoomHrefFromSearch,
  parseArchitectureDiagramFullscreenOpenFromSearch,
  parseArchitectureDiagramZoomFromSearch,
} from "@/lib/architecture/architecture-diagram-fullscreen-url";
import { createArchitectureDiagramMermaidConfig } from "@/lib/architecture/architecture-diagram-mermaid-config";
import {
  fitMermaidSvgElementToHost,
  prepareMermaidSvgForResponsiveLayout,
  sanitizeMermaidRenderId,
} from "@/lib/help/help-mermaid";
import { useDocumentDarkMode } from "@/lib/use-document-dark-mode";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;

function scrollViewportToOrigin(viewport: HTMLDivElement | null): void {
  if (viewport === null) {
    return;
  }

  if (typeof viewport.scrollTo === "function") {
    viewport.scrollTo({ top: 0, left: 0, behavior: "auto" });

    return;
  }

  viewport.scrollTop = 0;
  viewport.scrollLeft = 0;
}

export type ArchitectureDiagramViewerProps = {
  readonly mermaidSource: string;
  readonly textAlternative: string;
  readonly viewportAriaLabel?: string;
  readonly fullscreenTitle?: string;
  readonly scopeContextLine?: string | null;
  readonly canvasStale?: boolean;
  readonly onRenderFailure?: () => void;
  readonly onRetry?: () => void;
};

/** Interactive architecture diagram canvas with zoom, pan, fullscreen, and accessible fallback text. */
export function ArchitectureDiagramViewer(props: ArchitectureDiagramViewerProps): React.JSX.Element {
  const {
    mermaidSource,
    onRenderFailure,
    viewportAriaLabel = "Architecture diagram",
    fullscreenTitle = "Architecture diagram",
    scopeContextLine = null,
    canvasStale = false,
  } = props;
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const diagFullscreenParam = searchParams.get("diagFullscreen");
  const diagZoomParam = searchParams.get("diagZoom");
  const reactId = useId();
  const renderId = useMemo(() => sanitizeMermaidRenderId(`arch-diagram-${reactId}`), [reactId]);
  const dark = useDocumentDarkMode();
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const urlZoom = parseArchitectureDiagramZoomFromSearch(diagZoomParam);
  const [zoom, setZoomState] = useState<number>(() => urlZoom ?? 1);
  const [fullscreenOpen, setFullscreenOpenState] = useState(() =>
    parseArchitectureDiagramFullscreenOpenFromSearch(diagFullscreenParam),
  );
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const svgHostRef = useRef<HTMLDivElement | null>(null);
  const zoomRef = useRef<number>(zoom);
  const fullscreenOpenRef = useRef<boolean>(fullscreenOpen);
  const fitRetryTimeoutRef = useRef<number | null>(null);

  zoomRef.current = zoom;
  fullscreenOpenRef.current = fullscreenOpen;

  const syncDiagramFullscreenToUrl = useCallback(
    (nextOpen: boolean) => {
      router.replace(architectureDiagramFullscreenHrefFromSearch(searchParams.toString(), nextOpen, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const syncDiagramZoomToUrl = useCallback(
    (nextZoom: number) => {
      router.replace(architectureDiagramZoomHrefFromSearch(searchParams.toString(), nextZoom, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setZoom = useCallback(
    (value: SetStateAction<number>) => {
      const current = zoomRef.current;
      const nextRaw = typeof value === "function" ? value(current) : value;
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(nextRaw.toFixed(2))));

      setZoomState(next);
      syncDiagramZoomToUrl(next);
    },
    [syncDiagramZoomToUrl],
  );

  const setFullscreenOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      const current = fullscreenOpenRef.current;
      const next = typeof value === "function" ? value(current) : value;

      setFullscreenOpenState(next);
      syncDiagramFullscreenToUrl(next);
    },
    [syncDiagramFullscreenToUrl],
  );

  useEffect(() => {
    if (urlZoom != null) {
      setZoomState(urlZoom);
    }
  }, [urlZoom]);

  useEffect(() => {
    let canceled = false;

    async function renderDiagram(): Promise<void> {
      setRenderError(null);
      setSvgMarkup(null);

      try {
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default;

        mermaid.initialize(createArchitectureDiagramMermaidConfig(dark));

        const result = await mermaid.render(renderId, mermaidSource.trim());

        if (!canceled) {
          setSvgMarkup(prepareMermaidSvgForResponsiveLayout(result.svg));
        }
      } catch (error) {
        if (!canceled) {
          const message = error instanceof Error ? error.message : ARCHITECTURE_DIAGRAM_RENDER_FAILURE;
          setRenderError(message);
          onRenderFailure?.();
        }
      }
    }

    void renderDiagram();

    return (): void => {
      canceled = true;
    };
  }, [mermaidSource, dark, renderId, onRenderFailure]);

  const adjustZoom = useCallback(
    (delta: number) => {
      setZoom((current) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((current + delta).toFixed(2)))));
    },
    [setZoom],
  );

  const sanitizedSvg = useMemo(() => {
    if (svgMarkup === null) {
      return null;
    }

    return DOMPurify.sanitize(svgMarkup, {
      USE_PROFILES: { svg: true, svgFilters: true },
      FORBID_TAGS: ["script", "foreignObject"],
    });
  }, [svgMarkup]);

  const applySvgFitToHost = useCallback((): boolean => {
    const host = svgHostRef.current;
    const svg = host?.querySelector("svg");

    if (host === null || host === undefined || svg === null || !(svg instanceof SVGSVGElement)) {
      return false;
    }

    const width = host.clientWidth;

    if (width <= 0) {
      return false;
    }

    fitMermaidSvgElementToHost(svg, width);

    return true;
  }, []);

  const fitToView = useCallback(
    (resetZoom: boolean) => {
      applySvgFitToHost();

      if (resetZoom) {
        setZoom(1);
      }

      scrollViewportToOrigin(viewportRef.current);
    },
    [applySvgFitToHost, setZoom],
  );

  useLayoutEffect(() => {
    if (sanitizedSvg === null) {
      return;
    }

    let canceled = false;
    let retryAttempts = 0;
    const maxRetryAttempts = 8;

    const scheduleFitRetry = (): void => {
      if (canceled || retryAttempts >= maxRetryAttempts) {
        return;
      }

      retryAttempts += 1;
      window.requestAnimationFrame(() => {
        if (canceled) {
          return;
        }

        if (!applySvgFitToHost()) {
          scheduleFitRetry();
        }
      });
    };

    if (!applySvgFitToHost()) {
      scheduleFitRetry();
    }

    // Mermaid ink bounds can settle a frame after SVG insert.
    const settleRafId = window.requestAnimationFrame(() => {
      if (!canceled) {
        applySvgFitToHost();
        scrollViewportToOrigin(viewportRef.current);
      }
    });

    fitRetryTimeoutRef.current = window.setTimeout(() => {
      if (!canceled) {
        applySvgFitToHost();
        scrollViewportToOrigin(viewportRef.current);
      }
    }, 120);

    const host = svgHostRef.current;

    const resizeObserver =
      host === null || typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            applySvgFitToHost();
          });

    if (host !== null) {
      resizeObserver?.observe(host);
    }

    return (): void => {
      canceled = true;
      window.cancelAnimationFrame(settleRafId);

      if (fitRetryTimeoutRef.current !== null) {
        window.clearTimeout(fitRetryTimeoutRef.current);
        fitRetryTimeoutRef.current = null;
      }

      resizeObserver?.disconnect();
    };
  }, [applySvgFitToHost, sanitizedSvg]);

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
        fitToView(true);
      }
    };

    viewport.addEventListener("keydown", onKeyDown);

    return (): void => {
      viewport.removeEventListener("keydown", onKeyDown);
    };
  }, [adjustZoom, fitToView]);

  const zoomPercentLabel = `${Math.round(zoom * 100)}%`;
  const atMinZoom = zoom <= MIN_ZOOM + 0.001;
  const atMaxZoom = zoom >= MAX_ZOOM - 0.001;

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
          ref={svgHostRef}
          className={cn(
            "w-full min-w-0 origin-top-left transition-transform",
            "[&_svg]:block [&_svg_.cluster-label]:fill-neutral-700 dark:[&_svg_.cluster-label]:fill-neutral-200",
            "[&_svg_.nodeLabel]:text-[15px] [&_svg_.nodeLabel]:fill-neutral-900 dark:[&_svg_.nodeLabel]:fill-neutral-100",
            "[&_svg_.cluster_rect]:stroke-neutral-500 [&_svg_.cluster_rect]:stroke-[1.5px]",
            canvasStale ? "opacity-60" : undefined,
          )}
          style={{ transform: `scale(${zoom})` }}
          dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
        />
      )}
    </>
  );

  return (
    <figure data-testid="architecture-diagram-viewer">
      {scopeContextLine != null && scopeContextLine.trim().length > 0 ? (
        <p
          className={cn("mb-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="architecture-diagram-scope-context"
        >
          {scopeContextLine}
        </p>
      ) : null}

      <div
        className="mb-2 flex flex-wrap items-center gap-2"
        data-testid="architecture-diagram-viewport-controls"
        aria-label="Diagram viewport controls"
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={ARCHITECTURE_DIAGRAM_ZOOM_OUT_LABEL}
          disabled={atMinZoom}
          onClick={() => adjustZoom(-ZOOM_STEP)}
        >
          −
        </Button>
        <span
          className={cn("min-w-[3.25rem] text-center tabular-nums text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="architecture-diagram-zoom-readout"
          aria-live="polite"
        >
          {zoomPercentLabel}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={ARCHITECTURE_DIAGRAM_ZOOM_IN_LABEL}
          disabled={atMaxZoom}
          onClick={() => adjustZoom(ZOOM_STEP)}
        >
          +
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => fitToView(true)}>
          {ARCHITECTURE_DIAGRAM_FIT_TO_VIEW_LABEL}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setFullscreenOpen(true)}>
          {ARCHITECTURE_DIAGRAM_FULLSCREEN_ACTION}
        </Button>
        <span className={cn("flex flex-wrap items-center gap-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <ShortcutHint shortcut="+" />
          <ShortcutHint shortcut="−" />
          <ShortcutHint shortcut="0" />
        </span>
        {canvasStale ? (
          <span className={cn("text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}>
            Canvas may be stale while a new render loads.
          </span>
        ) : null}
      </div>

      <div
        ref={viewportRef}
        tabIndex={0}
        role="img"
        aria-label={viewportAriaLabel}
        aria-describedby={`${renderId}-alt`}
        className="min-h-[18rem] max-h-[36rem] overflow-auto rounded-md border border-neutral-200 bg-neutral-50 p-4 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:border-neutral-700 dark:bg-neutral-950/80"
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
            <DialogTitle>{fullscreenTitle}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-auto p-2">{diagramBody}</div>
        </DialogContent>
      </Dialog>
    </figure>
  );
}
