"use client";

import { useRouter } from "next/navigation";
import { useCallback, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { useIsSampleWorkspaceSession } from "@/hooks/use-effective-operator-scope";
import {
  BUYER_SCOPE_BACK_TO_YOUR_WORKSPACE_CTA,
  BUYER_SCOPE_SAMPLE_WORKSPACE_DEMO_HINT,
  BUYER_SCOPE_SAMPLE_WORKSPACE_LABEL,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_TYPE_SCALE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isSampleWorkspaceVisitActive } from "@/lib/operator/operator-sample-workspace-visit";
import { returnToDedicatedWorkspaceFromSample } from "@/lib/operator/operator-scope-bootstrap";
import { cn } from "@/lib/utils";

export type SampleWorkspaceReturnBannerProps = {
  readonly className?: string;
};

/** Persistent sample-data chrome with one-click return to the operator's dedicated workspace. */
export function SampleWorkspaceReturnBanner(props: SampleWorkspaceReturnBannerProps): ReactElement | null {
  const router = useRouter();
  const isSampleWorkspace = useIsSampleWorkspaceSession();
  const showBanner = isSampleWorkspace && isSampleWorkspaceVisitActive();

  const onReturn = useCallback(() => {
    const returned = returnToDedicatedWorkspaceFromSample();

    if (!returned) {
      return;
    }

    router.replace("/");
    router.refresh();
  }, [router]);

  if (!showBanner) {
    return null;
  }

  return (
    <div
      className={cn(
        "border-b border-neutral-200 bg-amber-50/90 px-4 py-2 dark:border-neutral-800 dark:bg-amber-950/30",
        OPERATOR_TYPOGRAPHY.body,
        props.className,
      )}
      role="status"
      data-testid="sample-workspace-return-banner"
    >
      <div className="mx-auto flex max-w-[var(--operator-shell-max-width)] flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPE_SCALE.cardTitle)}>
            {BUYER_SCOPE_SAMPLE_WORKSPACE_LABEL}
          </p>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPE_SCALE.helper)}>
            {BUYER_SCOPE_SAMPLE_WORKSPACE_DEMO_HINT}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          data-testid="sample-workspace-return-button"
          onClick={onReturn}
        >
          {BUYER_SCOPE_BACK_TO_YOUR_WORKSPACE_CTA}
        </Button>
      </div>
    </div>
  );
}
