import { cache } from "react";

import { listRunsByProject } from "@/lib/api";
import type { RunSummary } from "@/types/authority";

/** Per-request memo for project runs used by mid and below-fold deferred run-detail loaders. */
export const loadProjectRunsForRunDetailDeferred = cache(
  async (projectId: string, take: number): Promise<RunSummary[]> => {
    return await listRunsByProject(projectId, take);
  },
);
