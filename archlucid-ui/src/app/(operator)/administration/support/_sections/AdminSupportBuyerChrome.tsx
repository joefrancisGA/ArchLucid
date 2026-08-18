"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { AdminSupportClaimOrientationStrip } from "./AdminSupportClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources above the support workspace body (ASX). */
export function AdminSupportBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="admin-support-orientation-top">
      <AdminSupportClaimOrientationStrip />
    </div>
  );
}
