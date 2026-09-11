import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArchitectureDiagramViewer } from '@/components/architecture/ArchitectureDiagramViewer';
import {
  ARCHITECTURE_DIAGRAM_FIT_IN_VIEW_LABEL,
  ARCHITECTURE_DIAGRAM_RESET_ZOOM_LABEL,
  ARCHITECTURE_DIAGRAM_VIEWPORT_HINT,
  ARCHITECTURE_DIAGRAM_ZOOM_IN_LABEL,
  ARCHITECTURE_DIAGRAM_ZOOM_OUT_LABEL,
} from '@/lib/architecture/architecture-diagram-copy';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

const replaceMock = vi.fn();
const searchParamsMock = new URLSearchParams();

const sampleSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#eee"/></svg>';

describe('ArchitectureDiagramViewer', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    searchParamsMock.forEach((_, key) => searchParamsMock.delete(key));
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
  });

  it('fit in view clears diagram zoom from the URL and shows 100 percent', async () => {
    const user = userEvent.setup();
    searchParamsMock.set('diagZoom', '1.50');

    render(
      <ArchitectureDiagramViewer source={sampleSvg} sourceKind="html" alt="Inventory topology" />
    );

    expect(screen.getByText('150%')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: ARCHITECTURE_DIAGRAM_FIT_IN_VIEW_LABEL }));

    expect(replaceMock).toHaveBeenCalled();
    const lastCall = replaceMock.mock.calls.at(-1);

    expect(lastCall?.[0]).not.toContain('diagZoom=');
    expect(screen.getByText('100%')).toBeInTheDocument();
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
});
