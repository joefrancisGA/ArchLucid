"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import {
  parseQuickReviewAdvancedOpenFromSearch,
  quickReviewAdvancedConfigHrefFromSearch,
} from "@/lib/wizard/quick-review-advanced-config-url";

type QuickReviewAdvancedConfigAccordionProps = {
  readonly children: ReactNode;
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
};

/** Collapses execution modes, workspace scope, and policy-pack pickers until the operator explicitly expands them. */
export function QuickReviewAdvancedConfigAccordion(props: QuickReviewAdvancedConfigAccordionProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const quickReviewAdvancedOpenParam = searchParams.get("quickReviewAdvancedOpen");
  const [internalOpen, setInternalOpenState] = useState(() =>
    parseQuickReviewAdvancedOpenFromSearch(quickReviewAdvancedOpenParam),
  );
  const isControlled = props.open !== undefined;
  const open = isControlled ? props.open : internalOpen;

  const syncOpenToUrl = useCallback(
    (next: boolean) => {
      router.replace(quickReviewAdvancedConfigHrefFromSearch(searchParams.toString(), next, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (next: boolean): void => {
      if (!isControlled) {
        setInternalOpenState(next);
        syncOpenToUrl(next);
      }

      props.onOpenChange?.(next);
    },
    [isControlled, props, syncOpenToUrl],
  );

  useEffect(() => {
    if (isControlled) {
      return;
    }

    setInternalOpenState(parseQuickReviewAdvancedOpenFromSearch(quickReviewAdvancedOpenParam));
  }, [isControlled, quickReviewAdvancedOpenParam]);

  return (
    <Collapsible open={open} onOpenChange={setOpen} data-testid="quick-review-advanced-config">
      <CollapsibleTrigger
        type="button"
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 text-left hover:bg-al-layer-hover dark:border-neutral-700",
          OPERATOR_TYPOGRAPHY.body,
        )}
        aria-expanded={open}
      >
        <span className="font-medium text-al-text-primary">Advanced configuration (optional)</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open ? "rotate-180" : "rotate-0")} aria-hidden />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-3 rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
        {props.children}
      </CollapsibleContent>
    </Collapsible>
  );
}
