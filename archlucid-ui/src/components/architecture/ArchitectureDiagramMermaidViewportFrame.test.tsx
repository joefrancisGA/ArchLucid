import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ArchitectureDiagramMermaidViewportFrame } from '@/components/architecture/ArchitectureDiagramMermaidViewportFrame';

describe('ArchitectureDiagramMermaidViewportFrame', () => {
  it('keeps overlay chrome outside the overflow camera', () => {
    const frameRef = createRef<HTMLDivElement>();
    const cameraRef = createRef<HTMLDivElement>();
    const onWheel = vi.fn();
    const onKeyDown = vi.fn();

    render(
      <ArchitectureDiagramMermaidViewportFrame
        frameRef={frameRef}
        cameraRef={cameraRef}
        viewportTestId="architecture-diagram-viewport"
        cameraTestId="architecture-diagram-camera"
        ariaLabel="Inventory diagram"
        describedBy="diagram-alt"
        tabIndex={0}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
        controls={<div data-testid="architecture-diagram-viewport-controls">Zoom</div>}
        cameraMaxHeightClassName="max-h-[36rem]"
      >
        <svg data-testid="diagram-ink" />
      </ArchitectureDiagramMermaidViewportFrame>,
    );

    const viewport = screen.getByTestId('architecture-diagram-viewport');
    const camera = screen.getByTestId('architecture-diagram-camera');
    const controls = screen.getByTestId('architecture-diagram-viewport-controls');

    expect(viewport).toContainElement(controls);
    expect(camera).toContainElement(screen.getByTestId('diagram-ink'));
    expect(camera.contains(controls)).toBe(false);
    expect(viewport.className.split(/\s+/u)).not.toContain('overflow-auto');
    expect(camera.className.split(/\s+/u)).toContain('overflow-auto');
    expect(camera.className).toContain('max-h-[36rem]');
    expect(cameraRef.current).toBe(camera);
    expect(frameRef.current).toBe(viewport);
    expect(viewport).toHaveAttribute('aria-describedby', 'diagram-alt');

    const inkClip = screen.getByTestId('architecture-diagram-ink-clip');
    expect(camera).toContainElement(inkClip);
    expect(inkClip).toContainElement(screen.getByTestId('diagram-ink'));
    expect(inkClip.className.split(/\s+/u)).toContain('overflow-hidden');
  });
});
