import {
  resolveSystemNotJobWorkingPeerGraphRedirectHref,
  type ResolveSystemNotJobWorkingPeerGraphRedirectHrefInput,
} from "@/lib/system-not-job-graph-bound-to-open-package";

export type ResolveWorkingPeerGraphRedirectHrefInput = ResolveSystemNotJobWorkingPeerGraphRedirectHrefInput;

/**
 * Working peer Evidence graph → nested graph when architecture is known (ADR 0079 / SY-41 / SN-025).
 * Returns null when no redirect applies (Guided or non-graph paths).
 */
export function resolveWorkingPeerGraphRedirectHref(
  input: ResolveWorkingPeerGraphRedirectHrefInput,
): string | null {
  return resolveSystemNotJobWorkingPeerGraphRedirectHref(input);
}
