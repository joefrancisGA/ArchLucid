import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArchitectureDiagramViewer } from '@/components/architecture/ArchitectureDiagramViewer';
import * as helpMermaid from '@/lib/help/help-mermaid';
import {
  ARCHITECTURE_DIAGRAM_FIT_IN_VIEW_LABEL,
  ARCHITECTURE_DIAGRAM_FULLSCREEN_ACTION,
  ARCHITECTURE_DIAGRAM_PAINT_FAILURE,
  ARCHITECTURE_DIAGRAM_RESET_ZOOM_LABEL,
  ARCHITECTURE_DIAGRAM_VIEWPORT_HINT,
  ARCHITECTURE_DIAGRAM_ZOOM_IN_LABEL,
  ARCHITECTURE_DIAGRAM_ZOOM_OUT_LABEL,
  ARCHITECTURE_DIAGRAM_ZOOM_PERCENT_LABEL,
} from '@/lib/architecture/architecture-diagram-copy';

const sampleSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#eee"/></svg>';

const measurableMermaidSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
  '<g class="node"><rect width="100" height="100" fill="#eee"/><text class="nodeLabel">Node A</text></g>' +
  '</svg>';

const renderMock = vi.fn().mockResolvedValue({
  svg: measurableMermaidSvg,
});
const initializeMock = vi.fn();

