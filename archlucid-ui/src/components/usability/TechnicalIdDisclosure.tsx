"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import {
  parseTechnicalIdDisclosureKeyFromSearch,
  technicalIdDisclosureKeyDisclosureHrefFromSearch,
} from "@/lib/usability/technical-id-disclosure-key-disclosure-url";

type TechnicalIdDisclosureProps = {
  readonly label: string;
  readonly value: string | null | undefined;
  /** Stable key for shareable URL sync when multiple disclosures share a page. */
  readonly disclosureKey?: string;
};

/** Hides raw IDs behind a disclosure toggle in buyer/sponsor shells. */
export function TechnicalIdDisclosure(props: TechnicalIdDisclosureProps) {
  const pathname = usePathname() ?? "/";
  const disclosureKey = props.disclosureKey?.trim() ?? "";
  const readOpenFromUrl = (): boolean => {
    if (disclosureKey.length === 0 || typeof window === "undefined") {
      return false;
    }

    return (
      parseTechnicalIdDisclosureKeyFromSearch(
        new URLSearchParams(window.location.search).get("technicalIdDisclosureKey"),
      ) === disclosureKey
    );
  };
  const [open, setOpenState] = useState(readOpenFromUrl);
  const openRef = useRef(open);
  openRef.current = open;
  const trimmed = (props.value ?? "").trim();
  const buyerPolished = isBuyerPolishedOperatorShellEnv();

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      if (disclosureKey.length === 0 || openRef.current === detailsOpen) {
        return;
      }

      openRef.current = detailsOpen;
      setOpenState(detailsOpen);
      commitHrefIfChanged(
        technicalIdDisclosureKeyDisclosureHrefFromSearch(
          readWindowLocationSearch(),
          detailsOpen ? disclosureKey : null,
          pathname,
        ),
        { notify: false },
      );
    },
    [disclosureKey, pathname],
  );

  useEffect(() => {
    if (disclosureKey.length === 0) {
      return;
    }

    const syncOpenFromUrl = (): void => {
      const next = readOpenFromUrl();

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
  }, [disclosureKey]);

  if (trimmed.length === 0) {
    return <span className="text-neutral-500">—</span>;
  }

  if (!buyerPolished) {
    return <code className={cn("break-all rounded bg-neutral-100 px-1 font-mono dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.helper)}>{trimmed}</code>;
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className={cn("text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>{props.label}</span>
      {open ? (
        <code className={cn("break-all rounded bg-neutral-100 px-1 font-mono dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.helper)}>{trimmed}</code>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2"
          onClick={() => {
            setOpen(true);
          }}
        >
          Show details
        </Button>
      )}
    </span>
  );
}
