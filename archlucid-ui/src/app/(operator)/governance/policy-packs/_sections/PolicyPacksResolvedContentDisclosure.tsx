"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import { CollapsibleJsonTree } from "@/components/CollapsibleJsonTree";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS } from "@/lib/design-tokens";
import {
  parsePolicyPacksResolvedContentOpenFromSearch,
  policyPacksResolvedContentDisclosureHrefFromSearch,
} from "@/lib/governance/policy-packs-resolved-content-disclosure-url";
import { cn } from "@/lib/utils";
import type { PolicyPackContentDocument } from "@/types/policy-packs";

type PolicyPacksResolvedContentDisclosureProps = {
  readonly effectiveContent: PolicyPackContentDocument;
};

/** Policy packs inspect resolved effective content JSON disclosure synced to URL. */
export function PolicyPacksResolvedContentDisclosure(
  props: PolicyPacksResolvedContentDisclosureProps,
): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const policyPacksResolvedContentOpenParam = searchParams.get("policyPacksResolvedContentOpen");
  const [open, setOpenState] = useState(() =>
    parsePolicyPacksResolvedContentOpenFromSearch(policyPacksResolvedContentOpenParam),
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        policyPacksResolvedContentDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
        { scroll: false },
      );
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
    setOpenState(parsePolicyPacksResolvedContentOpenFromSearch(policyPacksResolvedContentOpenParam));
  }, [policyPacksResolvedContentOpenParam]);

  return (
    <details
      className="mb-6 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950/50"
      open={open}
      onToggle={(event) => {
        setOpen((event.currentTarget as HTMLDetailsElement).open);
      }}
    >
      <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        View resolved effective content JSON
      </summary>
      <div className="mt-3">
        <CollapsibleJsonTree
          value={props.effectiveContent}
          className="max-h-[360px] border border-neutral-200 dark:border-neutral-600"
        />
      </div>
    </details>
  );
}
