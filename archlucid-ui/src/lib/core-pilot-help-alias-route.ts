import {
  FIRST_ARCHITECTURE_REVIEW_HELP_PATH,
  LEGACY_CORE_PILOT_HELP_PATH,
} from "@/lib/first-architecture-review-help-route";

/** Legacy Core Pilot help bookmark retained for slug alias resolution (traffic row ECO). */
export const CORE_PILOT_HELP_ALIAS_PATH = LEGACY_CORE_PILOT_HELP_PATH;

/** Canonical first-review help path the alias resolves to (traffic row COR). */
export const CORE_PILOT_HELP_ALIAS_CANONICAL_PATH = FIRST_ARCHITECTURE_REVIEW_HELP_PATH;

export function isCorePilotHelpAliasPath(pathname: string): boolean {
  return pathname === CORE_PILOT_HELP_ALIAS_PATH || pathname.startsWith(`${CORE_PILOT_HELP_ALIAS_PATH}/`);
}
