import {
  resolveSystemNotJobWorkingPeerAskRedirectHref,
  type ResolveSystemNotJobWorkingPeerAskRedirectHrefInput,
} from "@/lib/system-not-job-ask-bound-to-open-package";

export type ResolveWorkingPeerAskRedirectHrefInput = ResolveSystemNotJobWorkingPeerAskRedirectHrefInput;

/**
 * Working peer Ask → nested Ask when architecture is known (ADR 0079 / SY-37 / SN-024).
 * Returns null when no redirect applies (Guided, already nested, or unscoped with no architecture).
 */
export function resolveWorkingPeerAskRedirectHref(
  input: ResolveWorkingPeerAskRedirectHrefInput,
): string | null {
  return resolveSystemNotJobWorkingPeerAskRedirectHref(input);
}
