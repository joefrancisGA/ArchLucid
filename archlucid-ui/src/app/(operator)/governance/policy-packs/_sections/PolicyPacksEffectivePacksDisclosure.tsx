"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import { CollapsibleJsonTree } from "@/components/CollapsibleJsonTree";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS } from "@/lib/design-tokens";
import {
  parsePolicyPacksEffectivePacksOpenFromSearch,
  policyPacksEffectivePacksDisclosureHrefFromSearch,
} from "@/lib/governance/policy-packs-effective-packs-disclosure-url";
import { cn } from "@/lib/utils";
import type { EffectivePolicyPackSet } from "@/types/policy-packs";

type PolicyPacksEffectivePacksDisclosureProps = {
  readonly effective: EffectivePolicyPackSet;
};

/** Policy packs inspect effective resolved packs JSON disclosure synced to URL. */
export function PolicyPacksEffectivePacksDisclosure(props: PolicyPacksEffectivePacksDisclosureProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const policyPacksEffectivePacksOpenParam = searchParams.get("policyPacksEffectivePacksOpen");
  const [open, setOpenState] = useState(() =>
    parsePolicyPacksEffectivePacksOpenFromSearch(policyPacksEffectivePacksOpenParam),
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        policyPacksEffectivePacksDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
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
    setOpenState(parsePolicyPacksEffectivePacksOpenFromSearch(policyPacksEffectivePacksOpenParam));
  }, [policyPacksEffectivePacksOpenParam]);

  return (
    <details
      className="mb-5 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950/50"
      open={open}
      onToggle={(event) => {
        setOpen((event.currentTarget as HTMLDetailsElement).open);
      }}
    >
      <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        View effective resolved packs JSON ({props.effective.packs?.length ?? 0} pack(s))
      </summary>
      <div className="mt-3">
        <CollapsibleJsonTree
          value={props.effective}
          className="max-h-[360px] border border-neutral-200 dark:border-neutral-600"
        />
      </div>
    </details>
  );
}
