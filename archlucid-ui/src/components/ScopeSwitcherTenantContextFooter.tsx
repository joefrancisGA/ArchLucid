"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useCallback, useEffect, useState } from "react";

import {
  formatActiveTenantContextTooltip,
  readActiveTenantContext,
  type ActiveTenantContextView,
} from "@/lib/active-tenant-context-display";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT } from "@/lib/operator/operator-scope-storage";

/** Quiet read-only tenant context under the workspace/project picker. */
export function ScopeSwitcherTenantContextFooter(): React.JSX.Element {
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

  const tooltip = formatActiveTenantContextTooltip(context);

  return (
    <div
      className="border-t border-neutral-200 pt-2 dark:border-neutral-700"
      data-testid="operator-scope-switcher-tenant-context"
    >
      <p
        className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
        title={tooltip}
      >
        Tenant: <span className="text-neutral-600 dark:text-neutral-300">{context.displayName}</span>
      </p>
    </div>
  );
}
