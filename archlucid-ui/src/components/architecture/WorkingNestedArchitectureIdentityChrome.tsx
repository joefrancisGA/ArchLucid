"use client";

import Link from "next/link";

import { useArchitectureIdentityQuery } from "@/hooks/use-architecture-identity-query";
import { architectureIdentityPath } from "@/lib/architecture/architecture-routes";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ArchitectureIdentityDetail } from "@/types/architecture-identity";
import { cn } from "@/lib/utils";

type WorkingNestedArchitectureIdentityChromeProps = {
  readonly architectureId: string;
};

function resolveArchitectureIdentityStatusLabel(identity: ArchitectureIdentityDetail): string {
  if ((identity.archivedUtc?.trim() ?? "").length > 0) {
    return "Archived";
  }

  return "Active";
}

export function WorkingNestedArchitectureIdentityChrome(
  props: WorkingNestedArchitectureIdentityChromeProps,
): React.JSX.Element {
  const query = useArchitectureIdentityQuery(props.architectureId);
  const identity = query.data;
  const displayName = identity?.displayName?.trim() ?? "Architecture";
  const statusLabel =
    identity !== undefined ? resolveArchitectureIdentityStatusLabel(identity) : "Loading";
  const deskHref = architectureIdentityPath(props.architectureId);

  return (
    <div
      data-testid="working-nested-architecture-identity-chrome"
      className={cn(
        "sticky top-0 z-[5] mb-2 flex min-h-10 flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-neutral-200 bg-white/95 px-3 py-2 backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-950/95",
        OPERATOR_TYPOGRAPHY.helper,
      )}
    >
      <span className="shrink-0 text-al-text-secondary">Architecture</span>
      <Link
        href={deskHref}
        className={cn(OPERATOR_LINK.nav, "min-w-0 truncate font-medium text-al-text-primary")}
      >
        {displayName}
      </Link>
      <span className="shrink-0 text-al-text-secondary">{statusLabel}</span>
      <Link href={deskHref} className={cn(OPERATOR_LINK.inline, "ml-auto shrink-0")}>
        Open desk
      </Link>
    </div>
  );
}
