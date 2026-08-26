/**
 * Short, sober copy for Enterprise Controls context (nav, key pages, and selected empty-state / card-description strings).
 * Aligned with docs/OPERATOR_DECISION_GUIDE.md (default rule, §2 “Move to Enterprise Controls”) and
 * docs/COMMERCIAL_BOUNDARY_HARDENING_SEQUENCE.md (Stage 1 — role clarity without commercializing the wedge).
 * Keep wording responsibility-based, not permission-jargon.
 *
 * **Rank pairing:** several `*Reader*` / `*Operator*` pairs are chosen in pages via `useOperateCapability()` or
 * `useNavCallerAuthorityRank()` vs `AUTHORITY_RANK.ExecuteAuthority` — keep thresholds aligned with `nav-authority.ts`.
 */

/**
 * Shared one-liner under alert-tooling “Change configuration” sections — replaces repeating “Configuration surface…”
 * on every page (`alert-rules`, `alert-routing`, `alert-tuning`, `composite-alert-rules`).
 */

export const policyPacksShowDiffButtonLabelReaderRank = "Show diff (inspect)";


export const policyPacksPageLeadOperator =
  "Review inventory and effective policy first; publish or assign when your role allows.";


export const policyPacksPageLeadReader =
  "Inspect registered packs and combined policy content for this scope (read-only where your role limits changes).";


export const policyPacksPageLeadOperatorBuyerPolished =
  "Review which rules are active for this workspace first; your role controls whether you can publish or assign packs.";


export const policyPacksPageLeadReaderBuyerPolished =
  "See which compliance rules apply to architecture reviews in this workspace. Changes require the appropriate role in your organization.";


export const policyPacksOutcomeBannerLine =
  "Versions and assigns packs for this scope; enforcement applies through governance resolution and review finalizatio — ot from this page alone.";


export const policyPacksDeltaDemoBannerLine =
  "Demo the policy moat: same committed review, stricter pack enforcement, different pre-commit gate outcome — see the policy-pack delta demo script in product documentation.";


export const policyPacksCurrentPacksHeadingOperator = "Current policy packs";


export const policyPacksCurrentPacksHeadingReader = "Current policy packs (inspect)";


export const policyPacksPackContentHeadingOperator = "Pack content";


export const policyPacksPackContentHeadingReader = "Pack content (inspect)";


export const policyPacksRefreshAssistReaderLine =
  "Refresh reloads inventory and effective policy (GET only; no lifecycle writes).";


export const policyPacksRefreshAssistReaderLineBuyerPolished =
  "Refresh updates the pack list and the combined rules shown for this workspace (read-only).";


export const policyPacksEmptyScopeReaderLine =
  "None in scope yet. Inspect when data exists; create and lifecycle need elevated permissions on the API.";


export const policyPacksEmptyScopeOperatorLine = "No packs yet.";


export const policyPacksPublishedVersionsEmptyReaderLine =
  "No published versions yet. Inspect here; publish needs elevated permissions on the API.";


export const policyPacksPublishedVersionsEmptyOperatorLine =
  "No published versions loaded for this pack yet.";


export const policyPacksLifecycleLeadReaderLine = "Lifecycle changes need elevated permissions.";


export const policyPacksCreatePackButtonLabelReaderRank = "Create pack (architect permission)";


export const policyPacksPublishButtonLabelReaderRank = "Publish (architect permission)";


export const policyPacksAssignButtonLabelReaderRank = "Assign (architect permission)";


export const policyPacksCompareVersionsIntroOperator =
  "Pick two versions for a JSON path diff.";


export const policyPacksCompareVersionsIntroReader =
  "Read-only diff; publish/assign stay under Lifecycle (Execute+).";


export const policyPacksCompareVersionsReaderSubline =
  "Diff is inspect-only; writes in Lifecycle.";


export const policyPacksShowDiffButtonReaderTitle =
  "Read-only diff between versions; publish and assign need Execute+ in Lifecycle (API).";


export const policyPacksHideDiffButtonTitle = "Close diff view (client only; no API write).";


export const policyPacksPackSelectReaderTitle =
  "Switch pack to inspect versions and JSON; publish, assign, and create need Execute+ below (API).";

