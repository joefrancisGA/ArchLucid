"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { useIsLiveApiActive } from "@/hooks/useIsLiveApiActive";
import {
  BUYER_CTO_DEMO_DATA_SOURCE_LIVE_LABEL,
  BUYER_SIMULATOR_TRUST_BADGE_LABEL,
  BUYER_SIMULATOR_TRUST_BADGE_TOOLTIP,
} from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

export type CtoDemoSimulatorTrustBadgeProps = {
  readonly className?: string;
};

/** Persistent simulator-vs-live trust indicator on buyer golden-journey outcome surfaces. */
export function CtoDemoSimulatorTrustBadge(props: CtoDemoSimulatorTrustBadgeProps): React.JSX.Element | null {
  const { className } = props;
  const isLiveApi = useIsLiveApiActive();

  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  if (isLiveApi === null) {
    return (
      <span
        className={cn("inline-flex items-center rounded-full border border-neutral-200 px-2 py-0.5 font-medium text-neutral-500 dark:border-neutral-700 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper,
          OPERATOR_TYPOGRAPHY.badge,
          className,
        )}
        data-testid="cto-demo-simulator-trust-badge-pending"
      >
        Checking data source…
      </span>
    );
  }

  if (isLiveApi) {
    return (
      <span
        className={cn("inline-flex items-center gap-1", className)}
        data-testid="cto-demo-simulator-trust-badge-live"
      >
        <span
          className={cn("inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 font-medium text-teal-900 dark:border-teal-900/50 dark:bg-teal-950/40 dark:text-teal-100", OPERATOR_TYPOGRAPHY.helper,
            OPERATOR_TYPOGRAPHY.badge,
          )}
        >
          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-teal-600 dark:bg-teal-400" />
          {BUYER_CTO_DEMO_DATA_SOURCE_LIVE_LABEL}
        </span>
        <FieldHelpTooltip
          label="Live data source"
          hint="Live API — findings were produced against the connected backend."
        />
      </span>
    );
  }

  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      data-testid="cto-demo-simulator-trust-badge"
    >
      <span
        className={cn("inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper,
          OPERATOR_TYPOGRAPHY.badge,
        )}
      >
        {BUYER_SIMULATOR_TRUST_BADGE_LABEL}
      </span>
      <FieldHelpTooltip
        label="Rule-based analysis"
        hint={BUYER_SIMULATOR_TRUST_BADGE_TOOLTIP}
      />
    </span>
  );
}
