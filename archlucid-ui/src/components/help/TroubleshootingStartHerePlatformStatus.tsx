"use client";

import { StatusTag } from "@/components/StatusTag";
import { useHealthReadySummaryQuery } from "@/hooks/use-health-ready-summary-query";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  formatTroubleshootingCheckedAt,
  resolveTroubleshootingPlatformStatus,
} from "@/lib/troubleshooting-platform-status";
import { cn } from "@/lib/utils";

/** Inline platform readiness for troubleshooting Start here (anonymous `/health/ready`). */
export function TroubleshootingStartHerePlatformStatus(): React.JSX.Element {
  const { data, dataUpdatedAt, isPending } = useHealthReadySummaryQuery();

  const status = isPending
    ? { kind: "neutral" as const, label: "Checking platform status" }
    : resolveTroubleshootingPlatformStatus(data ?? null);

  const checkedAtLabel =
    dataUpdatedAt > 0 ? formatTroubleshootingCheckedAt(new Date(dataUpdatedAt)) : null;

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="troubleshooting-platform-status"
    >
      <StatusTag kind={status.kind} label={status.label} />
      {checkedAtLabel !== null ? (
        <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {checkedAtLabel}
        </span>
      ) : null}
    </div>
  );
}
