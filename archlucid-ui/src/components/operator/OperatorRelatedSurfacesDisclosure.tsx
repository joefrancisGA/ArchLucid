"use client";

import type { JSX, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { commitHrefIfChanged } from "@/lib/navigation/replace-if-href-changed";
import {
  parseRelatedSurfacesOpenFromSearch,
  relatedSurfacesDisclosureHrefFromSearch} from "@/lib/operator/related-surfaces-disclosure-url";
import { cn } from "@/lib/utils";

export const OPERATOR_RELATED_SURFACES_DISCLOSURE_TITLE = "Related surfaces";

export type OperatorRelatedSurfacesDisclosureProps = {
  readonly children: ReactNode;
  readonly className?: string;
  readonly testId: string;
  readonly title?: string;
};

/** Collapses stacked vocabulary rails and capability strips above the primary work object. */
export function OperatorRelatedSurfacesDisclosure(
  props: OperatorRelatedSurfacesDisclosureProps,
): JSX.Element {
  const pathname = usePathname() ?? "/";
  const title = props.title ?? OPERATOR_RELATED_SURFACES_DISCLOSURE_TITLE;
  const [open, setOpenState] = useState(() =>
    parseRelatedSurfacesOpenFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("relatedSurfacesOpen"),
    ),
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      commitHrefIfChanged(
        relatedSurfacesDisclosureHrefFromSearch(window.location.search.slice(1), detailsOpen, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      if (open === detailsOpen) {
        return;
      }

      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [open, syncOpenToUrl],
  );

  useEffect(() => {
    const syncOpenFromUrl = (): void => {
      setOpenState((current) => {
        const next = parseRelatedSurfacesOpenFromSearch(
          new URLSearchParams(window.location.search).get("relatedSurfacesOpen"),
        );

        return current === next ? current : next;
      });
    };

    syncOpenFromUrl();
    window.addEventListener("popstate", syncOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncOpenFromUrl);
    };
  }, []);

  return (
    <details
      className={cn("rounded-lg border border-neutral-200 dark:border-neutral-800", props.className)}
      data-testid={props.testId}
      open={open}
      onToggle={(event) => {
        setOpen((event.currentTarget as HTMLDetailsElement).open);
      }}
    >
      <summary className={cn("cursor-pointer px-4 py-2", OPERATOR_TYPOGRAPHY.cardTitle)}>{title}</summary>
      <div className="space-y-3 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">{props.children}</div>
    </details>
  );
}
