'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type SetStateAction } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { ArchitectureDiagramViewportControls } from '@/components/architecture/ArchitectureDiagramViewportControls';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SeverityTag } from '@/components/ui/severity-tag';
import {
  ARCHITECTURE_DIAGRAM_FIT_IN_VIEW_LABEL,
  ARCHITECTURE_DIAGRAM_FULLSCREEN_ACTION,
  ARCHITECTURE_DIAGRAM_RENDER_FAILURE,
  ARCHITECTURE_DIAGRAM_RESET_ZOOM_LABEL,
  ARCHITECTURE_DIAGRAM_RETRY_ACTION,
  ARCHITECTURE_DIAGRAM_VIEWPORT_HINT,
  ARCHITECTURE_DIAGRAM_ZOOM_IN_LABEL,
  ARCHITECTURE_DIAGRAM_ZOOM_OUT_LABEL,
} from '@/lib/architecture/architecture-diagram-copy';
import { createArchitectureDiagramMermaidConfig } from '@/lib/architecture/architecture-diagram-mermaid-config';
import {
  architectureDiagramFullscreenHrefFromSearch,
  architectureDiagramPercentToZoom,
  architectureDiagramZoomHrefFromSearch,
  architectureDiagramZoomToPercent,
  clampArchitectureDiagramZoom,
  MAX_ARCHITECTURE_DIAGRAM_ZOOM,
  MAX_ARCHITECTURE_DIAGRAM_ZOOM_PERCENT,
  MIN_ARCHITECTURE_DIAGRAM_ZOOM,
  MIN_ARCHITECTURE_DIAGRAM_ZOOM_PERCENT,
  parseArchitectureDiagramFullscreenOpenFromSearch,
  parseArchitectureDiagramZoomFromSearch,
} from '@/lib/architecture/architecture-diagram-fullscreen-url';
import { sanitizeArchitectureDiagramSvg } from '@/lib/architecture/architecture-diagram-svg';
import {
  applyMermaidSvgViewportZoom,
  fitMermaidSvgElementToHost,
  fitMermaidSvgElementToViewport,
  type MermaidViewportFitDimensions,
  prepareMermaidSvgForResponsiveLayout,
  sanitizeMermaidRenderId,
} from '@/lib/help/help-mermaid';
import { OPERATOR_TYPOGRAPHY } from '@/lib/design-tokens';
import { useDocumentDarkMode } from '@/lib/use-document-dark-mode';
import { cn } from '@/lib/utils';

const ZOOM_STEP = 0.1;
const MAX_INITIAL_FIT_RETRIES = 8;
const INITIAL_FIT_RETRY_DELAY_MS = 120;
/** Matches Tailwind max-h-[36rem] on the inventory diagram viewport. */
const MERMAID_VIEWPORT_MAX_HEIGHT_PX = 576;

export type ArchitectureDiagramSourceKind = 'html' | 'image';

export type ArchitectureDiagramMermaidViewerProps = {
  readonly mermaidSource: string;
  readonly textAlternative: string;
  readonly viewportAriaLabel?: string;
  readonly fullscreenTitle?: string;
  readonly scopeContextLine?: string | null;
  readonly canvasStale?: boolean;
  readonly onRenderFailure?: () => void;
  readonly onRetry?: () => void;
  /** Fires when sanitized SVG markup is ready for browser PNG export. */
  readonly onExportableSvgMarkupChange?: (svgMarkup: string | null) => void;
};

export type ArchitectureDiagramStaticViewerProps = {
  /** Raw SVG string or image URL from inventory metadata. */
  readonly source: string;
  readonly sourceKind: ArchitectureDiagramSourceKind;
  readonly alt: string;
  readonly className?: string;
  /** When true, wheel zoom and keyboard shortcuts are enabled (detail / expanded views). */
  readonly interactive?: boolean;
};

export type ArchitectureDiagramViewerProps =
  | ArchitectureDiagramMermaidViewerProps
  | ArchitectureDiagramStaticViewerProps;

function isMermaidViewerProps(
  props: ArchitectureDiagramViewerProps,
): props is ArchitectureDiagramMermaidViewerProps {
  return 'mermaidSource' in props;
}

