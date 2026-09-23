"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";

import { CollapsibleJsonTree } from "@/components/CollapsibleJsonTree";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS } from "@/lib/design-tokens";
import {
  findingInspectTypedPayloadDisclosureHrefFromSearch,
  parseFindingInspectTypedPayloadOpenFromSearch,
} from "@/lib/findings/finding-inspect-typed-payload-disclosure-url";
import {
  parseCollapsibleJsonExpandPathFromSearch,
} from "@/lib/collapsible-json-expand-path-disclosure-url";
import { cn } from "@/lib/utils";

/**
 * Client island for the finding inspector typed JSON payload (avoids adding "use client" to the full view).
 */
export function FindingInspectJsonPayload({ value }: { value: unknown }) {
  const pathname = usePathname() ?? "/";
  const readExpandPathFromUrl = (): ReturnType<typeof parseCollapsibleJsonExpandPathFromSearch> =>
    parseCollapsibleJsonExpandPathFromSearch(
      new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get("collapsibleJsonExpandPath"),
    );
  const expandPath = readExpandPathFromUrl();
  const [open, setOpenState] = useState(() =>
    parseFindingInspectTypedPayloadOpenFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("findingInspectTypedPayloadOpen"),
    ),
  );
  const openRef = useRef(open);
  openRef.current = open;

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      commitHrefIfChanged(
        findingInspectTypedPayloadDisclosureHrefFromSearch(readWindowLocationSearch(), detailsOpen, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      if (openRef.current === detailsOpen) {
        return;
      }

      openRef.current = detailsOpen;
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    const syncOpenFromUrl = (): void => {
      const next = parseFindingInspectTypedPayloadOpenFromSearch(
        new URLSearchParams(window.location.search).get("findingInspectTypedPayloadOpen"),
      );

      if (openRef.current === next) {
        return;
      }

      openRef.current = next;
      setOpenState(next);
    };

    syncOpenFromUrl();
    window.addEventListener("popstate", syncOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncOpenFromUrl);
    };
  }, []);

  return (
    <details
      className="rounded-md border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950/40"
      open={open}
      onToggle={(event) => {
        event.preventDefault();
        setOpen(!openRef.current);
      }}
    >
      <summary className={cn("cursor-pointer px-3 py-2 text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        Typed finding payload JSON
      </summary>
      <div className="border-t border-neutral-200 px-3 py-2 dark:border-neutral-700">
        <CollapsibleJsonTree value={value} expandPath={expandPath} aria-label="Typed finding payload" />
      </div>
    </details>
  );
}
