import type { ResolveReviewDetailVisibleTabsInput } from "@/lib/resolve-review-detail-visible-tabs";

export type ReviewWorkspaceLifecycle = "create-home" | "in-review" | "finalized";

function hasManifest(manifestId: string | null | undefined): boolean {
  return (manifestId ?? "").trim().length > 0;
}

/** TB-2367 — coarse lifecycle for the unified review workspace shell. */
export function resolveReviewWorkspaceLifecycle(
  input: ResolveReviewDetailVisibleTabsInput & {
    readonly showArchitectureCreatedHome?: boolean;
  },
): ReviewWorkspaceLifecycle {
  if (input.showArchitectureCreatedHome === true) {
    return "create-home";
  }

  if (hasManifest(input.manifestId)) {
    return "finalized";
  }

  return "in-review";
}
