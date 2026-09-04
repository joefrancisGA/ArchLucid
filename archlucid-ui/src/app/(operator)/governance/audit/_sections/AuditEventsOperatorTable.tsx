"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import type { CSSProperties, ReactElement } from "react";
import { useRef } from "react";

import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
} from "@/components/ui/enterprise-table";
import type { AuditEvent } from "@/lib/api";
import { AUDIT_TRAIL_OPERATOR_TABLE_COLUMN_LABELS } from "@/lib/audit-trail-page-copy";
import {
  AUDIT_EVENTS_EVENT_STICKY_CLASS,
  AUDIT_EVENTS_WHEN_STICKY_CLASS,
} from "@/lib/governance/governance-queue-sticky-identity";

import { AuditEventOperatorTableRow } from "./AuditEventOperatorTableRow";
import {
  AUDIT_TABLE_ROW_ESTIMATE_PX,
  shouldVirtualizeAuditEventsTable,
} from "./audit-events-virtualization";

export type AuditEventsOperatorTableProps = {
  readonly events: readonly AuditEvent[];
  readonly ariaLabel: string;
};

/** Operator audit log: structured table (TB-117); payload in per-row disclosure. */
export function AuditEventsOperatorTable(props: AuditEventsOperatorTableProps): ReactElement {
  const { events, ariaLabel } = props;
  const parentRef = useRef<HTMLDivElement>(null);
  const useVirtualization = shouldVirtualizeAuditEventsTable(events.length);

  const rowVirtualizer = useVirtualizer({
    count: useVirtualization ? events.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => AUDIT_TABLE_ROW_ESTIMATE_PX,
    overscan: 8,
  });

  if (!useVirtualization) {
    return (
      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <EnterpriseTable ariaLabel={ariaLabel} className="border-0">
          <EnterpriseTableHead>
            <EnterpriseTableHeadRow>
              {AUDIT_TRAIL_OPERATOR_TABLE_COLUMN_LABELS.map((columnLabel, index) => (
                <EnterpriseTableHeaderCell
                  key={columnLabel}
                  className={
                    index === 0
                      ? AUDIT_EVENTS_WHEN_STICKY_CLASS
                      : index === 1
                        ? AUDIT_EVENTS_EVENT_STICKY_CLASS
                        : undefined
                  }
                >
                  {columnLabel}
                </EnterpriseTableHeaderCell>
              ))}
            </EnterpriseTableHeadRow>
          </EnterpriseTableHead>
          <EnterpriseTableBody>
            {events.map((ev) => (
              <AuditEventOperatorTableRow key={ev.eventId} event={ev} />
            ))}
          </EnterpriseTableBody>
        </EnterpriseTable>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="max-h-[min(32rem,70vh)] overflow-auto rounded-lg border border-neutral-200 dark:border-neutral-800"
    >
      <EnterpriseTable ariaLabel={ariaLabel} className="border-0">
        <EnterpriseTableHead className="sticky top-0 z-[1] bg-al-surface-raised shadow-[0_1px_0_0_rgb(229_229_229)] dark:shadow-[0_1px_0_0_rgb(38_38_38)]">
          <EnterpriseTableHeadRow>
            {AUDIT_TRAIL_OPERATOR_TABLE_COLUMN_LABELS.map((columnLabel, index) => (
              <EnterpriseTableHeaderCell
                key={columnLabel}
                className={
                  index === 0
                    ? AUDIT_EVENTS_WHEN_STICKY_CLASS
                    : index === 1
                      ? AUDIT_EVENTS_EVENT_STICKY_CLASS
                      : undefined
                }
              >
                {columnLabel}
              </EnterpriseTableHeaderCell>
            ))}
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const ev = events[virtualRow.index];
            const rowStyle: CSSProperties = {
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualRow.start}px)`,
              display: "table",
              tableLayout: "fixed",
            };

            return (
              <AuditEventOperatorTableRow key={ev.eventId} event={ev} style={rowStyle} />
            );
          })}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </div>
  );
}
