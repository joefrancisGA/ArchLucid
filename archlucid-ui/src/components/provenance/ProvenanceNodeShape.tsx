import type { ProvenanceLayoutNode } from "@/lib/provenance-graph-layout";

export function ProvenanceNodeShape(props: {
  readonly node: ProvenanceLayoutNode;
  readonly selected: boolean;
  readonly dimmed: boolean;
  readonly connected: boolean;
}): React.JSX.Element {
  const { node, selected, dimmed, connected } = props;
  const r = selected ? node.radius + 4 : node.radius;
  const stroke = selected
    ? "var(--al-accent-interactive)"
    : connected
      ? "var(--al-accent-border-focus)"
      : node.stroke;
  const strokeWidth = selected ? 2.5 : connected ? 2 : 1.25;

  if (node.shape === "square") {
    return (
      <rect
        x={node.x - r}
        y={node.y - r}
        width={r * 2}
        height={r * 2}
        rx={4}
        fill={node.fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        className={dimmed ? "prov-graph-node-dimmed" : undefined}
      />
    );
  }

  if (node.shape === "diamond") {
    return (
      <polygon
        points={`${node.x},${node.y - r} ${node.x + r},${node.y} ${node.x},${node.y + r} ${node.x - r},${node.y}`}
        fill={node.fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        className={dimmed ? "prov-graph-node-dimmed" : undefined}
      />
    );
  }

  return (
    <circle
      cx={node.x}
      cy={node.y}
      r={r}
      fill={node.fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      className={dimmed ? "prov-graph-node-dimmed" : undefined}
    />
  );
}
