"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
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
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const technicalIdDisclosureKeyParam = searchParams.get("technicalIdDisclosureKey");
  const disclosureKey = props.disclosureKey?.trim() ?? "";
  const [open, setOpenState] = useState(
    () =>
      disclosureKey.length > 0
      && parseTechnicalIdDisclosureKeyFromSearch(technicalIdDisclosureKeyParam) === disclosureKey,
  );
  const trimmed = (props.value ?? "").trim();
  const buyerPolished = isBuyerPolishedOperatorShellEnv();

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      if (disclosureKey.length === 0) {
        return;
      }

      router.replace(
        technicalIdDisclosureKeyDisclosureHrefFromSearch(
          searchParams.toString(),
          detailsOpen ? disclosureKey : null,
          pathname,
        ),
        { scroll: false },
      );
    },
    [disclosureKey, pathname, router, searchParams],
  );

  useEffect(() => {
    if (disclosureKey.length === 0) {
      return;
    }

    setOpenState(parseTechnicalIdDisclosureKeyFromSearch(technicalIdDisclosureKeyParam) === disclosureKey);
  }, [disclosureKey, technicalIdDisclosureKeyParam]);

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
            setOpenState(true);
            syncOpenToUrl(true);
          }}
        >
          Show details
        </Button>
      )}
    </span>
  );
}
