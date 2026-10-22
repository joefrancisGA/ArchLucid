"use client";

import { AccountSecurityPageShell } from "./AccountSecurityPageShell";
import { useAccountSecurityPage } from "./use-account-security-page";
import { ACCOUNT_SECURITY_REMOVE_WARNING } from "./AccountSecurityRemoveDialog";

export function AccountSecurityPageClient() {
  const controller = useAccountSecurityPage();

  return <AccountSecurityPageShell controller={controller} />;
}

// Re-export for tests that previously asserted on window.confirm copy.
export { ACCOUNT_SECURITY_REMOVE_WARNING };
