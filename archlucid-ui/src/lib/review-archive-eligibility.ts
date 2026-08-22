import type { RunSummary } from "@/types/authority";

/** Reviews without a sealed golden manifest may be soft-archived by operators. */
export function canArchiveReview(run: Pick<RunSummary, "hasGoldenManifest" | "isArchived">): boolean {
  if (run.isArchived === true) {
    return false;
  }

  return run.hasGoldenManifest !== true;
}
