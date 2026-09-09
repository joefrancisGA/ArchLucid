"use client";

import type { ReactElement, ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  OPERATOR_INVENTORY_ROW_OVERFLOW_ID_PARAM,
  operatorInventoryRowOverflowDisclosureHrefFromSearch,
  parseOperatorInventoryRowOverflowIdFromSearch,
} from "@/lib/operator/operator-inventory-row-overflow-disclosure-url";
import { cn } from "@/lib/utils";

export type OperatorInventoryRowMoreActionsProps = {
  readonly overflowRowId: string;
  readonly primaryActions: ReactNode;
  readonly overflowActions: ReactNode;
  readonly overflowMenuLabel?: string;
  readonly testId?: string;
};

/** TB-1646 / TB-1649 — keep ≤2 visible row actions; tuck the rest under a disclosure menu. */
export function OperatorInventoryRowMoreActions(props: OperatorInventoryRowMoreActionsProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const operatorInventoryRowOverflowIdParam = searchParams.get(OPERATOR_INVENTORY_ROW_OVERFLOW_ID_PARAM);
  const [openOverflowRowId, setOpenOverflowRowIdState] = useState(() =>
    parseOperatorInventoryRowOverflowIdFromSearch(operatorInventoryRowOverflowIdParam),
  );
  const syncOpenOverflowRowIdToUrl = useCallback(
    (overflowRowId: string | null) => {
      router.replace(
        operatorInventoryRowOverflowDisclosureHrefFromSearch(searchParams.toString(), overflowRowId, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );
  const setOpenOverflowRowId = useCallback(
    (overflowRowId: string | null) => {
      setOpenOverflowRowIdState(overflowRowId ?? "");
      syncOpenOverflowRowIdToUrl(overflowRowId);
    },
    [syncOpenOverflowRowIdToUrl],
  );
  useEffect(() => {
    setOpenOverflowRowIdState(parseOperatorInventoryRowOverflowIdFromSearch(operatorInventoryRowOverflowIdParam));
  }, [operatorInventoryRowOverflowIdParam]);
  const overflowOpen = openOverflowRowId === props.overflowRowId;

  return (
    <div className="flex flex-wrap items-start gap-2">
      {props.primaryActions}
      <details
        className="min-w-[8rem]"
        open={overflowOpen}
        onToggle={(event) => {
          const nextOpen = event.currentTarget.open;
          setOpenOverflowRowId(nextOpen ? props.overflowRowId : null);
        }}
      >
        <summary
          className={cn(
            "inline-flex cursor-pointer list-none items-center rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-neutral-900 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900",
            OPERATOR_TYPOGRAPHY.helper,
            "[&::-webkit-details-marker]:hidden",
          )}
          data-testid={props.testId}
        >
          {props.overflowMenuLabel ?? "More actions"}
        </summary>
        <div className={cn("mt-2 flex flex-wrap gap-2", OPERATOR_TYPOGRAPHY.helper)}>{props.overflowActions}</div>
      </details>
    </div>
  );
}
