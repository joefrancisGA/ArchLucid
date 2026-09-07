import type { NavLinkItem } from "@/lib/nav-config.types";
import { navHrefPathPart } from "@/lib/nav-href-path-part";
import {
  classifyWorkingRoutePathname,
  requiresOpenArchitecture,
} from "@/lib/routing/working-route-roles";

/** Visible + screen-reader copy when Working bind tools lack a last-open architecture (AO-40 / LS-11). */
export const WORKING_BIND_TOOL_REQUIRES_ARCHITECTURE_REASON =
  "Open an architecture identity desk first.";

export type WorkingBindToolNavGateInput = {
  readonly workingMode: boolean;
  readonly lastOpenArchitectureId: string | null;
};

export function shouldGateWorkingBindToolNavLink(
  href: string,
  input: WorkingBindToolNavGateInput,
): boolean {
  if (!input.workingMode) {
    return false;
  }

  const architectureId = input.lastOpenArchitectureId?.trim() ?? "";

  if (architectureId.length > 0) {
    return false;
  }

  const role = classifyWorkingRoutePathname(navHrefPathPart(href));

  if (role === null) {
    return false;
  }

  return requiresOpenArchitecture(role);
}

export function applyWorkingBindToolNavGateToLink(
  link: NavLinkItem,
  input: WorkingBindToolNavGateInput,
): NavLinkItem {
  if (!shouldGateWorkingBindToolNavLink(link.href, input)) {
    return link;
  }

  return {
    ...link,
    navLinkDisabled: true,
    navLinkDisabledReason: WORKING_BIND_TOOL_REQUIRES_ARCHITECTURE_REASON,
    navLinkDisabledTitle: WORKING_BIND_TOOL_REQUIRES_ARCHITECTURE_REASON,
  };
}
