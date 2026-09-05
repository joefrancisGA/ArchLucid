"use client";

import type { JSX, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  parseRelatedSurfacesOpenFromSearch,
  relatedSurfacesDisclosureHrefFromSearch,
} from "@/lib/operator/related-surfaces-disclosure-url";
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
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const relatedSurfacesOpenParam = searchParams.get("relatedSurfacesOpen");
  const title = props.title ?? OPERATOR_RELATED_SURFACES_DISCLOSURE_TITLE;
  const [open, setOpenState] = useState(() => parseRelatedSurfacesOpenFromSearch(relatedSurfacesOpenParam));

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(relatedSurfacesDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    setOpenState(parseRelatedSurfacesOpenFromSearch(relatedSurfacesOpenParam));
  }, [relatedSurfacesOpenParam]);

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
