import { useCommandState } from "cmdk";

import { CommandGroup, CommandItem } from "@/components/ui/command";
import { scopeOperatorShellNavRows } from "@/lib/nav-audit-run-scope";
import { NAV_GROUPS } from "@/lib/nav-config";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";
import {
  filterNavGroupsByRoleDensity,
  resolveRoleNavDensityPersona,
} from "@/lib/role-shaped-nav-density";
import { applyPatternLibraryNavGate } from "@/lib/apply-pattern-library-nav-gate";

export function CommandPaletteAdminNavGroups({
  callerAuthorityRank,
  hasCommittedArchitectureReview,
  auditRunId,
  patternLibraryNavVisible,
  roleNavDensityPersona,
  roleNavDensityShowFullNav,
  onNavigate,
}: {
  callerAuthorityRank: number;
  hasCommittedArchitectureReview: boolean;
  auditRunId: string | null;
  patternLibraryNavVisible: boolean;
  roleNavDensityPersona: ReturnType<typeof resolveRoleNavDensityPersona>;
  roleNavDensityShowFullNav: boolean;
  onNavigate: (href: string) => void;
}) {
  const search = useCommandState((state) => state.search);
  const showAdminPalette = search.trim().length > 0;

  if (!showAdminPalette) {
    return null;
  }

  const adminRows = filterNavGroupsByRoleDensity(
    applyPatternLibraryNavGate(
      scopeOperatorShellNavRows(
        listNavGroupsVisibleInOperatorShell(
          NAV_GROUPS,
          callerAuthorityRank,
          "platform-admin",
          hasCommittedArchitectureReview,
        ),
        auditRunId,
      ),
      patternLibraryNavVisible,
    ),
    roleNavDensityPersona,
    roleNavDensityShowFullNav,
  );

  const systemAdminRows = filterNavGroupsByRoleDensity(
    isShowSystemAdministrationNavEnabled()
      ? listNavGroupsVisibleInOperatorShell(
          NAV_GROUPS,
          callerAuthorityRank,
          "system-admin",
          hasCommittedArchitectureReview,
        )
      : [],
    roleNavDensityPersona,
    roleNavDensityShowFullNav,
  );

  return (
    <>
      {adminRows.map(({ group, visibleLinks }) => (
        <CommandGroup
          key={`palette-${group.id}`}
          heading={group.id === "operator-admin" ? "Administration" : group.label}
        >
          {visibleLinks.map((link) => (
            <CommandItem
              key={link.href}
              value={`administration ${link.label} ${link.href}`}
              onSelect={() => {
                onNavigate(link.href);
              }}
            >
              {link.label}
            </CommandItem>
          ))}
        </CommandGroup>
      ))}
      {systemAdminRows.map(({ group, visibleLinks }) => (
        <CommandGroup key={`palette-${group.id}`} heading={group.label}>
          {visibleLinks.map((link) => (
            <CommandItem
              key={link.href}
              value={`internal operations ${link.label} ${link.href}`}
              onSelect={() => {
                onNavigate(link.href);
              }}
            >
              {link.label}
            </CommandItem>
          ))}
        </CommandGroup>
      ))}
    </>
  );
}
