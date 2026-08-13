/** Estimated alert card height for inbox virtualization (TB-935). */
export const ALERTS_INBOX_CARD_ROW_ESTIMATE_PX = 168;

export {
  OPERATOR_LIST_VIRTUALIZE_MIN_ROWS as ALERTS_INBOX_VIRTUALIZE_MIN_ROWS,
  shouldVirtualizeOperatorList as shouldVirtualizeAlertsInboxList,
} from "@/lib/operator/operator-list-virtualization";
