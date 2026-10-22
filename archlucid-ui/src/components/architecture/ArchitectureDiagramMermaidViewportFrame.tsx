import type { KeyboardEvent, ReactNode, RefObject, WheelEvent } from 'react';

import { cn } from '@/lib/utils';

export type ArchitectureDiagramMermaidViewportFrameProps = {
  readonly frameRef?: RefObject<HTMLDivElement | null>;
  readonly cameraRef: RefObject<HTMLDivElement | null>;
  readonly viewportTestId: string;
  readonly cameraTestId: string;
  readonly ariaLabel?: string;
  readonly describedBy?: string;
  readonly tabIndex?: number;
  readonly onWheel: (event: WheelEvent<HTMLDivElement>) => void;
  readonly onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  readonly controls: ReactNode;
  /** Renders above the scrolling camera, inside the diagram frame border. */
  readonly viewportHeader?: ReactNode;
  readonly children: ReactNode;
  readonly cameraMaxHeightClassName: string;
  readonly className?: string;
};

const VIEWPORT_FRAME_CLASSNAME =
  'relative w-full rounded-md border border-neutral-200 bg-white outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:border-neutral-700 dark:bg-neutral-950/80';

const CAMERA_CLASSNAME = 'overflow-auto p-4';

const INK_CLIP_CLASSNAME = 'w-max min-w-full overflow-hidden';

/**
 * Visible diagram frame with overlay chrome outside the scrolling camera.
 *
 * Overlay controls use `position:absolute; right`. If they share an
 * `overflow:auto` box with a wide SVG, `right` tracks the scrollWidth and the
 * Zoom / Fit cluster disappears off the visible edge.
 */
export function ArchitectureDiagramMermaidViewportFrame(
  props: ArchitectureDiagramMermaidViewportFrameProps,
): React.JSX.Element {
  return (
    <div
      ref={props.frameRef}
      tabIndex={props.tabIndex}
      role={props.ariaLabel != null ? 'img' : undefined}
      aria-label={props.ariaLabel}
      aria-describedby={props.describedBy}
      className={cn(VIEWPORT_FRAME_CLASSNAME, props.className)}
      data-testid={props.viewportTestId}
      onWheel={props.onWheel}
      onKeyDown={props.onKeyDown}
    >
      {props.controls}
      {props.viewportHeader}
      <div
        ref={props.cameraRef}
        className={cn(CAMERA_CLASSNAME, props.cameraMaxHeightClassName)}
        data-testid={props.cameraTestId}
      >
        <div className={INK_CLIP_CLASSNAME} data-testid="architecture-diagram-ink-clip">
          {props.children}
        </div>
      </div>
    </div>
  );
}
