import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";

export type RunsDashboardClientLoadMode = "initial" | "background";

/** True when SSR already delivered a trustworthy runs snapshot for this project. */
export function isOperatorHomeRunsDashboardServerSnapshotFresh(
  initialModel: OperatorHomeRunsDashboardModel | null,
  projectId: string,
): boolean {
  if (initialModel === null) {
    return false;
  }

  if (initialModel.projectId !== projectId) {
    return false;
  }

  if (initialModel.loadFailure !== null) {
    return false;
  }

  if (initialModel.malformedMessage !== null) {
    return false;
  }

  return true;
}

/** Skip mount-time client fetch when SSR already painted a successful snapshot. */
export function shouldSkipRunsDashboardClientFetchOnMount(
  initialModel: OperatorHomeRunsDashboardModel | null,
  projectId: string,
): boolean {
  return isOperatorHomeRunsDashboardServerSnapshotFresh(initialModel, projectId);
}

/** Prefer skeleton only on true first paint; keep painted rows during background refresh. */
export function resolveRunsDashboardClientLoadMode(paintedItemCount: number): RunsDashboardClientLoadMode {
  if (paintedItemCount > 0) {
    return "background";
  }

  return "initial";
}

/** Skeleton only when there is nothing trustworthy to show yet. */
export function shouldShowRunsDashboardInitialSkeleton(
  phase: "loading" | "ready" | "error",
  paintedItemCount: number,
): boolean {
  return phase === "loading" && paintedItemCount === 0;
}
