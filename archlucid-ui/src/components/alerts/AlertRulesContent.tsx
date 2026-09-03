"use client";

import { AlertRulesContentTableShell } from "@/components/alerts/AlertRulesContentTableShell";
import { useAlertRulesContentState } from "@/components/alerts/use-alert-rules-content-state";

export function AlertRulesContent() {
  const model = useAlertRulesContentState();

  return <AlertRulesContentTableShell {...model} />;
}
