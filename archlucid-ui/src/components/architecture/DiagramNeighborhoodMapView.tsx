import {
  groupDiagramNeighborhoodSections,
  type DiagramNeighborhood,
  type DiagramNeighborhoodMap,
} from '@/lib/architecture/architecture-diagram-neighborhood-map';
import { ARCHITECTURE_DIAGRAM_SUBSCRIPTION_MAP_LABEL } from '@/lib/architecture/architecture-diagram-copy';

export type DiagramNeighborhoodMapViewProps = {
  readonly map: DiagramNeighborhoodMap;
  readonly onOpenNeighborhood: (id: string) => void;
};

function titleFor(map: DiagramNeighborhoodMap, id: string): string {
  return map.neighborhoods.find((neighborhood) => neighborhood.id === id)?.title ?? id;
}

function renderTypeChip(type: { readonly name: string; readonly count: number }): React.JSX.Element {
  return (
    <span
      key={`${type.name}-${type.count}`}
      className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[12px] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
    >
      {`${type.name} ${type.count}`}
    </span>
  );
}

function renderTile(
  neighborhood: DiagramNeighborhood,
  onOpenNeighborhood: (id: string) => void,
): React.JSX.Element {
  const isVnet = neighborhood.kind === "vnet";

  return (
    <button
      key={neighborhood.id}
      type="button"
      className={[
        "flex min-h-[116px] min-w-0 flex-col items-start gap-2 rounded-md border bg-white p-4 text-left shadow-sm transition hover:border-slate-400 hover:shadow dark:bg-slate-950",
        isVnet
          ? "border-slate-400 dark:border-slate-500"
          : "border-slate-200 dark:border-slate-700",
      ].join(" ")}
      data-testid={`architecture-diagram-neighborhood-tile-${neighborhood.id}`}
      onClick={() => onOpenNeighborhood(neighborhood.id)}
    >
      <span className="w-full break-words text-[14px] font-semibold text-[#0f172a] dark:text-slate-100">
        {neighborhood.title}
      </span>
      <span className="text-[12px] text-[#64748b]">{`${neighborhood.resourceCount} resources`}</span>
      <span className="flex flex-wrap gap-1">
        {neighborhood.types.slice(0, 4).map(renderTypeChip)}
      </span>
    </button>
  );
}

export function DiagramNeighborhoodMapView(
  props: DiagramNeighborhoodMapViewProps,
): React.JSX.Element {
  const visibleLinks = props.map.links.slice(0, 12);
  const remainingLinkCount = Math.max(0, props.map.links.length - visibleLinks.length);
  const sections = groupDiagramNeighborhoodSections(props.map.neighborhoods);

  return (
    <section aria-label={ARCHITECTURE_DIAGRAM_SUBSCRIPTION_MAP_LABEL} className="space-y-4 p-1">
      {sections.map((section) => (
        <section
          key={section.id}
          aria-labelledby={`architecture-diagram-${section.id}-heading`}
          data-testid={`architecture-diagram-${section.id}`}
        >
          <h2 id={`architecture-diagram-${section.id}-heading`} className="mb-2 text-[13px] font-semibold text-slate-700 dark:text-slate-200">
            {section.heading}
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            {section.neighborhoods.map((neighborhood) =>
              renderTile(neighborhood, props.onOpenNeighborhood))}
          </div>
        </section>
      ))}
      {props.map.links.length > 0 ? (
        <ul className="m-0 space-y-1 p-0 text-[12px] text-slate-600 dark:text-slate-300">
          {visibleLinks.map((link) => (
            <li key={`${link.from}-${link.to}`}>
              {`${titleFor(props.map, link.from)} — ${link.count} — ${titleFor(props.map, link.to)}`}
            </li>
          ))}
          {remainingLinkCount > 0 ? <li>{`+ ${remainingLinkCount} more links`}</li> : null}
        </ul>
      ) : null}
    </section>
  );
}
