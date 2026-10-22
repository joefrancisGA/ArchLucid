import { cn } from "@/lib/utils";
import type { ReactElement, ReactNode } from "react";

import { OPERATOR_LIVE_PREVIEW_READINESS_RAIL_KIND } from "@/lib/operator/operator-live-preview-readiness-rail";

export type OperatorLivePreviewPinLayoutProps = {
  readonly pinRail: boolean;
  readonly testId: string;
  readonly primary: ReactNode;
  readonly aside: ReactNode;
};

/**
 * TB-1574 schedule/simulation form layout — primary column plus optional pinned live-preview rail.
 */
export function OperatorLivePreviewPinLayout(props: OperatorLivePreviewPinLayoutProps): ReactElement {
  return (
    <div
      className={cn(
        "grid gap-4",
        props.pinRail && "xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,1fr)]",
      )}
      data-testid={props.testId}
      data-rail-kind={OPERATOR_LIVE_PREVIEW_READINESS_RAIL_KIND}
      data-live-rail-pinned={props.pinRail ? "true" : "false"}
    >
      <div className="space-y-4">{props.primary}</div>
      <aside className={cn("space-y-4", !props.pinRail && "mt-0")}>{props.aside}</aside>
    </div>
  );
}
