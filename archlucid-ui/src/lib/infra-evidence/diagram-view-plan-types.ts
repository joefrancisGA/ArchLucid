/** Wire shape for Infrastructure Ask diagram view plans (DAU-02). */

export type DiagramViewPlan = {
  readonly mermaidMode: string | null;
  readonly resourceGroupName: string | null;
  readonly seedNodeId: string | null;
  readonly snapshotId: string | null;
  readonly cloudResourceId: string | null;
  readonly fitTargetNodeId: string | null;
  readonly honestyLabel: string | null;
};

export type ApplyDiagramViewPlanResult = {
  readonly href: string;
  readonly error: string | null;
};
