import type { NavLinkItem } from "@/lib/nav-config.types";
import {
  WORKING_BIND_TOOL_REQUIRES_ARCHITECTURE_HINT,
  isWorkingToolMustBindHref,
} from "@/lib/working-route-roles";

/** Working sidebar rows for bind tools when no architecture desk is open (AO-40 / LS-11). */
export function applyWorkingBindToolNavPresentation(
  link: NavLinkItem,
  lastOpenArchitectureId: string | null | undefined,
  workingMode: boolean,
): NavLinkItem {
  if (!workingMode || !isWorkingToolMustBindHref(link.href)) {
    return link;
  }

  const architectureId = lastOpenArchitectureId?.trim() ?? "";

  if (architectureId.length > 0) {
    return link;
  }

  return {
    ...link,
    navLinkDisabled: true,
    navLinkDisabledTitle: WORKING_BIND_TOOL_REQUIRES_ARCHITECTURE_HINT,
    navLinkDisabledVisibleHint: WORKING_BIND_TOOL_REQUIRES_ARCHITECTURE_HINT,
  };
}
