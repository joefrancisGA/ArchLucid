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
  ARCHITECTURE_DIAGRAM_DATA_FLOW_NOT_MATCHED_PREFIX,
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

  it('shows the questionable explanation when a focused node carries policy attention', async () => {
    const forestLayoutSvg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60">',
      '  <g class="node" id="node-vm" transform="translate(10,10)"><title>avd01-nprod-0</title><rect class="node-card-questionable" width="80" height="30"/></g>',
      '</svg>',
    ].join('');

    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TD\n  vm["avd01-nprod-0"]'}
        layoutSvg={forestLayoutSvg}
        outline={{
          nodes: [{
            id: 'vm',
            label: 'avd01-nprod-0',
            resourceType: 'Microsoft.Compute/virtualMachines',
            resourceGroup: 'rg-avd',
            questionableReason: 'Named like an AVD host and not registered',
            questionableAction: 'Register or retire the VM',
          }],
          edges: [],
        }}
        textAlternative="Inventory topology"
      />,
    );

    const host = await screen.findByTestId('architecture-diagram-svg-host');
    fireEvent.click(host.querySelector('#node-vm')!);

    expect(host.querySelector('.node-card-questionable')).toBeInTheDocument();
    expect(await screen.findByTestId('infra-diagrams-questionable-panel')).toHaveTextContent(
      'Named like an AVD host and not registered',
    );
    expect(screen.getByTestId('infra-diagrams-questionable-panel')).toHaveTextContent(
      'Register or retire the VM',
    );
  });

  it('reports missing questionable actions while preserving stored empty actions', async () => {
    const forestLayoutSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60">' +
      '  <g class="node" id="node-vm" transform="translate(10,10)"><title>avd01-nprod-0</title><rect class="node-card-questionable" width="80" height="30"/></g>' +
      '</svg>';

    const { rerender } = render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TD\n  vm["avd01-nprod-0"]'}
        layoutSvg={forestLayoutSvg}
        outline={{
          nodes: [{
            id: 'vm',
            label: 'avd01-nprod-0',
            resourceType: 'Microsoft.Compute/virtualMachines',
            resourceGroup: 'rg-avd',
            questionableReason: 'Not registered',
            questionableAction: null,
          }],
          edges: [],
        }}
        textAlternative="Inventory topology"
      />,
    );

    const host = await screen.findByTestId('architecture-diagram-svg-host');
    fireEvent.click(host.querySelector('#node-vm')!);
    expect(await screen.findByTestId('infra-diagrams-questionable-panel')).toHaveTextContent(
      'Recommended action: Recommended action was not stored.',
    );

    rerender(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TD\n  vm["avd01-nprod-0"]'}
        layoutSvg={forestLayoutSvg}
        outline={{
          nodes: [{
            id: 'vm',
            label: 'avd01-nprod-0',
            resourceType: 'Microsoft.Compute/virtualMachines',
            resourceGroup: 'rg-avd',
            questionableReason: 'Not registered',
            questionableAction: '',
          }],
          edges: [],
        }}
        textAlternative="Inventory topology"
      />,
    );

    expect(screen.getByTestId('infra-diagrams-questionable-panel')).not.toHaveTextContent(
      'Recommended action was not stored.',
    );
  });

  it('dims unrelated forest ink without changing the camera viewBox', async () => {
    const forestLayoutSvg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120">',
      '  <g class="vnet-frame" data-frame-id="vnet-vnet-a"><title>vnet-a</title><rect x="0" y="0" width="120" height="100"/></g>',
      '  <g class="node" id="node-vault" transform="translate(10,20)"><title>vault</title><rect class="node-card" width="40" height="20"/></g>',
      '  <g class="node" id="node-vm" transform="translate(60,20)"><title>vm</title><rect class="node-card" width="40" height="20"/></g>',
      '  <g class="node" id="node-other" transform="translate(160,20)"><title>other</title><rect class="node-card" width="40" height="20"/></g>',
      '  <g class="edge" data-from="vault" data-to="vm"><title>used by</title><path d="M50 30L60 30"/></g>',
      '  <g class="edge" data-from="other" data-to="outside"><title>used by</title><path d="M200 30L220 30"/></g>',
      '</svg>',
    ].join('');

    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TD\n  a["A"] --> b["B"]'}
        layoutSvg={forestLayoutSvg}
        outline={{
          nodes: [],
          edges: [{ from: 'vault', to: 'vm', label: 'used by', source: 'observed', declaredConnectionId: null }],
        }}
        textAlternative="Inventory topology"
        viewportAriaLabel="Inventory topology"
      />,
    );

    const host = await screen.findByTestId('architecture-diagram-svg-host');
    const viewBox = host.querySelector('svg')?.getAttribute('viewBox');

    fireEvent.click(host.querySelector('#node-vault')!);

    await waitFor(() => {
      expect(screen.getByTestId('diagram-click-focus-status')).toHaveTextContent(
        'Showing connections for vault.',
      );
      expect(host.querySelector('#node-other')).toHaveClass('diagram-click-dim');
    });
    expect(host.querySelector('svg')?.getAttribute('viewBox')).toBe(viewBox);

    fireEvent.keyDown(screen.getByTestId('architecture-diagram-viewport'), { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByTestId('diagram-click-focus-status')).toBeNull();
      expect(host.querySelector('#node-other')).not.toHaveClass('diagram-click-dim');
    });
  });

  it('labels blank node names in connection focus status', async () => {
    const forestLayoutSvg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120">',
      '  <g class="node" id="node-blank" transform="translate(10,20)"><title></title><rect class="node-card" width="40" height="20"/></g>',
      '  <g class="edge" data-from="blank" data-to="other"><title>used by</title><path d="M50 30L60 30"/></g>',
      '</svg>',
    ].join('');

    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TD\n  a["A"] --> b["B"]'}
        layoutSvg={forestLayoutSvg}
        outline={{ nodes: [], edges: [] }}
        textAlternative="Inventory topology"
        viewportAriaLabel="Inventory topology"
      />,
    );

    const host = await screen.findByTestId('architecture-diagram-svg-host');

    fireEvent.click(host.querySelector('#node-blank')!);

    await waitFor(() => {
      expect(screen.getByTestId('diagram-click-focus-status')).toHaveTextContent(
        'Showing connections for Resource name was not stored.',
      );
    });
  });

  it('reports when a connector edge is missing an endpoint', async () => {
    const forestLayoutSvg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120">',
      '  <g class="edge" data-from="" data-to="sql"><title>May access</title><path d="M20 20L80 20"/></g>',
      '</svg>',
    ].join('');

    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TD\n  app["app"] --> sql["sql"]'}
        layoutSvg={forestLayoutSvg}
        outline={{ nodes: [], edges: [] }}
        textAlternative="Inventory topology"
      />,
    );

    const host = await screen.findByTestId('architecture-diagram-svg-host');
    fireEvent.click(host.querySelector('g.edge path')!);

    expect(screen.getByTestId('diagram-connector-focus-notice')).toHaveTextContent(
      'Edge endpoint was not stored.',
    );
  });

  it('does not show member-name omission when data-member-names is absent', async () => {
    const forestLayoutSvg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120">',
      '  <g class="node" id="node-plain"><title>App tier</title><rect class="node-card" width="80" height="20"/></g>',
      '</svg>',
    ].join('');

    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TD\n  a["A"]'}
        layoutSvg={forestLayoutSvg}
        outline={{ nodes: [], edges: [] }}
        textAlternative="Inventory topology"
      />,
    );

    const host = await screen.findByTestId('architecture-diagram-svg-host');
    fireEvent.click(host.querySelector('#node-plain')!);

    const status = await screen.findByTestId('diagram-click-focus-status');
    expect(status).not.toHaveTextContent('Diagram member name was not stored.');
  });

  it('labels blank rollup member names as not stored', async () => {
    const forestLayoutSvg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120">',
      '  <g class="node" id="node-rollup" data-member-names=" |storage-b"><title>6 storage accounts</title><rect class="node-card" width="80" height="20"/></g>',
      '</svg>',
    ].join('');

    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TD\n  a["A"]'}
        layoutSvg={forestLayoutSvg}
        outline={{ nodes: [], edges: [] }}
        textAlternative="Inventory topology"
      />,
    );

    const host = await screen.findByTestId('architecture-diagram-svg-host');
    fireEvent.click(host.querySelector('#node-rollup')!);

    expect(await screen.findByTestId('diagram-click-focus-status')).toHaveTextContent(
      'Diagram member name was not stored.',
    );
    expect(screen.getByTestId('diagram-click-focus-status')).toHaveTextContent('storage-b');
  });

  it('reports connector clicks and dims other connectors when selected', async () => {
    const onSelectConnector = vi.fn();
    const forestLayoutSvg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120">',
      '  <g class="edge" data-from="app" data-to="sql"><title>May access</title><path d="M20 20L80 20"/></g>',
      '  <g class="edge" data-from="app" data-to="storage"><title>Writes to</title><path d="M20 40L80 40"/></g>',
      '</svg>',
    ].join('');

    const { rerender } = render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TD\n  app["app"] --> sql["sql"]'}
        layoutSvg={forestLayoutSvg}
        outline={{ nodes: [], edges: [] }}
        textAlternative="Inventory topology"
        onSelectConnector={onSelectConnector}
      />,
    );

    const host = await screen.findByTestId('architecture-diagram-svg-host');
    const selectedEdge = host.querySelector('g.edge[data-from="app"][data-to="sql"]')!;
    fireEvent.click(selectedEdge.querySelector('path')!);

    expect(onSelectConnector).toHaveBeenCalledWith({
      from: 'app',
      to: 'sql',
      label: 'May access',
    });

    rerender(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TD\n  app["app"] --> sql["sql"]'}
        layoutSvg={forestLayoutSvg}
        outline={{ nodes: [], edges: [] }}
        textAlternative="Inventory topology"
        selectedConnector={{ from: 'app', to: 'sql', label: 'May access' }}
      />,
    );

    await waitFor(() => {
      expect(selectedEdge).not.toHaveClass('diagram-click-dim');
      expect(host.querySelector('g.edge[data-from="app"][data-to="storage"]')).toHaveClass('diagram-click-dim');
    });
  });

  it('adds the authorization hint when a focused node has a May access edge', async () => {
    const forestLayoutSvg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120">',
      '  <g class="node" id="node-app"><title>orders-api</title><rect class="node-card" width="80" height="20"/></g>',
      '  <g class="edge" data-from="app" data-to="sql"><title>May access</title><path d="M20 20L80 20"/></g>',
      '</svg>',
    ].join('');

    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TD\n  app["orders-api"] --> sql["orders-db"]'}
        layoutSvg={forestLayoutSvg}
        outline={{
          nodes: [],
          edges: [{
            from: 'app',
            to: 'sql',
            label: 'May access',
            source: 'probable',
            confidenceBand: 'probable',
            provenanceKind: 'DerivedFact',
            inferenceSource: 'inventory-app-authorized-access',
            declaredConnectionId: null,
          }],
        }}
        textAlternative="Inventory topology"
      />,
    );

    const host = await screen.findByTestId('architecture-diagram-svg-host');
    fireEvent.click(host.querySelector('#node-app')!);

    expect(await screen.findByTestId('diagram-click-focus-status')).toHaveTextContent(
      'Authorization from managed identity and RBAC — does not prove runtime traffic.',
    );
    expect(screen.getByTestId('diagram-click-focus-status')).not.toHaveTextContent('Observed traffic occurred');
  });

  it('does not add a connection hint for an observed structural edge', async () => {
    const forestLayoutSvg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120">',
      '  <g class="node" id="node-vnet"><title>core-vnet</title><rect class="node-card" width="80" height="20"/></g>',
      '  <g class="edge" data-from="vnet" data-to="subnet"><title>connects</title><path d="M20 20L80 20"/></g>',
      '</svg>',
    ].join('');

    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TD\n  vnet["core-vnet"] --> subnet["core-subnet"]'}
        layoutSvg={forestLayoutSvg}
        outline={{
          nodes: [],
          edges: [{
            from: 'vnet',
            to: 'subnet',
            label: 'connects',
            source: 'observed',
            confidenceBand: 'observed',
            provenanceKind: 'ObservedFact',
            inferenceSource: 'inventory-private-endpoint',
            declaredConnectionId: null,
          }],
        }}
        textAlternative="Inventory topology"
      />,
    );

    const host = await screen.findByTestId('architecture-diagram-svg-host');
    fireEvent.click(host.querySelector('#node-vnet')!);

    expect(await screen.findByTestId('diagram-click-focus-status')).toHaveTextContent(
      'Showing connections for core-vnet.',
    );
    expect(screen.getByTestId('diagram-click-focus-status')).not.toHaveTextContent('Authorization from managed identity');
    expect(screen.getByTestId('diagram-click-focus-status')).not.toHaveTextContent('Hostname match in app settings');
  });

  it('labels a rollup focus with its member-list title', async () => {
    const forestLayoutSvg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120">',
      '  <g class="node" id="node-rollup" data-member-names="storage-a · rg-a · No diagram neighbor on this view.|storage-b · rg-b · 1 diagram neighbors on this view."><title>6 storage accounts</title><rect class="node-card" width="80" height="20"/></g>',
      '</svg>',
    ].join('');

    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TD\n  a["A"]'}
        layoutSvg={forestLayoutSvg}
        outline={{ nodes: [], edges: [] }}
        textAlternative="Inventory topology"
        viewportAriaLabel="Inventory topology"
      />,
    );

    const host = await screen.findByTestId('architecture-diagram-svg-host');
    fireEvent.click(host.querySelector('#node-rollup')!);

    await waitFor(() => {
      expect(screen.getByTestId('diagram-click-focus-status')).toHaveTextContent('6 storage accounts');
      expect(screen.getByTestId('diagram-click-focus-status')).toHaveTextContent(
        'storage-a · rg-a · No diagram neighbor on this view.',
      );
      expect(screen.getByTestId('diagram-click-focus-status')).not.toHaveTextContent('Showing connections for');
    });
  });

  it('focuses the named partner when a long-edge stub is clicked', async () => {
    const forestLayoutSvg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120">',
      '  <g class="node" id="node-vault" transform="translate(10,20)"><title>vault</title><rect class="node-card" width="40" height="20"/></g>',
      '  <g class="node" id="node-vm" transform="translate(60,20)"><title>vm</title><rect class="node-card" width="40" height="20"/></g>',
      '  <g class="node" id="node-other" transform="translate(160,20)"><title>other</title><rect class="node-card" width="40" height="20"/></g>',
      '  <g class="edge-stub" data-from="vault" data-to="vm" data-focus-node="vm"><title>used by → vm</title><text>→ vm</text></g>',
      '</svg>',
    ].join('');

    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TD\n  a["A"] --> b["B"]'}
        layoutSvg={forestLayoutSvg}
        outline={{
          nodes: [],
          edges: [{ from: 'vault', to: 'vm', label: 'used by', source: 'observed', declaredConnectionId: null }],
        }}
        textAlternative="Inventory topology"
        viewportAriaLabel="Inventory topology"
      />,
    );

    const host = await screen.findByTestId('architecture-diagram-svg-host');
    const viewBox = host.querySelector('svg')?.getAttribute('viewBox');
    const stub = host.querySelector('g.edge-stub text');
    expect(stub).not.toBeNull();

    fireEvent.click(stub!);

    await waitFor(() => {
      expect(screen.getByTestId('diagram-click-focus-status')).toHaveTextContent(
        'Showing connections for vm.',
      );
      expect(host.querySelector('#node-vm')).not.toHaveClass('diagram-click-dim');
      expect(host.querySelector('#node-other')).toHaveClass('diagram-click-dim');
    });
    expect(host.querySelector('svg')?.getAttribute('viewBox')).toBe(viewBox);

    fireEvent.click(stub!);
    await waitFor(() => {
      expect(screen.queryByTestId('diagram-click-focus-status')).toBeNull();
      expect(host.querySelector('#node-other')).not.toHaveClass('diagram-click-dim');
    });
  });

  it('scopes host CSS to card bodies so forest accents and pictograms keep baked fills', async () => {
    const forestLayoutSvg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">',
      '  <g class="node">',
      '    <rect class="node-card" width="200" height="48" fill="#f8fafc" stroke="#cbd5e1"/>',
      '    <rect class="node-accent" width="4" height="48" fill="#d97706"/>',
      '    <g class="pictogram" data-kind="Storage">',
      '      <rect x="4" y="4" width="16" height="4" fill="#d97706"/>',
      '      <rect x="4" y="10" width="16" height="4" fill="#ea580c"/>',
      '    </g>',
      '    <text fill="#0f172a"><tspan>staephidevws001</tspan></text>',
      '    <text fill="#475569"><tspan>anly-aep-dev-hi</tspan></text>',
      '  </g>',
      '</svg>',
    ].join('');

    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TD\n  a["A"] --> b["B"]'}
        layoutSvg={forestLayoutSvg}
        textAlternative="Inventory topology"
        viewportAriaLabel="Inventory topology"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('architecture-diagram-svg-host')).toBeInTheDocument();
    });

    const host = screen.getByTestId('architecture-diagram-svg-host');
    expect(host.className).toContain('g.node>rect.node-card');
    expect(host.className).toContain('g.node>rect:not(.node-accent):not(.node-card)');
    expect(host.className).not.toContain('[&_svg_.node_rect]');
    expect(host.className).toContain('text:not([fill])');

    const accent = host.querySelector('rect.node-accent');
    const pictogramRect = host.querySelector('g.pictogram rect');

    expect(accent?.getAttribute('fill')).toBe('#d97706');
    expect(pictogramRect?.getAttribute('fill')).toBe('#d97706');
    expect(host.querySelector('text')).not.toBeNull();
    expect(screen.getByText('anly-aep-dev-hi')).toBeInTheDocument();
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
      rawScale: 1,
      widthScale: 1,
      fitScale: 1,
      overflows: false,
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
      rawScale: 1,
      widthScale: 1,
      fitScale: 1,
      overflows: false,
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

    const svgHost = screen.getByTestId('architecture-diagram-svg-host');
    expect(svgHost.className.split(/\s+/u)).toContain('w-max');
    expect(svgHost.className.split(/\s+/u)).toContain('max-w-none');
    expect(svgHost.className.split(/\s+/u)).not.toContain('max-w-full');
    expect(svgHost.className.split(/\s+/u)).not.toContain('min-w-0');

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
    const hint = screen.getByText(ARCHITECTURE_DIAGRAM_VIEWPORT_HINT);
    const inkClip = screen.getByTestId('architecture-diagram-ink-clip');

    expect(viewport).not.toContainElement(controls);
    expect(controls.compareDocumentPosition(viewport) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(hint.className.split(/\s+/u)).not.toContain('sr-only');
    expect(inkClip.className.split(/\s+/u)).toContain('overflow-hidden');
  });

  it('omits stacked viewport hint copy when viewportHint is empty', async () => {
    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TB\n  a["A"]'}
        textAlternative="A"
        viewportAriaLabel="Inventory diagram for snapshot snap-1"
        fullscreenTitle="Inventory diagram · Executive"
        viewportControlsLayout="stacked"
        viewportHint=""
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('architecture-diagram-viewport-controls')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('architecture-diagram-viewport-hint')).not.toBeInTheDocument();
    expect(screen.queryByText(ARCHITECTURE_DIAGRAM_VIEWPORT_HINT)).not.toBeInTheDocument();
  });

  it('keeps overlay viewport hint screen-reader only while clipping diagram ink', async () => {
    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TB\n  a["A"]'}
        textAlternative="A"
        viewportAriaLabel="Inventory diagram for snapshot snap-1"
        fullscreenTitle="Inventory diagram · Executive"
        viewportControlsLayout="overlay"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('architecture-diagram-viewport')).toBeInTheDocument();
    });

    const hint = screen.getByText(ARCHITECTURE_DIAGRAM_VIEWPORT_HINT);
    const viewport = screen.getByTestId('architecture-diagram-viewport');
    const controls = screen.getByTestId('architecture-diagram-viewport-controls');
    const inkClip = screen.getByTestId('architecture-diagram-ink-clip');

    expect(hint.className.split(/\s+/u)).toContain('sr-only');
    expect(viewport).toContainElement(controls);
    expect(inkClip.className.split(/\s+/u)).toContain('overflow-hidden');
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

  it('keeps manual zoom changes on overflow diagrams instead of snapping back to contain fit', async () => {
    replaceMock.mockClear();

    const largeSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3000 2000">' +
      '<g class="node"><rect width="3000" height="2000" fill="#eee"/><text class="nodeLabel">Forest</text></g>' +
      '</svg>';

    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: (): number => 1180,
    });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get: (): number => 576,
    });
    Object.defineProperty(SVGGraphicsElement.prototype, 'getBBox', {
      configurable: true,
      writable: true,
      value: (): DOMRect =>
        ({
          x: 0,
          y: 0,
          width: 3000,
          height: 2000,
          top: 0,
          right: 3000,
          bottom: 2000,
          left: 0,
          toJSON: () => ({}),
        }) as DOMRect,
    });

    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TB\n  a["A"]'}
        layoutSvg={largeSvg}
        textAlternative="A"
        viewportAriaLabel="Inventory diagram for snapshot snap-1"
        fullscreenTitle="Inventory diagram · Executive"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('architecture-diagram-svg-host')).toBeInTheDocument();
    });

    const zoomInput = screen.getByLabelText(ARCHITECTURE_DIAGRAM_ZOOM_PERCENT_LABEL) as HTMLInputElement;
    const initialZoom = Number(zoomInput.value);

    expect(initialZoom).toBeLessThan(100);

    replaceMock.mockClear();

    const viewport = screen.getByTestId('architecture-diagram-viewport');

    fireEvent.click(within(viewport).getByRole('button', { name: ARCHITECTURE_DIAGRAM_ZOOM_IN_LABEL }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalled();
    });

    const lastHref = String(replaceMock.mock.calls.at(-1)?.[0] ?? '');
    const urlZoomMatch = lastHref.match(/diagZoom=([\d.]+)/u);
    const urlZoomPercent = Math.round(Number.parseFloat(urlZoomMatch?.[1] ?? '0') * 100);

    expect(urlZoomPercent).toBeGreaterThan(initialZoom);

    await waitFor(() => {
      expect(Number(zoomInput.value)).toBe(urlZoomPercent);
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
      expect(screen.getByLabelText(ARCHITECTURE_DIAGRAM_ZOOM_PERCENT_LABEL)).toHaveValue(60);
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

  it('keeps zoom at 100 percent when measured ink fits the viewport', async () => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: (): number => 1180,
    });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get: (): number => 576,
    });

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

    await waitFor(() => {
      expect(screen.getByLabelText(ARCHITECTURE_DIAGRAM_ZOOM_PERCENT_LABEL)).toHaveValue(100);
    });
  });

  it('defaults zoom at the 60 percent floor when measured ink overflows the viewport', async () => {
    const largeSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3000 2000">' +
      '<g class="node"><rect width="3000" height="2000" fill="#eee"/><text class="nodeLabel">Forest</text></g>' +
      '</svg>';

    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: (): number => 1180,
    });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get: (): number => 576,
    });
    Object.defineProperty(SVGGraphicsElement.prototype, 'getBBox', {
      configurable: true,
      writable: true,
      value: (): DOMRect =>
        ({
          x: 0,
          y: 0,
          width: 3000,
          height: 2000,
          top: 0,
          right: 3000,
          bottom: 2000,
          left: 0,
          toJSON: () => ({}),
        }) as DOMRect,
    });

    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TB\n  a["A"]'}
        layoutSvg={largeSvg}
        textAlternative="A"
        viewportAriaLabel="Inventory diagram for snapshot snap-1"
        fullscreenTitle="Inventory diagram · Executive"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('architecture-diagram-svg-host')).toBeInTheDocument();
    });

    await waitFor(() => {
      const zoomValue = Number(
        (screen.getByLabelText(ARCHITECTURE_DIAGRAM_ZOOM_PERCENT_LABEL) as HTMLInputElement).value,
      );

      expect(zoomValue).toBe(60);
    });
  });

  it('clears stale URL zoom and applies contain zoom when layout SVG changes to an overflow plate', async () => {
    searchParamsMock.set('diagZoom', '0.30');

    const smallSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
      '<g class="node"><rect width="100" height="100" fill="#eee"/><text class="nodeLabel">Node A</text></g>' +
      '</svg>';
    const largeSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3000 2000">' +
      '<g class="node"><rect width="3000" height="2000" fill="#eee"/><text class="nodeLabel">Forest</text></g>' +
      '</svg>';

    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: (): number => 1180,
    });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get: (): number => 576,
    });
    Object.defineProperty(SVGGraphicsElement.prototype, 'getBBox', {
      configurable: true,
      writable: true,
      value: (): DOMRect =>
        ({
          x: 0,
          y: 0,
          width: 3000,
          height: 2000,
          top: 0,
          right: 3000,
          bottom: 2000,
          left: 0,
          toJSON: () => ({}),
        }) as DOMRect,
    });

    const { rerender } = render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TD\n  a["A"]'}
        layoutSvg={smallSvg}
        textAlternative="A"
        viewportAriaLabel="Inventory topology"
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(ARCHITECTURE_DIAGRAM_ZOOM_PERCENT_LABEL)).toHaveValue(60);
    });

    rerender(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TD\n  a["A"]'}
        layoutSvg={largeSvg}
        textAlternative="A"
        viewportAriaLabel="Inventory topology"
      />,
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/securenow/inventory', {
        scroll: false,
      });
    });

    await waitFor(() => {
      const zoomValue = Number(
        (screen.getByLabelText(ARCHITECTURE_DIAGRAM_ZOOM_PERCENT_LABEL) as HTMLInputElement).value,
      );

      expect(zoomValue).toBeLessThan(100);
    });
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
    expect(host.className).toContain('[&_svg_.cluster-label_text]:font-bold');
    expect(host.className).toContain('[&_svg_.cluster-label_.nodeLabel]:font-bold');
    expect(host.className).toContain('[&_svg_.rg-frame_text]:font-bold');
    expect(svg).not.toBeNull();
    expect(screen.queryByTestId('architecture-diagram-render-failure')).not.toBeInTheDocument();
    expect(Number(svg?.getAttribute('height') ?? 0)).toBeGreaterThanOrEqual(
      helpMermaid.MERMAID_VIEWPORT_MIN_INK_HEIGHT_PX,
    );
  });

  it('renders unmatched data-flow honesty lines outside sr-only text (P-04)', async () => {
    render(
      <ArchitectureDiagramViewer
        mermaidSource={'flowchart TB\n  a["A"]'}
        textAlternative="user: A"
        unmatchedDataFlows={['Portal -> Missing service']}
        viewportAriaLabel="Architecture diagram"
        fullscreenTitle="Diagram"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('architecture-diagram-viewport')).toBeInTheDocument();
    });

    const visibleLine = screen.getByTestId('architecture-diagram-unmatched-data-flow');
    expect(visibleLine).toHaveTextContent(ARCHITECTURE_DIAGRAM_DATA_FLOW_NOT_MATCHED_PREFIX);
    expect(visibleLine.className.split(/\s+/u)).not.toContain('sr-only');
  });
});