function scrollViewportToOrigin(viewport: HTMLDivElement | null): void {
  if (viewport === null) {
    return;
  }

  viewport.scrollLeft = 0;
  viewport.scrollTop = 0;
}

function readMermaidViewportFitTarget(viewport: HTMLDivElement): { widthPx: number; heightPx: number } {
  const style = getComputedStyle(viewport);
  const paddingX = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight);
  const paddingY = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
  const widthPx = Math.max(1, viewport.clientWidth - paddingX);
  const measuredHeight = viewport.clientHeight - paddingY;
  const fallbackHeight = Math.min(MERMAID_VIEWPORT_MAX_HEIGHT_PX, Math.max(240, widthPx * 0.5));
  const heightPx =
    measuredHeight > 1 ? Math.min(MERMAID_VIEWPORT_MAX_HEIGHT_PX, measuredHeight) : fallbackHeight;

  return { widthPx, heightPx };
}

function applyMermaidViewportCamera(
  host: HTMLDivElement,
  viewport: HTMLDivElement,
  zoom: number,
): MermaidViewportFitDimensions | null {
  const svg = host.querySelector('svg');

  if (!(svg instanceof SVGSVGElement)) {
    return null;
  }

  const { widthPx, heightPx } = readMermaidViewportFitTarget(viewport);
  const baseFit = fitMermaidSvgElementToViewport(svg, widthPx, heightPx);

  if (baseFit !== null) {
    applyMermaidSvgViewportZoom(svg, baseFit, zoom);
  }

  return baseFit;
}

