export function secureNowDiagramPathFocusHiddenNodesLine(hiddenCount: number): string | null {
  const safeHidden = Math.max(0, Math.trunc(hiddenCount));

  if (safeHidden <= 0) {
    return null;
  }

  const unit = safeHidden === 1 ? "node" : "nodes";

  return `${safeHidden} subscription ${unit} hidden while path focus is active. Use Show the rest of the subscription to inspect the full graph.`;
}