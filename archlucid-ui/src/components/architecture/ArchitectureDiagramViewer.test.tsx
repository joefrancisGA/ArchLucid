import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

  it('disables fit in view at the default 100 percent zoom', () => {
    render(
      <ArchitectureDiagramViewer source={sampleSvg} sourceKind="html" alt="Inventory topology" />
    );

    expect(screen.getByRole('button', { name: ARCHITECTURE_DIAGRAM_FIT_IN_VIEW_LABEL })).toBeDisabled();
  });

  it('fit in view clears diagram zoom from the URL and shows 100 percent', async () => {
    searchParamsMock.set('diagZoom', '1.50');

    render(
      <ArchitectureDiagramViewer source={sampleSvg} sourceKind="html" alt="Inventory topology" />
    );

    expect(screen.getByLabelText(ARCHITECTURE_DIAGRAM_ZOOM_PERCENT_LABEL)).toHaveValue(150);

    const fitInViewButton = screen.getByRole('button', { name: ARCHITECTURE_DIAGRAM_FIT_IN_VIEW_LABEL });

    expect(fitInViewButton).toBeEnabled();

    fireEvent.click(fitInViewButton);

    expect(replaceMock).toHaveBeenCalled();
    const lastCall = replaceMock.mock.calls.at(-1);

    expect(lastCall?.[0]).not.toContain('diagZoom=');
    expect(screen.getByLabelText(ARCHITECTURE_DIAGRAM_ZOOM_PERCENT_LABEL)).toHaveValue(100);
    expect(fitInViewButton).toBeDisabled();
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

  it('paints server layout SVG without invoking client mermaid render', async () => {
    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TD\n  a["A"] --> b["B"]'}
        layoutSvg={measurableMermaidSvg}
        textAlternative="Inventory topology"
        viewportAriaLabel="Inventory topology"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('architecture-diagram-svg-host')).toBeInTheDocument();
    });

    expect(renderMock).not.toHaveBeenCalled();
    expect(screen.getByText('Node A')).toBeInTheDocument();
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

  it('retries mermaid.render on a new id after a firstChild crash', async () => {
    renderMock.mockRejectedValueOnce(new Error("Cannot read properties of null (reading 'firstChild')"));
    const onRetry = vi.fn();

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

    expect(screen.getByText(/firstChild/)).toBeInTheDocument();
    expect(renderMock).toHaveBeenCalledTimes(1);
    const firstRenderId = renderMock.mock.calls[0]?.[0];

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByTestId('architecture-diagram-svg-host')).toBeInTheDocument();
    });

    expect(renderMock).toHaveBeenCalledTimes(2);
    expect(renderMock.mock.calls[1]?.[0]).not.toBe(firstRenderId);
  });

  it('shows in-flow paint failure when fitted ink height is too small', async () => {
    const fitSpy = vi.spyOn(helpMermaid, 'fitMermaidSvgElementToViewport').mockReturnValue({
      baseWidthPx: 10,
      baseHeightPx: 10,
      inkMeasured: true,
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

  it('shows in-flow paint failure when the viewport is large but ink was not measured', async () => {
    const fitSpy = vi.spyOn(helpMermaid, 'fitMermaidSvgElementToViewport').mockReturnValue({
      baseWidthPx: 800,
      baseHeightPx: 240,
      inkMeasured: false,
    });

    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TB\n  a["A"]'}
        textAlternative="A"
        viewportAriaLabel="Inventory diagram for snapshot snap-1"
        fullscreenTitle="Inventory diagram · Executive"
      />,
    );

    await waitFor(
      () => {
        expect(screen.getByTestId('architecture-diagram-render-failure')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    expect(screen.getByText(ARCHITECTURE_DIAGRAM_PAINT_FAILURE)).toBeInTheDocument();

    const viewport = screen.getByTestId('architecture-diagram-viewport');

    expect(viewport).toContainElement(screen.getByTestId('architecture-diagram-render-failure'));
    expect(viewport).toContainElement(screen.getByTestId('architecture-diagram-viewport-controls'));
    expect(viewport.className).toContain('bg-white');

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

  it('pins mermaid zoom controls to the visible frame, not the scrolling camera', async () => {
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

    const viewport = screen.getByTestId('architecture-diagram-viewport');
    const camera = screen.getByTestId('architecture-diagram-camera');
    const controls = screen.getByTestId('architecture-diagram-viewport-controls');

    expect(viewport).toContainElement(controls);
    expect(viewport).toContainElement(camera);
    expect(camera).toContainElement(screen.getByTestId('architecture-diagram-svg-host'));
    expect(camera.contains(controls)).toBe(false);
    expect(viewport.className.split(/\s+/u)).not.toContain('overflow-auto');
    expect(camera.className.split(/\s+/u)).toContain('overflow-auto');

    fireEvent.click(screen.getByRole('button', { name: ARCHITECTURE_DIAGRAM_FULLSCREEN_ACTION }));

    await waitFor(() => {
      expect(screen.getByTestId('architecture-diagram-fullscreen-viewport')).toBeInTheDocument();
    });

    const fullscreen = screen.getByTestId('architecture-diagram-fullscreen-viewport');
    const fullscreenCamera = screen.getByTestId('architecture-diagram-fullscreen-camera');
    const fullscreenControls = within(fullscreen).getByTestId('architecture-diagram-viewport-controls');

    expect(fullscreen).toContainElement(fullscreenControls);
    expect(fullscreenCamera.contains(fullscreenControls)).toBe(false);
    expect(fullscreen.className.split(/\s+/u)).not.toContain('overflow-auto');
    expect(fullscreenCamera.className.split(/\s+/u)).toContain('overflow-auto');
  });

  it('places stacked viewport controls above the diagram viewport when requested', async () => {
    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TB\n  a["A"]'}
        textAlternative="A"
        viewportAriaLabel="Inventory diagram for snapshot snap-1"
        fullscreenTitle="Inventory diagram · Executive"
        viewportControlsLayout="stacked"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('architecture-diagram-viewport')).toBeInTheDocument();
    });

    const viewport = screen.getByTestId('architecture-diagram-viewport');
    const controls = screen.getByTestId('architecture-diagram-viewport-controls');

    expect(viewport).not.toContainElement(controls);
    expect(controls.compareDocumentPosition(viewport) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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

  it('keeps URL zoom on first mermaid mount and resets to 100 percent when the source changes', async () => {
    searchParamsMock.set('diagZoom', '0.30');

    const { rerender } = render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TD\n  a["A"]'}
        textAlternative="A"
        viewportAriaLabel="Inventory topology"
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(ARCHITECTURE_DIAGRAM_ZOOM_PERCENT_LABEL)).toHaveValue(30);
    });

    rerender(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TD\n  b["B"]'}
        textAlternative="A"
        viewportAriaLabel="Inventory topology"
      />,
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/securenow/inventory', {
        scroll: false,
      });
    });

    expect(screen.getByLabelText(ARCHITECTURE_DIAGRAM_ZOOM_PERCENT_LABEL)).toHaveValue(100);
  });

  it('sizes mermaid svg from measured ink after render without paint failure', async () => {
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

    expect(host.className).toContain('mx-auto');
    expect(host.className).toContain('[&_svg_.clusterLabelText]:font-bold');
    expect(svg).not.toBeNull();
    expect(screen.queryByTestId('architecture-diagram-render-failure')).not.toBeInTheDocument();
    expect(Number(svg?.getAttribute('height') ?? 0)).toBeGreaterThanOrEqual(
      helpMermaid.MERMAID_VIEWPORT_MIN_INK_HEIGHT_PX,
    );
  });
});