function useDiagramZoomState(pathname: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlZoom = parseArchitectureDiagramZoomFromSearch(searchParams.get('diagZoom'));
  const [zoom, setZoomState] = useState<number>(() => urlZoom ?? 1);
  const [zoomPercentDraft, setZoomPercentDraft] = useState<string | null>(null);
  const zoomRef = useRef<number>(zoom);

  zoomRef.current = zoom;

  const setZoomClamped = useCallback((value: number) => {
    setZoomState(clampArchitectureDiagramZoom(value));
  }, []);

  const setZoom = useCallback(
    (value: SetStateAction<number>) => {
      const current = zoomRef.current;
      const nextRaw = typeof value === 'function' ? value(current) : value;
      const next = clampArchitectureDiagramZoom(nextRaw);

      setZoomState(next);
      router.replace(
        architectureDiagramZoomHrefFromSearch(searchParams.toString(), next, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (urlZoom !== null) {
      setZoomState(urlZoom);
    }
  }, [urlZoom]);

  const zoomIn = useCallback(() => {
    setZoom((current) => current + ZOOM_STEP);
  }, [setZoom]);

  const zoomOut = useCallback(() => {
    setZoom((current) => current - ZOOM_STEP);
  }, [setZoom]);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, [setZoom]);

  const commitZoomPercent = useCallback(
    (raw: string) => {
      setZoomPercentDraft(null);

      const trimmed = raw.trim().replace(/%$/, '');

      if (trimmed.length === 0) {
        return;
      }

      const parsed = Number.parseFloat(trimmed);

      if (!Number.isFinite(parsed)) {
        return;
      }

      setZoom(architectureDiagramPercentToZoom(parsed));
    },
    [setZoom],
  );

  const zoomPercent = architectureDiagramZoomToPercent(zoom);
  const zoomPercentInputValue = zoomPercentDraft ?? String(zoomPercent);
  const atMinZoom = zoom <= MIN_ARCHITECTURE_DIAGRAM_ZOOM + 0.001;
  const atMaxZoom = zoom >= MAX_ARCHITECTURE_DIAGRAM_ZOOM - 0.001;

  return {
    zoom,
    zoomPercent,
    zoomPercentInputValue,
    atMinZoom,
    atMaxZoom,
    setZoomPercentDraft,
    setZoomClamped,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    commitZoomPercent,
  };
}

type DiagramViewportControlsOptions = {
  readonly layout?: 'stacked' | 'overlay';
  readonly fullscreenAction?: { readonly label: string; readonly onClick: () => void };
};

function renderDiagramViewportControls(
  zoom: ReturnType<typeof useDiagramZoomState>,
  onFitInView: () => void,
  options?: DiagramViewportControlsOptions,
): React.JSX.Element {
  return (
    <ArchitectureDiagramViewportControls
      zoomPercentInputValue={zoom.zoomPercentInputValue}
      minZoomPercent={MIN_ARCHITECTURE_DIAGRAM_ZOOM_PERCENT}
      maxZoomPercent={MAX_ARCHITECTURE_DIAGRAM_ZOOM_PERCENT}
      atMinZoom={zoom.atMinZoom}
      atMaxZoom={zoom.atMaxZoom}
      onZoomPercentDraftChange={zoom.setZoomPercentDraft}
      onZoomPercentFocus={() => zoom.setZoomPercentDraft(String(zoom.zoomPercent))}
      onCommitZoomPercent={zoom.commitZoomPercent}
      onZoomIn={zoom.zoomIn}
      onZoomOut={zoom.zoomOut}
      onResetZoom={zoom.resetZoom}
      onFitInView={onFitInView}
      zoomInLabel={ARCHITECTURE_DIAGRAM_ZOOM_IN_LABEL}
      zoomOutLabel={ARCHITECTURE_DIAGRAM_ZOOM_OUT_LABEL}
      resetZoomLabel={ARCHITECTURE_DIAGRAM_RESET_ZOOM_LABEL}
      fitInViewLabel={ARCHITECTURE_DIAGRAM_FIT_IN_VIEW_LABEL}
      viewportHint={ARCHITECTURE_DIAGRAM_VIEWPORT_HINT}
      layout={options?.layout}
      fullscreenAction={options?.fullscreenAction}
    />
  );
}

const MERMAID_SVG_HOST_CLASSNAME = cn(
  'inline-block min-w-0 text-neutral-900 dark:text-neutral-100',
  '[&_svg]:block [&_svg]:overflow-visible',
  '[&_svg_text]:fill-current [&_svg_.cluster-label]:fill-neutral-700 dark:[&_svg_.cluster-label]:fill-neutral-200',
  '[&_svg_.nodeLabel]:text-[15px] [&_svg_.nodeLabel]:leading-snug [&_svg_.nodeLabel]:text-neutral-900 dark:[&_svg_.nodeLabel]:text-neutral-100',
  '[&_svg_.cluster_rect]:stroke-neutral-500 [&_svg_.cluster_rect]:stroke-[1.5px]',
);

/** Interactive architecture diagram canvas with zoom, pan, fullscreen, and accessible fallback text. */
function ArchitectureDiagramMermaidCanvas(props: ArchitectureDiagramMermaidViewerProps): React.JSX.Element {
  const {
    mermaidSource,
    onRenderFailure,
    viewportAriaLabel = 'Architecture diagram',
    fullscreenTitle = 'Architecture diagram',
    scopeContextLine = null,
    canvasStale = false,
  } = props;
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const reactId = useId();
  const renderId = useMemo(() => sanitizeMermaidRenderId(`arch-diagram-${reactId}`), [reactId]);
  const dark = useDocumentDarkMode();
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [fullscreenOpen, setFullscreenOpenState] = useState(() =>
    parseArchitectureDiagramFullscreenOpenFromSearch(searchParams.get('diagFullscreen')),
  );
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const svgHostRef = useRef<HTMLDivElement | null>(null);
  const fullscreenViewportRef = useRef<HTMLDivElement | null>(null);
  const fullscreenHostRef = useRef<HTMLDivElement | null>(null);
  const baseFitRef = useRef<MermaidViewportFitDimensions | null>(null);
  const fullscreenBaseFitRef = useRef<MermaidViewportFitDimensions | null>(null);
  const fullscreenOpenRef = useRef<boolean>(fullscreenOpen);
  const zoom = useDiagramZoomState(pathname);

  fullscreenOpenRef.current = fullscreenOpen;

  const setFullscreenOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      const current = fullscreenOpenRef.current;
      const next = typeof value === 'function' ? value(current) : value;

      setFullscreenOpenState(next);
      router.replace(
        architectureDiagramFullscreenHrefFromSearch(searchParams.toString(), next, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    let canceled = false;

    async function renderDiagram(): Promise<void> {
      setRenderError(null);
      setSvgMarkup(null);

      try {
        const mermaidModule = await import('mermaid');
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

  const sanitizedSvg = useMemo(() => {
    if (svgMarkup === null) {
      return null;
    }

    return sanitizeArchitectureDiagramSvg(svgMarkup);
  }, [svgMarkup]);

  useEffect(() => {
    props.onExportableSvgMarkupChange?.(sanitizedSvg);
  }, [props.onExportableSvgMarkupChange, sanitizedSvg]);

  const syncInlineViewportCamera = useCallback((): void => {
    const host = svgHostRef.current;
    const viewport = viewportRef.current;

    if (host === null || viewport === null) {
      return;
    }

    baseFitRef.current = applyMermaidViewportCamera(host, viewport, zoom.zoom);
  }, [zoom.zoom]);

  const syncFullscreenViewportCamera = useCallback((): void => {
    const host = fullscreenHostRef.current;
    const viewport = fullscreenViewportRef.current;

    if (host === null || viewport === null) {
      return;
    }

    fullscreenBaseFitRef.current = applyMermaidViewportCamera(host, viewport, zoom.zoom);
  }, [zoom.zoom]);

  const fitToView = useCallback(() => {
    zoom.setZoom(1);
    scrollViewportToOrigin(viewportRef.current);
    scrollViewportToOrigin(fullscreenViewportRef.current);

    const host = svgHostRef.current;
    const viewport = viewportRef.current;

    if (host !== null && viewport !== null) {
      baseFitRef.current = applyMermaidViewportCamera(host, viewport, 1);
    }

    if (fullscreenOpenRef.current) {
      syncFullscreenViewportCamera();
    }
  }, [syncFullscreenViewportCamera, zoom]);

  useLayoutEffect(() => {
    if (sanitizedSvg === null) {
      return;
    }

    syncInlineViewportCamera();

    const rafId = window.requestAnimationFrame(() => {
      syncInlineViewportCamera();
    });

    const viewport = viewportRef.current;
    const resizeObserver =
      viewport === null || typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            syncInlineViewportCamera();
          });

    if (resizeObserver !== null && viewport !== null) {
      resizeObserver.observe(viewport);
    }

    return (): void => {
      window.cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
    };
  }, [sanitizedSvg, syncInlineViewportCamera]);

  useLayoutEffect(() => {
    if (!fullscreenOpen || sanitizedSvg === null) {
      return;
    }

    syncFullscreenViewportCamera();

    const rafId = window.requestAnimationFrame(() => {
      syncFullscreenViewportCamera();
    });

    const viewport = fullscreenViewportRef.current;
    const resizeObserver =
      viewport === null || typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            syncFullscreenViewportCamera();
          });

    if (resizeObserver !== null && viewport !== null) {
      resizeObserver.observe(viewport);
    }

    return (): void => {
      window.cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
    };
  }, [fullscreenOpen, sanitizedSvg, syncFullscreenViewportCamera]);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (viewport === null) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        zoom.zoomIn();
      }

      if (event.key === '-') {
        event.preventDefault();
        zoom.zoomOut();
      }

      if (event.key === '0') {
        event.preventDefault();
        zoom.resetZoom();
        scrollViewportToOrigin(viewport);
      }
    };

    viewport.addEventListener('keydown', onKeyDown);

    return (): void => {
      viewport.removeEventListener('keydown', onKeyDown);
    };
  }, [zoom]);

  const onWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();

        if (event.deltaY < 0) {
          zoom.zoomIn();
        } else if (event.deltaY > 0) {
          zoom.zoomOut();
        }
      }
    },
    [zoom],
  );

  const viewportControlOptions = useMemo(
    () => ({
      layout: 'overlay' as const,
      fullscreenAction: {
        label: ARCHITECTURE_DIAGRAM_FULLSCREEN_ACTION,
        onClick: () => setFullscreenOpen(true),
      },
    }),
    [setFullscreenOpen],
  );

  const renderMermaidInk = (
    hostRef: React.RefObject<HTMLDivElement | null>,
    testId?: string,
  ): React.JSX.Element => {
    if (renderError !== null) {
      return (
        <div className="space-y-3" role="alert" data-testid="architecture-diagram-render-failure">
          <SeverityTag severity="high" label="Diagram render error" />
          <p className={cn('m-0 text-amber-800 dark:text-amber-200', OPERATOR_TYPOGRAPHY.body)}>{renderError}</p>
          {props.onRetry !== undefined ? (
            <Button type="button" variant="outline" size="sm" onClick={props.onRetry}>
              {ARCHITECTURE_DIAGRAM_RETRY_ACTION}
            </Button>
          ) : null}
        </div>
      );
    }

    if (sanitizedSvg === null) {
      return (
        <p className={cn('m-0 text-neutral-500 dark:text-neutral-400', OPERATOR_TYPOGRAPHY.body)} aria-live="polite">
          Rendering architecture diagram…
        </p>
      );
    }

    return (
      <div
        ref={hostRef}
        data-testid={testId}
        className={cn(MERMAID_SVG_HOST_CLASSNAME, canvasStale ? 'opacity-60' : undefined)}
        dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
      />
    );
  };

  return (
    <figure data-testid="architecture-diagram-viewer">
      {scopeContextLine != null && scopeContextLine.trim().length > 0 ? (
        <p
          className={cn('mb-2 text-al-text-secondary', OPERATOR_TYPOGRAPHY.helper)}
          data-testid="architecture-diagram-scope-context"
        >
          {scopeContextLine}
        </p>
      ) : null}

      {canvasStale ? (
        <p className={cn('mb-2 text-amber-800 dark:text-amber-200', OPERATOR_TYPOGRAPHY.helper)}>
          Canvas may be stale while a new render loads.
        </p>
      ) : null}

      <div
        ref={viewportRef}
        tabIndex={0}
        role="img"
        aria-label={viewportAriaLabel}
        aria-describedby={`${renderId}-alt`}
        className="relative w-full max-h-[36rem] overflow-auto rounded-md border border-neutral-200 bg-neutral-50 p-4 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:border-neutral-700 dark:bg-neutral-950/80"
        data-testid="architecture-diagram-viewport"
        onWheel={onWheel}
      >
        {renderDiagramViewportControls(zoom, fitToView, viewportControlOptions)}
        {renderMermaidInk(svgHostRef, 'architecture-diagram-svg-host')}
      </div>

      <p id={`${renderId}-alt`} className="sr-only">
        {props.textAlternative}
      </p>

      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent className="max-h-[95vh] max-w-[95vw] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{fullscreenTitle}</DialogTitle>
          </DialogHeader>
          <div
            ref={fullscreenViewportRef}
            tabIndex={0}
            className="relative max-h-[80vh] overflow-auto rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-950/80"
            data-testid="architecture-diagram-fullscreen-viewport"
            onWheel={onWheel}
          >
            {renderDiagramViewportControls(zoom, fitToView, viewportControlOptions)}
            {renderMermaidInk(fullscreenHostRef, 'architecture-diagram-fullscreen-svg-host')}
          </div>
        </DialogContent>
      </Dialog>
    </figure>
  );
}

