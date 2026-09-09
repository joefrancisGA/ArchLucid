"use client";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  PAGE_SHORTCUTS_OPEN_PARAM,
  pageShortcutsDisclosureHrefFromSearch,
  parsePageShortcutsOpenFromSearch,
} from "@/lib/usability/page-shortcuts-disclosure-url";

export type PageShortcutEntry = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
};

export type PageShortcutsDisclosureProps = {
  readonly testId: string;
  readonly entries: readonly PageShortcutEntry[];
};

/** Compact page-scoped shortcut legend — not a global coach banner. */
export function PageShortcutsDisclosure(props: PageShortcutsDisclosureProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const pageShortcutsParam = searchParams.get(PAGE_SHORTCUTS_OPEN_PARAM);
  const [pageShortcutsOpen, setPageShortcutsOpenState] = useState(() =>
    parsePageShortcutsOpenFromSearch(pageShortcutsParam),
  );
  const syncPageShortcutsOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(pageShortcutsDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );
  const setPageShortcutsOpen = useCallback(
    (open: boolean) => {
      setPageShortcutsOpenState(open);
      syncPageShortcutsOpenToUrl(open);
    },
    [syncPageShortcutsOpenToUrl],
  );
  useEffect(() => {
    setPageShortcutsOpenState(parsePageShortcutsOpenFromSearch(pageShortcutsParam));
  }, [pageShortcutsParam]);

  return (
    <details
      className={cn("rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800", OPERATOR_TYPOGRAPHY.helper)}
      data-testid={props.testId}
      open={pageShortcutsOpen}
      onToggle={(event) => setPageShortcutsOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer font-medium text-al-text-primary">Shortcuts</summary>
      <ul className="m-0 mt-2 list-none space-y-2 p-0">
        {props.entries.map((entry) => (
          <li key={entry.id} data-testid={`${props.testId}-entry-${entry.id}`}>
            <span className="font-medium text-al-text-primary">{entry.label}</span>
            <span className="text-al-text-secondary"> — {entry.description}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
