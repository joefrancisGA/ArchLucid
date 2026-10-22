/** Drift guards for Tier 2 #8 decision delta panel on committed review detail. */

export const RUN_DETAIL_DECISION_DELTA_PANEL_TEST_ID = "run-detail-decision-delta-panel";

export const RUN_DETAIL_DECISION_DELTA_ROW_TEST_ID = "run-detail-decision-delta-row";

export const RUN_DETAIL_DECISION_DELTA_REQUIRED_PAGE_COMPONENTS = [
  "RunDetailDecisionDeltaDeferred",
  "RunDetailDecisionDeltaSkeleton",
] as const;

export const RUN_DETAIL_DECISION_DELTA_REQUIRED_DEFERRED_COMPONENTS = [
  "RunDetailDecisionDeltaPanel",
] as const;

export const RUN_DETAIL_DECISION_DELTA_REQUIRED_LIB_EXPORTS = [
  "RUN_DETAIL_DECISION_DELTA_TOP_N",
  "resolveRunDetailDecisionDeltaView",
  "selectMaterialDecisionDeltaFindings",
] as const;
