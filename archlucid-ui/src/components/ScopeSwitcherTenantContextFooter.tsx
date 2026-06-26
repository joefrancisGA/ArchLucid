"use client";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { CtoDemoHowItWorksTrigger } from "@/components/cto-demo/CtoDemoHowItWorksTrigger";
import {
  formatActiveTenantContextTooltip,
  readActiveTenantContext,
  type ActiveTenantContextView,
} from "@/lib/active-tenant-context-display";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT } from "@/lib/operator-scope-storage";

function TenantContextDetails(props: { readonly context: ActiveTenantContextView }): React.JSX.Element {
  const { context } = props;

  return (
    <details className={cn("rounded-md border border-neutral-200 p-2 dark:border-neutral-700", OPERATOR_TYPOGRAPHY.helper)}>
      <summary className="cursor-pointer select-none font-medium text-neutral-700 dark:text-neutral-200">
        Tenant details
      </summary>
      <dl className="m-0 mt-2 space-y-1 text-neutral-600 dark:text-neutral-400">
        <div>
          <dt className="inline font-medium text-neutral-700 dark:text-neutral-300">Tenant ID: </dt>
          <dd className="inline break-all">{context.tenantId}</dd>
        </div>
        {context.workspaceId !== null ? (
          <div>
            <dt className="inline font-medium text-neutral-700 dark:text-neutral-300">Workspace ID: </dt>
            <dd className="inline break-all">{context.workspaceId}</dd>
          </div>
        ) : null}
      </dl>
    </details>
  );
}

/** Tenant isolation context shown at the bottom of the workspace scope switcher panel. */
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
      <TenantContextDetails context={context} />
      {buyerPolished ? (
        <CtoDemoHowItWorksTrigger focusSection="isolation" variant="link" />
      ) : (
        <Link
          href="/settings/tenant"
          className={cn("font-medium text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline dark:text-neutral-400 dark:hover:text-neutral-100", OPERATOR_TYPOGRAPHY.helper)}
        >
          Tenant settings
        </Link>
      )}
    </div>
  );
}
