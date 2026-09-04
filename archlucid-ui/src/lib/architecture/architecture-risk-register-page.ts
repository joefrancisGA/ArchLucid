/** Architecture risk register page model surface (barrel). */

export {
  ARCHITECTURE_RISK_REGISTER_CONTAINS_COPY,
  ARCHITECTURE_RISK_REGISTER_EMPTY_BODY,
  ARCHITECTURE_RISK_REGISTER_EMPTY_TITLE,
  ARCHITECTURE_RISK_REGISTER_GLOSSARY,
  ARCHITECTURE_RISK_REGISTER_GOVERNANCE_INTRO,
  ARCHITECTURE_RISK_REGISTER_PAGE_SUBTITLE,
  ARCHITECTURE_RISK_REGISTER_PAGE_TITLE,
  ARCHITECTURE_RISK_REGISTER_POLICY_PACKS_HREF,
  GOVERNANCE_QUEUE_DISPOSITION_NONE_LABEL,
} from "./architecture-risk-register-copy";

export type { RiskRegisterFilter } from "./architecture-risk-register-filters";
export {
  governanceQueueDispositionLabel,
  matchesGovernanceFindingsRunScope,
  matchesRiskRegisterFilter,
  RISK_REGISTER_FILTER_LABELS,
  RISK_REGISTER_QUICK_FILTERS,
  RISK_REGISTER_REMEDIATED_RECENT_WINDOW_MS,
  riskRegisterFilterFromQuery,
  scopedRunIdFromQuery,
} from "./architecture-risk-register-filters";

export type { ArchitectureRiskRegisterSummary } from "./architecture-risk-register-summary";
export { computeArchitectureRiskRegisterSummary } from "./architecture-risk-register-summary";
