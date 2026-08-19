"use client";

import { CircleHelp } from "lucide-react";
import Link from "next/link";

import { helpTooltipIconClassName, helpTooltipLinkClassName } from "@/components/ui/help-tooltip-trigger";
import { toDocsBlobUrl } from "@/lib/contextual-help-content";

export type HelpLinkProps = {
  /** Repo-relative path such as `/docs/CORE_PILOT.md`; resolved via `toDocsBlobUrl` (same as ContextualHelp "Learn more"). */
  docPath: string;
  /** Accessible name and tooltip; keep specific (not just "Help"). */
  label: string;
  className?: string;
};

/**
 * Subtle docs icon that opens in-app help for the repo-relative doc path.
 * Use sparingly beside titles; complements {@link ContextualHelp} in-app summaries.
 */
export function HelpLink({ docPath, label, className }: HelpLinkProps) {
  const href = toDocsBlobUrl(docPath);

  return (
    <Link
      href={href}
      className={helpTooltipLinkClassName("contextual", className)}
      aria-label={label}
      title={label}
      data-help-tooltip-trigger=""
      data-help-tooltip-icon="help"
    >
      <CircleHelp className={helpTooltipIconClassName("contextual")} aria-hidden />
    </Link>
  );
}
