import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";

/**
 * TB-2241 — Operator routes that must not appear in left-nav discovery lists.
 *
 * These surfaces stay reachable via explicit deep links (review detail, findings queue,
 * draft refine, help CTAs). Do not add ad-hoc omissions in nav builders; extend this registry.
 */
export const CONTEXTUAL_ONLY_OPERATOR_NAV_PATHS = [
  ARCHITECTURE_INTELLIGENCE_PATH,
] as const;

export type ContextualOnlyOperatorNavPath = (typeof CONTEXTUAL_ONLY_OPERATOR_NAV_PATHS)[number];

export function isContextualOnlyOperatorNavPath(href: string): href is ContextualOnlyOperatorNavPath {
  return (CONTEXTUAL_ONLY_OPERATOR_NAV_PATHS as readonly string[]).includes(href);
}
