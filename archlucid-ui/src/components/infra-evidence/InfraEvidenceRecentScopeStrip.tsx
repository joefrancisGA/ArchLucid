"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  INFRA_EVIDENCE_RECENT_SCOPE_CHANGED_EVENT,
  readInfraEvidenceRecentScopes,
  type InfraEvidenceRecentScopeEntry,
} from "@/lib/infra-evidence/infra-evidence-recent-scope";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type InfraEvidenceRecentScopeStripProps = {
  readonly testId?: string;
};

export function InfraEvidenceRecentScopeStrip(
  props: InfraEvidenceRecentScopeStripProps,
): React.JSX.Element | null {
  const { testId = "infra-evidence-recent-scope-strip" } = props;
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const currentHref = searchParams.toString().length > 0
    ? `${pathname}?${searchParams.toString()}`
    : pathname;
  const [entries, setEntries] = useState<readonly InfraEvidenceRecentScopeEntry[]>([]);

  useEffect(() => {
    const refreshEntries = () => {
      setEntries(readInfraEvidenceRecentScopes(currentHref));
    };

    refreshEntries();
    window.addEventListener(INFRA_EVIDENCE_RECENT_SCOPE_CHANGED_EVENT, refreshEntries);

    return () => {
      window.removeEventListener(INFRA_EVIDENCE_RECENT_SCOPE_CHANGED_EVENT, refreshEntries);
    };
  }, [currentHref]);

  if (entries.length === 0) {
    return null;
  }

  return (
    <section
      className="rounded border border-dashed border-border bg-muted/10 p-3"
      data-testid={testId}
      aria-label="Recent infrastructure evidence scopes"
    >
      <p className={cn("m-0 text-sm text-muted-foreground", OPERATOR_TYPOGRAPHY.helper)}>
        Recent scopes:
      </p>
      <ul className="m-0 mt-2 flex flex-wrap gap-2 p-0">
        {entries.map((entry) => (
          <li key={entry.href}>
            <Link
              className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-sm text-al-link hover:bg-muted/40 hover:underline"
              href={entry.href}
              data-testid={`${testId}-entry`}
            >
              {entry.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
