"use client";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { useCallback, useEffect, useState } from "react";

import { CtoDemoHowItWorksTrigger } from "@/components/cto-demo/CtoDemoHowItWorksTrigger";
import {
  formatActiveTenantContextTooltip,
  readActiveTenantContext,
  type ActiveTenantContextView,
} from "@/lib/active-tenant-context-display";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT } from "@/lib/operator-scope-storage";

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
      className="space-y-2 border-t border-neutral-200 pt-2 dark:border-neutral-700"
      data-testid="operator-scope-switcher-tenant-context"
    >
      <p className={cn("m-0 font-medium text-neutral-700 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)} title={tooltip}>
        Tenant: <span className="font-normal text-neutral-800 dark:text-neutral-100">{context.displayName}</span>
      </p>
      {buyerPolished ? (
        <CtoDemoHowItWorksTrigger focusSection="isolation" variant="link" />
      ) : null}
    </div>
  );
}
