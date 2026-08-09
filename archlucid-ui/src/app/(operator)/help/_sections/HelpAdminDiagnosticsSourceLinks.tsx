"use client";

import Link from "next/link";

import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import {
  ADMIN_DIAGNOSTICS_HELP_SOURCES,
  type AdminDiagnosticsHelpSourceLink,
} from "@/lib/admin-diagnostics-help-evidence-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { cn } from "@/lib/utils";

function filterAdminDiagnosticsHelpSources(
  sources: readonly AdminDiagnosticsHelpSourceLink[],
  isAdmin: boolean,
): readonly AdminDiagnosticsHelpSourceLink[] {
  return sources.filter((link) => link.adminOnly !== true || isAdmin);
}

/** Source links for the admin diagnostics action panel with Admin-only gating (HAE). */
export function HelpAdminDiagnosticsSourceLinks(): React.ReactElement {
  const { callerAuthorityRank } = useOperatorNavAuthority();
  const isAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const visibleSources = filterAdminDiagnosticsHelpSources(ADMIN_DIAGNOSTICS_HELP_SOURCES, isAdmin);

  return (
    <ul
      className={cn("m-0 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}
      data-testid="help-admin-diagnostics-source-links"
    >
      {visibleSources.map((link) => (
        <li key={`${link.href}-${link.label}`}>
          <Link
            className={cn(OPERATOR_LINK.inline, "inline-flex min-h-6 items-center py-1 font-medium")}
            href={link.href}
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
