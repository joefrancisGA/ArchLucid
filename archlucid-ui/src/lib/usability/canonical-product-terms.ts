/**
 * Canonical buyer-facing product nouns — single source for UI copy sweeps (TB-273).
 *
 * Pairing (do not conflate):
 * - **Finalized review record** = immutable package locked at finalize (golden manifest).
 * - **Decision** = disposition on a finding/proposal; browsed in the Decision register.
 * Never call the package a "signed decision record" or "signed review record".
 */

/** Committed architecture output (prefer over "golden manifest" or internal "manifest" in buyer copy). */
export const SEALED_MANIFEST_LABEL = "Finalized review record";

/** @deprecated Use {@link SEALED_MANIFEST_LABEL}. Kept so existing imports keep compiling. */
export const SIGNED_MANIFEST_LABEL = SEALED_MANIFEST_LABEL;

/**
 * Disposition noun for Decision register rows and finding outcomes.
 * Not a synonym for {@link SIGNED_MANIFEST_LABEL}.
 */
export const ARCHITECTURE_DECISION_LABEL = "Decision";

/** Append-only authenticated action ledger (prefer over "audit log" in buyer nav). */
export const AUDIT_TRAIL_LABEL = "Audit trail";

/**
 * Durable buyer noun for finalized review outputs (legacy code name: review package).
 * Prefer this over "Review" alone when the package/artifacts are the subject.
 */
export const REVIEW_PACKAGE_LABEL = "Architecture package";

/** Primary workflow noun (prefer over "run" or "job" in buyer copy). */
export const ARCHITECTURE_REVIEW_LABEL = "Architecture review";

/** Evidence lineage graph surface label. */
export const EVIDENCE_TRAIL_LABEL = "Evidence graph";

/**
 * Buyer noun for the Topology assessment dimension (wire id / agent type stays Topology).
 * Prefer this over "topology" in PA-facing UI — many architects do not use that term.
 */
export const ARCHITECTURE_STRUCTURE_BUYER_LABEL = "Architecture structure";

/** Mid-sentence / lowercase form of {@link ARCHITECTURE_STRUCTURE_BUYER_LABEL}. */
export const ARCHITECTURE_STRUCTURE_BUYER_LABEL_LOWER = "architecture structure";

/**
 * Free-text intake hints for components and connections (API field remains `topologyHints`).
 */
export const ARCHITECTURE_HINTS_BUYER_LABEL = "Architecture hints";

/**
 * Buyer noun for quality-gate mode `PilotStrict` (wire id stays PilotStrict).
 * Prefer this over camelCase PilotStrict in PA-facing UI.
 */
export const STRICT_AI_QUALITY_BUYER_LABEL = "Strict AI quality checks";

/** Short mode/button label for {@link STRICT_AI_QUALITY_BUYER_LABEL}. */
export const STRICT_AI_QUALITY_MODE_BUYER_LABEL = "Strict quality";

/** Mid-sentence / lowercase form of {@link STRICT_AI_QUALITY_BUYER_LABEL}. */
export const STRICT_AI_QUALITY_BUYER_LABEL_LOWER = "strict AI quality checks";

/** Buyer label for deterministic / Simulator execution mode (wire id stays Simulator). */
export const RULE_BASED_ANALYSIS_BUYER_LABEL = "Rule-based analysis";

/** Proof-confidence chip when every agent step used rule-based analysis. */
export const RULE_BASED_ANALYSIS_ONLY_BUYER_LABEL = "Rule-based analysis only";

/** Sponsor handoff noun — prefer over "sponsor packet" or "sponsor pack" in buyer UI. */
export const SPONSOR_BRIEFING_EXPORT_LABEL = "Sponsor briefing export";

/** Artifact table section for stakeholder-facing markdown. */
export const SPONSOR_BRIEFING_LABEL = "Sponsor briefing";

/** Mid-sentence form of {@link SPONSOR_BRIEFING_EXPORT_LABEL}. */
export const SPONSOR_BRIEFING_EXPORT_LABEL_LOWER = "sponsor briefing export";

/** Approval check before finalize (prefer over "pre-commit gate" in buyer copy). */
export const APPROVAL_GATE_LABEL = "Approval check";

/** Downloadable outputs ZIP (prefer over "artifact bundle" in buyer copy). */
export const DELIVERABLES_BUNDLE_LABEL = "Deliverables bundle";

/** Buyer label for quality-gate mode `WarnOnly` (wire id stays WarnOnly). */
export const WARN_ONLY_QUALITY_MODE_BUYER_LABEL = "Warn only";
