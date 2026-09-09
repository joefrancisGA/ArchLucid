"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleJsonTree } from "@/components/CollapsibleJsonTree";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS } from "@/lib/design-tokens";
import {
  findingInspectTypedPayloadDisclosureHrefFromSearch,
  parseFindingInspectTypedPayloadOpenFromSearch,
} from "@/lib/findings/finding-inspect-typed-payload-disclosure-url";
import { cn } from "@/lib/utils";

/**
 * Client island for the finding inspector typed JSON payload (avoids adding "use client" to the full view).
 */
export function FindingInspectJsonPayload({ value }: { value: unknown }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const findingInspectTypedPayloadOpenParam = searchParams.get("findingInspectTypedPayloadOpen");
  const [open, setOpenState] = useState(() =>
    parseFindingInspectTypedPayloadOpenFromSearch(findingInspectTypedPayloadOpenParam),
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        findingInspectTypedPayloadDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
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
    setOpenState(parseFindingInspectTypedPayloadOpenFromSearch(findingInspectTypedPayloadOpenParam));
  }, [findingInspectTypedPayloadOpenParam]);

  return (
    <details
      className="rounded-md border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950/40"
      open={open}
      onToggle={(event) => {
        setOpen((event.currentTarget as HTMLDetailsElement).open);
      }}
    >
      <summary className={cn("cursor-pointer px-3 py-2 text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        Typed finding payload JSON
      </summary>
      <div className="border-t border-neutral-200 px-3 py-2 dark:border-neutral-700">
        <CollapsibleJsonTree value={value} aria-label="Typed finding payload" />
      </div>
    </details>
  );
}
