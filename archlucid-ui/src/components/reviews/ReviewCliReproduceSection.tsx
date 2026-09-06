"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CopyIdButton } from "@/components/CopyIdButton";
import {
  parseReviewCliReproduceOpenFromSearch,
  reviewCliReproduceDisclosureHrefFromSearch,
} from "@/lib/reviews/review-cli-reproduce-disclosure-url";

export type ReviewCliReproduceSectionProps = {
  readonly runId: string;
  readonly ruleSetId?: string | null;
};

/** CLI command that reproduces this review — bridging UI validation to CI pipeline automation. */
export function ReviewCliReproduceSection({
  runId,
  ruleSetId,
}: ReviewCliReproduceSectionProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const reviewCliReproduceOpenParam = searchParams.get("reviewCliReproduceOpen");
  const [open, setOpenState] = useState(() => parseReviewCliReproduceOpenFromSearch(reviewCliReproduceOpenParam));
  const policyFlag = ruleSetId ? ` --policy ${ruleSetId}` : "";
  const command = `archlucid review run --package-id ${runId}${policyFlag}`;

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(reviewCliReproduceDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname), {
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
    setOpenState(parseReviewCliReproduceOpenFromSearch(reviewCliReproduceOpenParam));
  }, [reviewCliReproduceOpenParam]);

  return (
    <section id="cli-reproduce" className="scroll-mt-24">
      <CollapsibleSection title="Reproduce via CLI" open={open} onToggle={setOpen}>
        <p className={cn("m-0 mb-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          Run this command in your CI pipeline to reproduce this analysis with the same scope and policy pack.
          Requires the ArchLucid CLI authenticated to this workspace.
        </p>
        <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
          <code className={cn("min-w-0 flex-1 break-all font-mono text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
            {command}
          </code>
          <CopyIdButton value={command} aria-label="Copy CLI command" />
        </div>
      </CollapsibleSection>
    </section>
  );
}
