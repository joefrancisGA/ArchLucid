"use client";

import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { CtoDemoHowItWorksTrigger } from "@/components/cto-demo/CtoDemoHowItWorksTrigger";
import {
  formatActiveTenantContextTooltip,
  readActiveTenantContext,
  type ActiveTenantContextView,
} from "@/lib/active-tenant-context-display";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT } from "@/lib/operator/operator-scope-storage";

export type TenantWorkspaceBoundaryBadgeProps = {
  readonly variant?: "header" | "compact";
};

type ActiveTenantBadgeInnerProps = {
  readonly context: ActiveTenantContextView;
  readonly variant: "header" | "compact";
  readonly as: "link" | "button";
};

function badgeClassName(variant: "header" | "compact"): string {
  return cn(
    variant === "compact"
      ? "inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 dark:border-neutral-700"
      : "inline-flex max-w-[min(20rem,42vw)] items-center gap-1 truncate rounded-full border border-neutral-200 bg-white px-2.5 py-0.5 dark:border-neutral-700 dark:bg-neutral-900",
    OPERATOR_TYPOGRAPHY.badge,
    variant === "header" ? "text-neutral-600 dark:text-neutral-400" : "",
  );
}

function ActiveTenantBadgeInner(props: ActiveTenantBadgeInnerProps): React.JSX.Element {
  const { context, variant, as } = props;
  const tooltip = formatActiveTenantContextTooltip(context);
  const testId =
    variant === "compact" ? "tenant-workspace-boundary-badge-compact" : "active-tenant-context-badge";

  const body =
    variant === "compact" ? (
      <Building2 className="h-4 w-4 text-neutral-600 dark:text-neutral-400" aria-hidden />
    ) : (
      <>
        <Building2 className="h-3 w-3 shrink-0" aria-hidden />
        <span className="truncate">
          Active tenant:{" "}
          <span className="font-medium text-neutral-800 dark:text-neutral-200">{context.displayName}</span>
        </span>
      </>
    );

  if (as === "link") {
    return (
      <Link
        href="/administration/workspace-settings"
        className={cn(badgeClassName(variant), "no-underline transition hover:bg-neutral-50 dark:hover:bg-neutral-800/80")}
        data-testid={testId}
        aria-label={tooltip}
      >
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        badgeClassName(variant),
        "cursor-pointer transition hover:bg-neutral-50 dark:hover:bg-neutral-800/80",
      )}
      data-testid={testId}
      aria-label={tooltip}
    >
      {body}
    </button>
  );
}

/** Persistent operator-shell badge showing the active tenant routing context for isolation trust. */
export function TenantWorkspaceBoundaryBadge(props: TenantWorkspaceBoundaryBadgeProps): React.JSX.Element {
  const { variant = "header" } = props;
  const buyerPolished = isBuyerPolishedOperatorShellEnv();
  const [context, setContext] = useState<ActiveTenantContextView>(() => readActiveTenantContext(buyerPolished));

  const refresh = useCallback(() => {
    setContext(readActiveTenantContext(buyerPolished));
  }, [buyerPolished]);

  useEffect(() => {
    refresh();

    window.addEventListener("focus", refresh);
    window.addEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, refresh);
    };
  }, [refresh]);

  if (buyerPolished) {
    return (
      <CtoDemoHowItWorksTrigger
        focusSection="isolation"
        trigger={<ActiveTenantBadgeInner context={context} variant={variant} as="button" />}
      />
    );
  }

  return <ActiveTenantBadgeInner context={context} variant={variant} as="link" />;
}
