"use client";

import Link from "next/link";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { TROUBLESHOOTING_ADVANCED_DIAGNOSTICS_ITEMS } from "@/lib/troubleshooting-help-guide-content";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { cn } from "@/lib/utils";

/** Admin-only advanced diagnostics rows inside the collapsed troubleshooting section. */
export function HelpTroubleshootingAdvancedDiagnostics(): React.JSX.Element {
  const { callerAuthorityRank } = useOperatorNavAuthority();
  const isAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;

  return (
    <ul className="m-0 list-none space-y-4 p-0">
      {TROUBLESHOOTING_ADVANCED_DIAGNOSTICS_ITEMS.map((item) => {
        if (item.adminOnly === true && !isAdmin) {
          return null;
        }

        return (
          <li key={item.title}>
            <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{item.title}</p>
            <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>{item.body}</p>
            <Link
              href={item.href}
              className={cn("mt-2 inline-block font-medium underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
            >
              {item.linkLabel}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
