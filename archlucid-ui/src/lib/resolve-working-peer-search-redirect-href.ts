import {
  resolveSystemNotJobWorkingPeerSearchRedirectHref,
  type ResolveSystemNotJobWorkingPeerSearchRedirectHrefInput,
} from "@/lib/system-not-job-search-bound-to-open-package";

export type ResolveWorkingPeerSearchRedirectHrefInput = ResolveSystemNotJobWorkingPeerSearchRedirectHrefInput;

/**
 * Working peer Search → nested search when architecture is known (ADR 0079 / SY-42 / SN-026).
 * Returns null when no redirect applies (Guided, unscoped Working, or non-search paths).
 */
export function resolveWorkingPeerSearchRedirectHref(
  input: ResolveWorkingPeerSearchRedirectHrefInput,
): string | null {
  return resolveSystemNotJobWorkingPeerSearchRedirectHref(input);
}
