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
import { isWorkingPaletteNavHrefAllowed } from "@/lib/filter-working-palette-nav-hrefs";
import type { ProductLineAssignment } from "@/lib/product-line/product-line-assignment";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

export function CommandPaletteAdminNavGroups({
  callerAuthorityRank,
  hasCommittedArchitectureReview,
  auditRunId,
  patternLibraryNavVisible,
  roleNavDensityPersona,
  roleNavDensityShowFullNav,
  showVendorInternalNav,
  productLine,
  productLineAssignmentOverrides,
  workingMode,
  onNavigate,
}: {
  callerAuthorityRank: number;
  hasCommittedArchitectureReview: boolean;
  auditRunId: string | null;
  patternLibraryNavVisible: boolean;
  roleNavDensityPersona: ReturnType<typeof resolveRoleNavDensityPersona>;
  roleNavDensityShowFullNav: boolean;
  showVendorInternalNav: boolean;
  productLine: ProductLineId;
  productLineAssignmentOverrides: Readonly<Record<string, ProductLineAssignment>>;
  workingMode: boolean;
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
          false,
          {
            showVendorInternalNav,
            productLine,
            productLineAssignmentOverrides,
          },
        ),
        auditRunId,
      ),
      patternLibraryNavVisible,
    ),
    roleNavDensityPersona,
    roleNavDensityShowFullNav,
  );

  const systemAdminRows = filterNavGroupsByRoleDensity(
    isShowSystemAdministrationNavEnabled() && !workingMode
      ? listNavGroupsVisibleInOperatorShell(
          NAV_GROUPS,
          callerAuthorityRank,
          "system-admin",
          hasCommittedArchitectureReview,
          false,
          {
            showVendorInternalNav,
            productLine,
            productLineAssignmentOverrides,
          },
        )
      : [],
    roleNavDensityPersona,
    roleNavDensityShowFullNav,
  );

  function filterWorkingPaletteLinks(
    links: readonly { href: string; label: string }[],
  ): readonly { href: string; label: string }[] {
    if (!workingMode) {
      return links;
    }

    return links.filter((link) => isWorkingPaletteNavHrefAllowed(link.href));
  }

  return (
    <>
      {adminRows.map(({ group, visibleLinks }) => {
        const linksForPalette = filterWorkingPaletteLinks(visibleLinks);

        if (linksForPalette.length === 0) {
          return null;
        }

        return (
          <CommandGroup
            key={`palette-${group.id}`}
            heading={group.id === "operator-admin" ? "Administration" : group.label}
          >
            {linksForPalette.map((link) => (
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
        );
      })}
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
