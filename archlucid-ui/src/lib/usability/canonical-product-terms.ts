/**
 * Canonical buyer-facing product nouns — single source for UI copy sweeps (TB-273).
 *
 * Pairing (do not conflate):
 * - **Signed review record** = immutable package locked at finalize (golden manifest).
 * - **Decision** = disposition on a finding/proposal; browsed in the Decision register.
 * Never call the package a "signed decision record".
 */

/** Committed architecture output (prefer over "golden manifest" or internal "manifest" in buyer copy). */
export const SIGNED_MANIFEST_LABEL = "Signed review record";

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
