"use client";

import { useEffect, useState } from "react";

import { StatusTag } from "@/components/StatusTag";
import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  formatTroubleshootingCheckedAt,
  resolveTroubleshootingPlatformStatus,
  type TroubleshootingPlatformStatus,
} from "@/lib/troubleshooting-platform-status";
import { cn } from "@/lib/utils";

type PlatformStatusState = {
  readonly status: TroubleshootingPlatformStatus;
  readonly checkedAtLabel: string | null;
};

/** Inline platform readiness for troubleshooting Start here (anonymous `/health/ready`). */
export function TroubleshootingStartHerePlatformStatus(): React.JSX.Element {
  const [state, setState] = useState<PlatformStatusState>({
    status: { kind: "neutral", label: "Checking platform status" },
    checkedAtLabel: null,
  });

  useEffect(() => {
    let canceled = false;

    void fetchHealthReadySummary().then((body) => {
      if (canceled) {
        return;
      }

      const checkedAt = new Date();

      setState({
        status: resolveTroubleshootingPlatformStatus(body),
        checkedAtLabel: formatTroubleshootingCheckedAt(checkedAt),
      });
    });

    return () => {
      canceled = true;
    };
  }, []);

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="troubleshooting-platform-status"
    >
      <StatusTag kind={state.status.kind} label={state.status.label} />
      {state.checkedAtLabel !== null ? (
        <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {state.checkedAtLabel}
        </span>
      ) : null}
    </div>
  );
}
