export {
  OPERATOR_LIST_VIRTUALIZE_MIN_ROWS as AUDIT_EVENTS_VIRTUALIZE_MIN_ROWS,
  shouldVirtualizeOperatorList as shouldVirtualizeAuditEventsTable,
} from "@/lib/operator/operator-list-virtualization";

/** Estimated row height for audit table virtualization (compact operator rows). */
export const AUDIT_TABLE_ROW_ESTIMATE_PX = 72;
