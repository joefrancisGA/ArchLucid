"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import {
  CLOUD_CONNECTIONS_HELP_PACKAGING_SCRIPTS,
  CLOUD_CONNECTIONS_HELP_PACKAGING_SCRIPTS_HINT,
  CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS,
} from "@/lib/cloud-connections-help-guide-content";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  helpCloudConnectionsPackagingScriptsDisclosureHrefFromSearch,
  parseHelpCloudConnectionsPackagingScriptsOpenFromSearch,
} from "@/lib/help/help-cloud-connections-packaging-scripts-disclosure-url";
import { cn } from "@/lib/utils";

/** Packaging scripts disclosure on the cloud connections help page, synced to URL. */
export function HelpCloudConnectionsPackagingScriptsDisclosure(): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const helpCloudConnectionsPackagingScriptsOpenParam = searchParams.get("helpCloudConnectionsPackagingScriptsOpen");
  const [packagingScriptsOpen, setPackagingScriptsOpenState] = useState(() =>
    parseHelpCloudConnectionsPackagingScriptsOpenFromSearch(helpCloudConnectionsPackagingScriptsOpenParam),
  );

  const syncPackagingScriptsOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        helpCloudConnectionsPackagingScriptsDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setPackagingScriptsOpen = useCallback(
    (open: boolean) => {
      setPackagingScriptsOpenState(open);
      syncPackagingScriptsOpenToUrl(open);
    },
    [syncPackagingScriptsOpenToUrl],
  );

  useEffect(() => {
    setPackagingScriptsOpenState(
      parseHelpCloudConnectionsPackagingScriptsOpenFromSearch(helpCloudConnectionsPackagingScriptsOpenParam),
    );
  }, [helpCloudConnectionsPackagingScriptsOpenParam]);

  return (
    <details
      className="rounded-md border border-neutral-200 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-900/30"
      open={packagingScriptsOpen}
      onToggle={(event) => {
        setPackagingScriptsOpen((event.currentTarget as HTMLDetailsElement).open);
      }}
    >
      <summary className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>
        Packaging scripts
      </summary>
      <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
        {CLOUD_CONNECTIONS_HELP_PACKAGING_SCRIPTS.map((script) => (
          <li key={script}>
            <code>{script}</code>
          </li>
        ))}
      </ul>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
        {CLOUD_CONNECTIONS_HELP_PACKAGING_SCRIPTS_HINT}{" "}
        <Link
          href={CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.startEvidenceOnlyReview.href}
          className={OPERATOR_LINK.inline}
        >
          {CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.startEvidenceOnlyReview.label}
        </Link>
        .
      </p>
    </details>
  );
}
