import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";
import {
  navLinkVisibleForCallerRank,
  type RequiredAuthority,
} from "@/lib/nav-authority";

export type ContextualOnlyOperatorNavDestination = {
  readonly href: string;
  readonly requiredAuthority: RequiredAuthority;
};

/**
 * TB-2241 — Operator routes that must not appear in left-nav discovery lists.
 *
 * These surfaces stay reachable via explicit deep links (review detail, findings queue,
 * draft refine, help CTAs, command palette). Do not add ad-hoc omissions in nav builders;
 * extend this registry.
 */
export const CONTEXTUAL_ONLY_OPERATOR_NAV_DESTINATIONS: readonly ContextualOnlyOperatorNavDestination[] = [
  {
    href: ARCHITECTURE_INTELLIGENCE_PATH,
    requiredAuthority: "ExecuteAuthority",
  },
];

export const CONTEXTUAL_ONLY_OPERATOR_NAV_PATHS = CONTEXTUAL_ONLY_OPERATOR_NAV_DESTINATIONS.map(
  (destination) => destination.href,
) as readonly [typeof ARCHITECTURE_INTELLIGENCE_PATH];

export type ContextualOnlyOperatorNavPath = (typeof CONTEXTUAL_ONLY_OPERATOR_NAV_PATHS)[number];

export function isContextualOnlyOperatorNavPath(href: string): href is ContextualOnlyOperatorNavPath {
  return (CONTEXTUAL_ONLY_OPERATOR_NAV_PATHS as readonly string[]).includes(href);
}

/** Palette / deep-link hrefs that stay off sidebar nav but honor the same authority floor as before removal. */
export function contextualOnlyOperatorNavHrefsForCallerRank(callerRank: number): readonly string[] {
  return CONTEXTUAL_ONLY_OPERATOR_NAV_DESTINATIONS.filter((destination) =>
    navLinkVisibleForCallerRank(destination, callerRank),
  ).map((destination) => destination.href);
}

export function mergeContextualOnlyOperatorNavHrefsIntoVisibleSet(
  visibleHrefs: ReadonlySet<string>,
  callerRank: number,
): Set<string> {
  const merged = new Set(visibleHrefs);

  for (const href of contextualOnlyOperatorNavHrefsForCallerRank(callerRank)) {
    merged.add(href);
  }

  return merged;
}