vi.mock('mermaid', () => ({
  default: {
    initialize: initializeMock,
    render: renderMock,
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

const replaceMock = vi.fn();
const searchParamsMock = new URLSearchParams();

function stubMeasurableMermaidInkGeometry(): void {
  const measurableBBox = (): DOMRect =>
    ({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      top: 0,
      right: 100,
      bottom: 100,
      left: 0,
      toJSON: () => ({}),
    }) as DOMRect;

  Object.defineProperty(SVGGraphicsElement.prototype, 'getBBox', {
    configurable: true,
    writable: true,
    value: measurableBBox,
  });
  Object.defineProperty(SVGGraphicsElement.prototype, 'getCTM', {
    configurable: true,
    writable: true,
    value: (): DOMMatrix => new DOMMatrix(),
  });
  Object.defineProperty(SVGSVGElement.prototype, 'getScreenCTM', {
    configurable: true,
    writable: true,
    value: (): DOMMatrix => new DOMMatrix(),
  });
}

function restoreMermaidInkGeometry(): void {
  delete (SVGGraphicsElement.prototype as { getBBox?: unknown }).getBBox;
  delete (SVGGraphicsElement.prototype as { getCTM?: unknown }).getCTM;
  delete (SVGSVGElement.prototype as { getScreenCTM?: unknown }).getScreenCTM;
}

function stubDiagramViewportDimensions(): void {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get: (): number => 800,
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get: (): number => 400,
  });
}

function restoreDiagramViewportDimensions(): void {
  delete (HTMLElement.prototype as { clientWidth?: unknown }).clientWidth;
  delete (HTMLElement.prototype as { clientHeight?: unknown }).clientHeight;
}

describe('ArchitectureDiagramViewer', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    renderMock.mockReset();
    renderMock.mockResolvedValue({ svg: measurableMermaidSvg });
    initializeMock.mockReset();
    searchParamsMock.delete('diagZoom');
    restoreMermaidInkGeometry();
    restoreDiagramViewportDimensions();
    vi.restoreAllMocks();
    stubMeasurableMermaidInkGeometry();
    stubDiagramViewportDimensions();
    vi.mocked(useRouter).mockReturnValue({
      replace: replaceMock,
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(usePathname).mockReturnValue('/securenow/inventory');
    vi.mocked(useSearchParams).mockReturnValue(
      searchParamsMock as unknown as ReturnType<typeof useSearchParams>
    );
  });

  it('renders labeled zoom controls for HTML diagrams', () => {
    render(
      <ArchitectureDiagramViewer source={sampleSvg} sourceKind="html" alt="Inventory topology" />
    );

    expect(screen.getByRole('button', { name: ARCHITECTURE_DIAGRAM_ZOOM_IN_LABEL })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ARCHITECTURE_DIAGRAM_ZOOM_OUT_LABEL })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ARCHITECTURE_DIAGRAM_RESET_ZOOM_LABEL })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ARCHITECTURE_DIAGRAM_FIT_IN_VIEW_LABEL })).toBeInTheDocument();
    expect(screen.getByText(ARCHITECTURE_DIAGRAM_VIEWPORT_HINT)).toBeInTheDocument();
    expect(screen.getByLabelText(ARCHITECTURE_DIAGRAM_ZOOM_PERCENT_LABEL)).toBeInTheDocument();
  });

  it('fit in view clears diagram zoom from the URL and shows 100 percent', async () => {
    searchParamsMock.set('diagZoom', '1.50');

    render(
      <ArchitectureDiagramViewer source={sampleSvg} sourceKind="html" alt="Inventory topology" />
    );

    expect(screen.getByLabelText(ARCHITECTURE_DIAGRAM_ZOOM_PERCENT_LABEL)).toHaveValue(150);

    fireEvent.click(screen.getByRole('button', { name: ARCHITECTURE_DIAGRAM_FIT_IN_VIEW_LABEL }));

    expect(replaceMock).toHaveBeenCalled();
    const lastCall = replaceMock.mock.calls.at(-1);

    expect(lastCall?.[0]).not.toContain('diagZoom=');
    expect(screen.getByLabelText(ARCHITECTURE_DIAGRAM_ZOOM_PERCENT_LABEL)).toHaveValue(100);
  });

  it('applies a custom zoom percentage from the input', async () => {
    render(
      <ArchitectureDiagramViewer source={sampleSvg} sourceKind="html" alt="Inventory topology" />
    );

    const zoomInput = screen.getByLabelText(ARCHITECTURE_DIAGRAM_ZOOM_PERCENT_LABEL);

    fireEvent.change(zoomInput, { target: { value: '350' } });
    fireEvent.blur(zoomInput);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/securenow/inventory?diagZoom=3.50', {
        scroll: false,
      });
    });
  });

  it('clamps custom zoom percentages to the supported range', async () => {
    render(
      <ArchitectureDiagramViewer source={sampleSvg} sourceKind="html" alt="Inventory topology" />
    );

    const zoomInput = screen.getByLabelText(ARCHITECTURE_DIAGRAM_ZOOM_PERCENT_LABEL);

    fireEvent.change(zoomInput, { target: { value: '1500' } });
    fireEvent.blur(zoomInput);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/securenow/inventory?diagZoom=10.00', {
        scroll: false,
      });
    });
  });

  it('renders mermaid source into the diagram viewport', async () => {
    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart LR\n  A-->B'}
        textAlternative="Inventory topology"
        viewportAriaLabel="Inventory topology"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('architecture-diagram-viewport')).toBeInTheDocument();
    });

    expect(initializeMock).toHaveBeenCalledWith(
      expect.objectContaining({ suppressErrorRendering: true, startOnLoad: false }),
    );
    expect(renderMock).toHaveBeenCalled();
    expect(screen.getByText('Node A')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ARCHITECTURE_DIAGRAM_ZOOM_IN_LABEL })).toBeInTheDocument();
  });

  it('strips inline mermaid comments before calling mermaid.render', async () => {
    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TD\n  n1["app-hi-test-wus-001"] %% al-type=microsoft'}
        textAlternative="Inventory topology"
        viewportAriaLabel="Inventory topology"
      />,
    );

    await waitFor(() => {
      expect(renderMock).toHaveBeenCalled();
    });

    expect(renderMock.mock.calls[0]?.[1]).toBe('flowchart TD\n  n1["app-hi-test-wus-001"]');
  });

  it('preserves foreignObject labels when sanitizing diagram HTML', () => {
    const labeledSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">' +
      '<foreignObject width="10" height="10"><div xmlns="http://www.w3.org/1999/xhtml">Edge label</div></foreignObject>' +
      '</svg>';

    render(
      <ArchitectureDiagramViewer source={labeledSvg} sourceKind="html" alt="Labeled diagram" />
    );

    expect(screen.getByText('Edge label')).toBeInTheDocument();
  });

  it('shows renderer failure and retry action', async () => {
    renderMock.mockRejectedValueOnce(new Error('Renderer failed'));
    const onRetry = vi.fn();
    const removeBindSpy = vi.spyOn(helpMermaid, 'removeMermaidRenderBindElement');

    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TB\n  a["A"]'}
        textAlternative="A"
        viewportAriaLabel="Inventory diagram for snapshot snap-1"
        fullscreenTitle="Inventory diagram · Executive"
        onRetry={onRetry}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('architecture-diagram-render-failure')).toBeInTheDocument();
    });

    expect(removeBindSpy).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();
    removeBindSpy.mockRestore();
    expect(onRetry).toHaveBeenCalled();
  });

  it('shows in-flow paint failure when fitted ink height is too small', async () => {
    const fitSpy = vi.spyOn(helpMermaid, 'fitMermaidSvgElementToViewport').mockReturnValue({
      baseWidthPx: 10,
      baseHeightPx: 10,
    });

    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TB\n  a["A"]'}
        textAlternative="A"
        viewportAriaLabel="Inventory diagram for snapshot snap-1"
        fullscreenTitle="Inventory diagram · Identity"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('architecture-diagram-render-failure')).toBeInTheDocument();
    });

    expect(screen.getByText(ARCHITECTURE_DIAGRAM_PAINT_FAILURE)).toBeInTheDocument();

    const viewport = screen.getByTestId('architecture-diagram-viewport');

    expect(viewport).toContainElement(screen.getByTestId('architecture-diagram-render-failure'));
    expect(viewport).toContainElement(screen.getByTestId('architecture-diagram-viewport-controls'));

    fitSpy.mockRestore();
  });

  it('keeps mermaid viewport controls and fullscreen inside the diagram viewport', async () => {
    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TB\n  a["A"]'}
        textAlternative="A"
        viewportAriaLabel="Inventory diagram for snapshot snap-1"
        fullscreenTitle="Inventory diagram · Executive"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('architecture-diagram-viewport')).toBeInTheDocument();
    });

    const viewport = screen.getByTestId('architecture-diagram-viewport');

    expect(viewport).toContainElement(screen.getByTestId('architecture-diagram-viewport-controls'));
    expect(viewport).toContainElement(screen.getByRole('button', { name: ARCHITECTURE_DIAGRAM_FULLSCREEN_ACTION }));
  });

  it('zooms the mermaid viewport with ctrl+wheel', async () => {
    replaceMock.mockClear();

    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TB\n  a["A"]'}
        textAlternative="A"
        viewportAriaLabel="Inventory diagram for snapshot snap-1"
        fullscreenTitle="Inventory diagram · Executive"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('architecture-diagram-viewport')).toBeInTheDocument();
    });

    const viewport = screen.getByTestId('architecture-diagram-viewport');

    fireEvent.wheel(viewport, { deltaY: -100, ctrlKey: true });

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/securenow/inventory?diagZoom=1.10', {
        scroll: false,
      });
    });
  });

  it('syncs zoom changes to the URL after user interaction', async () => {
    replaceMock.mockClear();

    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TB\n  a["A"]'}
        textAlternative="A"
        viewportAriaLabel="Inventory diagram for snapshot snap-1"
        fullscreenTitle="Inventory diagram · Executive"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('architecture-diagram-viewport')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: ARCHITECTURE_DIAGRAM_ZOOM_IN_LABEL }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/securenow/inventory?diagZoom=1.10', {
        scroll: false,
      });
    });
  });

  it('sizes mermaid svg above the overlay-only floor after render', async () => {
    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TB\n  a["A"]'}
        textAlternative="A"
        viewportAriaLabel="Inventory diagram for snapshot snap-1"
        fullscreenTitle="Inventory diagram · Executive"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('architecture-diagram-svg-host')).toBeInTheDocument();
    });

    const host = screen.getByTestId('architecture-diagram-svg-host');
    const svg = host.querySelector('svg');

    expect(svg).not.toBeNull();
    expect(Number(svg?.getAttribute('height') ?? 0)).toBeGreaterThanOrEqual(240);
  });
});
