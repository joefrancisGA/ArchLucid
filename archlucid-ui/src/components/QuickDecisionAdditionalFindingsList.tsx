"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, type ReactElement } from "react";

import { cn } from "@/lib/utils";

const QUICK_DECISION_ADDITIONAL_FINDINGS_VIRTUALIZE_MIN = 12;
const QUICK_DECISION_ADDITIONAL_FINDING_ROW_ESTIMATE_PX = 96;

export type QuickDecisionAdditionalFindingsListProps<TFinding> = {
  readonly findings: readonly TFinding[];
  readonly renderFinding: (finding: TFinding) => ReactElement;
};

export function QuickDecisionAdditionalFindingsList<TFinding>({
  findings,
  renderFinding,
}: QuickDecisionAdditionalFindingsListProps<TFinding>): ReactElement {
  const parentRef = useRef<HTMLDivElement>(null);
  const shouldVirtualize = findings.length >= QUICK_DECISION_ADDITIONAL_FINDINGS_VIRTUALIZE_MIN;

  const virtualizer = useVirtualizer({
    count: findings.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => QUICK_DECISION_ADDITIONAL_FINDING_ROW_ESTIMATE_PX,
    enabled: shouldVirtualize,
  });

  if (!shouldVirtualize) {
    return (
      <ul className="m-0 list-none space-y-2 p-0">
        {findings.map((finding) => renderFinding(finding))}
      </ul>
    );
  }

  return (
    <div
      ref={parentRef}
      className="max-h-[min(60vh,640px)] overflow-y-auto"
      data-testid="quick-decision-additional-findings-virtual-list"
    >
      <ul
        className="relative m-0 list-none p-0"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const finding = findings[virtualRow.index];

          return (
            <li
              key={virtualRow.key}
              className={cn("absolute left-0 top-0 w-full list-none pl-0")}
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              {renderFinding(finding)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
