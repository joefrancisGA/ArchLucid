"use client";

import { memo, type ReactNode } from "react";

import { OperatorNavAuthorityProvider } from "@/components/operator/OperatorNavAuthorityProvider";
import { TenantBrandCssVarsProvider } from "@/components/operator/TenantBrandCssVarsProvider";
import { WorkspaceActiveRunProvider } from "@/components/WorkspaceActiveRunContext";
import { SessionAiReadinessProvider } from "@/hooks/session-ai-readiness-context";
import { ProductLineProvider } from "@/components/product-line/ProductLineProvider";

/** Memoized operator shell context stack to narrow re-render blast radius (TB-568). */
export const OperatorShellProviders = memo(function OperatorShellProviders(props: {
  readonly children: ReactNode;
}): React.JSX.Element {
  const { children } = props;

  return (
    <OperatorNavAuthorityProvider>
      <TenantBrandCssVarsProvider>
        <SessionAiReadinessProvider>
          <ProductLineProvider>
            <WorkspaceActiveRunProvider>{children}</WorkspaceActiveRunProvider>
          </ProductLineProvider>
        </SessionAiReadinessProvider>
      </TenantBrandCssVarsProvider>
    </OperatorNavAuthorityProvider>
  );
});
