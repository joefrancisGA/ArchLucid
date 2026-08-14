import type { ReactNode } from "react";

import { isUiAuthorityThemePilotSurfacesEnabled } from "@/lib/ui-authority-theme-pilot";

export type AuthorityThemePilotScopeProps = {
  readonly children: ReactNode;
  readonly testId?: string;
};

/** Applies charcoal authority tokens to a bounded subtree without changing the global operator shell default. */
export function AuthorityThemePilotScope(props: AuthorityThemePilotScopeProps) {
  const { children, testId = "authority-theme-pilot-scope" } = props;

  if (!isUiAuthorityThemePilotSurfacesEnabled()) {
    return <>{children}</>;
  }

  return (
    <div className="contents" data-al-authority-theme="charcoal" data-testid={testId}>
      {children}
    </div>
  );
}
