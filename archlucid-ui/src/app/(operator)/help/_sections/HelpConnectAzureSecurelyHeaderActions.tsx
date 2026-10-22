"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

/** Header actions for `/help/cloud-connections/azure` (HC). */
export function HelpConnectAzureSecurelyHeaderActions(): React.JSX.Element | null {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (buyerPolishedShell) {
    return null;
  }

  return null;
}
