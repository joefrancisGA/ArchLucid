'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArchitectureDiagramViewportControls } from '@/components/architecture/ArchitectureDiagramViewportControls';
import {
  ARCHITECTURE_DIAGRAM_FIT_IN_VIEW_LABEL,
  ARCHITECTURE_DIAGRAM_RESET_ZOOM_LABEL,
  ARCHITECTURE_DIAGRAM_VIEWPORT_HINT,
  ARCHITECTURE_DIAGRAM_ZOOM_IN_LABEL,
  ARCHITECTURE_DIAGRAM_ZOOM_OUT_LABEL,
} from '@/lib/architecture/architecture-diagram-copy';
import { fitMermaidSvgElementToHost } from '@/lib/architecture/fit-mermaid-svg-to-host';
import { sanitizeArchitectureDiagramSvg } from '@/lib/architecture/sanitize-architecture-diagram-svg';
import { cn } from '@/lib/utils';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;
const MAX_INITIAL_FIT_RETRIES = 8;
const INITIAL_FIT_RETRY_DELAY_MS = 120;

export type ArchitectureDiagramSourceKind = 'html' | 'image';

export interface ArchitectureDiagramViewerProps {
  /** Raw SVG string or image URL from inventory metadata. */
  source: string;
  sourceKind: ArchitectureDiagramSourceKind;
  alt: string;
  className?: string;
  /** When true, wheel zoom and keyboard shortcuts are enabled (detail / expanded views). */
  interactive?: boolean;
}

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function parseZoomParam(raw: string | null): number | null {
  if (raw === null || raw.trim() === '') {
    return null;
  }

  const parsed = Number.parseFloat(raw);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return clampZoom(parsed);
}

function scrollViewportToOrigin(viewport: HTMLDivElement | null): void {
  if (viewport === null) {
    return;
  }

  viewport.scrollLeft = 0;
  viewport.scrollTop = 0;
}

export function ArchitectureDiagramViewer({
  source,
  sourceKind,
  alt,
  className,
  interactive = false,
}: ArchitectureDiagramViewerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewportRef = useRef<HTMLDivElement>(null);
  const diagramHostRef = useRef<HTMLDivElement>(null);
  const fitRetryCountRef = useRef(0);
  const fitRetryTimeoutRef = useRef<number | null>(null);
  const urlZoom = parseZoomParam(searchParams.get('diagZoom'));
  const [zoom, setZoomState] = useState<number>(() => urlZoom ?? 1);
  const isInteractiveView = interactive || sourceKind === 'html';

  const setZoomClamped = useCallback((value: number) => {
    setZoomState(clampZoom(value));
  }, []);

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

    return fitMermaidSvgElementToHost(svg, host);
  }, [sourceKind]);

  useEffect(() => {
    if (urlZoom !== null) {
      setZoomState(urlZoom);
    }
  }, [urlZoom]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    if (Math.abs(zoom - 1) < 0.001) {
      params.delete('diagZoom');
    } else {
      params.set('diagZoom', zoom.toFixed(2));
    }

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();

    if (nextQuery === currentQuery) {
      return;
    }

    const nextUrl = nextQuery.length > 0 ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [zoom, pathname, router, searchParams]);

  const zoomIn = useCallback(() => {
    setZoomClamped(zoom + ZOOM_STEP);
  }, [setZoomClamped, zoom]);

  const zoomOut = useCallback(() => {
    setZoomClamped(zoom - ZOOM_STEP);
  }, [setZoomClamped, zoom]);

  const resetZoom = useCallback(() => {
    setZoomClamped(1);
    scrollViewportToOrigin(viewportRef.current);
  }, [setZoomClamped]);

  const fitToView = useCallback(() => {
    if (sourceKind !== 'html') {
      return;
    }

    applySvgFitToHost();
    setZoomClamped(1);
    scrollViewportToOrigin(viewportRef.current);
  }, [applySvgFitToHost, setZoomClamped, sourceKind]);

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
        zoomIn();
      } else if (event.key === '-') {
        event.preventDefault();
        zoomOut();
      } else if (event.key === '0') {
        event.preventDefault();
        resetZoom();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isInteractiveView, resetZoom, zoomIn, zoomOut]);

  const onWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (!isInteractiveView) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();

        if (event.deltaY < 0) {
          zoomIn();
        } else if (event.deltaY > 0) {
          zoomOut();
        }
      }
    },
    [isInteractiveView, zoomIn, zoomOut]
  );

  const zoomPercentLabel = `${Math.round(zoom * 100)}%`;

  const viewportControls = (
    <ArchitectureDiagramViewportControls
      zoomPercentLabel={zoomPercentLabel}
      onZoomIn={zoomIn}
      onZoomOut={zoomOut}
      onResetZoom={resetZoom}
      onFitInView={fitToView}
      zoomInLabel={ARCHITECTURE_DIAGRAM_ZOOM_IN_LABEL}
      zoomOutLabel={ARCHITECTURE_DIAGRAM_ZOOM_OUT_LABEL}
      resetZoomLabel={ARCHITECTURE_DIAGRAM_RESET_ZOOM_LABEL}
      fitInViewLabel={ARCHITECTURE_DIAGRAM_FIT_IN_VIEW_LABEL}
      viewportHint={ARCHITECTURE_DIAGRAM_VIEWPORT_HINT}
    />
  );

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
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
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
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      </div>
    </div>
  );
}