function ArchitectureDiagramStaticCanvas(props: ArchitectureDiagramStaticViewerProps): React.JSX.Element {
  const { source, sourceKind, alt, className, interactive = false } = props;
  const pathname = usePathname() ?? '';
  const viewportRef = useRef<HTMLDivElement>(null);
  const diagramHostRef = useRef<HTMLDivElement>(null);
  const fitRetryCountRef = useRef(0);
  const fitRetryTimeoutRef = useRef<number | null>(null);
  const zoom = useDiagramZoomState(pathname);
  const isInteractiveView = interactive || sourceKind === 'html';

  const applySvgFitToHost = useCallback((): boolean => {
    if (sourceKind !== 'html') {
      return false;
    }

    const host = diagramHostRef.current;

    if (host === null) {
      return false;
    }

    const svg = host.querySelector('svg');

    if (!(svg instanceof SVGSVGElement)) {
      return false;
    }

    const width = host.clientWidth;

    if (width <= 0) {
      return false;
    }

    fitMermaidSvgElementToHost(svg, width);

    return true;
  }, [sourceKind]);

  const fitToView = useCallback(() => {
    if (sourceKind !== 'html') {
      return;
    }

    applySvgFitToHost();
    zoom.setZoom(1);
    scrollViewportToOrigin(viewportRef.current);
  }, [applySvgFitToHost, sourceKind, zoom]);

  useLayoutEffect(() => {
    if (sourceKind !== 'html') {
      return;
    }

    fitRetryCountRef.current = 0;

    if (fitRetryTimeoutRef.current !== null) {
      window.clearTimeout(fitRetryTimeoutRef.current);
      fitRetryTimeoutRef.current = null;
    }

    const scheduleFitRetry = (): void => {
      fitRetryCountRef.current += 1;

      if (fitRetryCountRef.current > MAX_INITIAL_FIT_RETRIES) {
        return;
      }

      fitRetryTimeoutRef.current = window.setTimeout(() => {
        fitRetryTimeoutRef.current = null;

        if (applySvgFitToHost()) {
          scrollViewportToOrigin(viewportRef.current);
          return;
        }

        scheduleFitRetry();
      }, INITIAL_FIT_RETRY_DELAY_MS);
    };

    const runInitialFit = (): void => {
      if (applySvgFitToHost()) {
        scrollViewportToOrigin(viewportRef.current);
        return;
      }

      window.requestAnimationFrame(() => {
        if (applySvgFitToHost()) {
          scrollViewportToOrigin(viewportRef.current);
          return;
        }

        scheduleFitRetry();
      });
    };

    runInitialFit();

    return () => {
      if (fitRetryTimeoutRef.current !== null) {
        window.clearTimeout(fitRetryTimeoutRef.current);
        fitRetryTimeoutRef.current = null;
      }
    };
  }, [applySvgFitToHost, source, sourceKind]);

  useEffect(() => {
    if (!isInteractiveView) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        zoom.zoomIn();
      } else if (event.key === '-') {
        event.preventDefault();
        zoom.zoomOut();
      } else if (event.key === '0') {
        event.preventDefault();
        zoom.resetZoom();
        scrollViewportToOrigin(viewportRef.current);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isInteractiveView, zoom]);

  const onWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (!isInteractiveView) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();

        if (event.deltaY < 0) {
          zoom.zoomIn();
        } else if (event.deltaY > 0) {
          zoom.zoomOut();
        }
      }
    },
    [isInteractiveView, zoom],
  );

  const viewportControls = renderDiagramViewportControls(zoom, fitToView);

  if (sourceKind === 'image') {
    return (
      <div className={cn('relative flex flex-col gap-2', className)}>
        {isInteractiveView ? viewportControls : null}
        <div
          ref={viewportRef}
          className="overflow-auto rounded-md border border-border bg-muted/20"
          onWheel={onWheel}
          role="region"
          aria-label={`${alt} diagram viewport`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={source}
            alt={alt}
            className="max-w-full transition-transform duration-150 ease-out"
            style={{ transform: `scale(${zoom.zoom})`, transformOrigin: 'top left' }}
            draggable={false}
          />
        </div>
      </div>
    );
  }

  const sanitizedHtml = sanitizeArchitectureDiagramSvg(source);

  return (
    <div className={cn('relative flex flex-col gap-2', className)}>
      {isInteractiveView ? viewportControls : null}
      <div
        ref={viewportRef}
        className="overflow-auto rounded-md border border-border bg-muted/20 p-2"
        onWheel={onWheel}
        role="region"
        aria-label={`${alt} diagram viewport`}
      >
        <div
          ref={diagramHostRef}
          className="inline-block min-w-full origin-top-left transition-transform duration-150 ease-out [&_svg]:max-w-none"
          style={{ transform: `scale(${zoom.zoom})`, transformOrigin: 'top left' }}
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      </div>
    </div>
  );
}

export function ArchitectureDiagramViewer(props: ArchitectureDiagramViewerProps): React.JSX.Element {
  if (isMermaidViewerProps(props)) {
    return <ArchitectureDiagramMermaidCanvas {...props} />;
  }

  return <ArchitectureDiagramStaticCanvas {...props} />;
}
