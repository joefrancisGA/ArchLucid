"use client";

import { memo, type ReactNode } from "react";

import { OperatorNavAuthorityProvider } from "@/components/operator/OperatorNavAuthorityProvider";
import { WorkspaceActiveRunProvider } from "@/components/WorkspaceActiveRunContext";

/** Memoized operator shell context stack to narrow re-render blast radius (TB-568). */
export const OperatorShellProviders = memo(function OperatorShellProviders(props: {
  readonly children: ReactNode;
}): React.JSX.Element {
  const { children } = props;

  return (
    <OperatorNavAuthorityProvider>
      <WorkspaceActiveRunProvider>{children}</WorkspaceActiveRunProvider>
    </OperatorNavAuthorityProvider>
  );
});
