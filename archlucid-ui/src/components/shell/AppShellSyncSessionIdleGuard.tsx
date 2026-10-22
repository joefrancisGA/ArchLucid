"use client";

import { SessionIdleTimeoutGuard } from "@/components/SessionIdleTimeoutGuard";

/** Sync session idle guard — security must not wait on deferred hub chunks (PT-09). */
export function AppShellSyncSessionIdleGuard(): React.JSX.Element {
  return <SessionIdleTimeoutGuard />;
}
