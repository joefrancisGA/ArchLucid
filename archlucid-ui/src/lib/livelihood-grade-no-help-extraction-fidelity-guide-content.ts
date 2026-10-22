/** LN-034 — help: extraction fidelity is auditable (ESI originals, NotVerifiable diagrams). */
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { DECISION_GRADE_PROVENANCE_ADR_0082_RELATIVE_PATH } from "@/lib/findings/decision-grade-provenance-adr-inventory";
import { LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SAFETY_HEADING_ID } from "@/lib/livelihood-grade-no-help-extraction-fidelity-evidence-copy";
import { LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_PATH } from "@/lib/livelihood-grade-no-help-route";
import { LIVELIHOOD_GRADE_NO_SEMANTIC_NOT_COMMIT_GATE_LINE } from "@/lib/livelihood-grade-no-semantic-not-commit-gate";
import { EXTRACTION_FIDELITY_GATE_MESSAGE } from "@/lib/review-quality/finalize-quality-scorecard";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SLUG = "extraction-fidelity" as const;

export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_TITLE = "Extraction fidelity";

export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_PAGE_SUBTITLE =
  "Working help — trace extraction errors before sponsor proof (LN-034 / ADR 0082)." as const;

export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_OVERVIEW_LEAD =
  "Errors enter when intake, extraction, and finding emission disagree with stored sources. Use Evidence source inspect for originals, treat pixel-only diagram shapes as NotVerifiable until passage-backed, and expect decision-grade rows to fail closed without Kind A/B provenance." as const;

/** @deprecated Use {@link LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_OVERVIEW_LEAD} — kept for drift guards. */
export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_OVERVIEW =
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_OVERVIEW_LEAD;

export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SAFETY_TITLE =
  "Open stored originals before you trust extraction" as const;

export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SAFETY_BODY =
  "Evidence-backed findings must point at stored sources — not model paraphrase alone. On the review Evidence tab, use Inspect stored evidence for Open and Download on submitted files. Citation-only rows that were never stored cannot substitute for originals. Pixel-only diagram intake emits verificationStatus NotVerifiable — those shapes cannot mint decision-grade resources silently." as const;

export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SAFETY_STATUS_TAG =
  "Source inspect required" as const;

export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_APPLICABILITY_WORKING =
  "Working Architecture seats run extraction fidelity and structural provenance gates on Career finalize, export, and sponsor package paths. Portfolio headline savings stay disposition-aware and deduplicated by FindingId — per-system rows do not sum to the headline." as const;

export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_APPLICABILITY_GUIDED =
  "Guided, demo, and trial seats may show teaching chrome and sample scope. Extraction honesty rules still apply when you move to Working — do not treat practice labeling as sponsor proof." as const;

export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_APPLICABILITY_SECURENOW =
  "The SecureNow (Security) product shell does not run Architecture Working Career extraction gates — this topic applies to Architecture review workflows and in-app Architecture help routes only." as const;

export type LivelihoodGradeNoHelpExtractionFidelityEnforcementSurface = {
  readonly name: string;
  readonly description: string;
  readonly href: string;
};

export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_ENFORCEMENT_SURFACES: readonly LivelihoodGradeNoHelpExtractionFidelityEnforcementSurface[] =
  [
    {
      name: "Decision-grade provenance validator",
      description:
        "getDecisionGradeFindingProvenanceViolations — Career artifact honesty blocks finalize and export when decision-grade rows lack Kind A/B structural provenance (ADR 0082).",
      href: inAppHelpHref("findings"),
    },
    {
      name: "Sponsor package extraction fidelity gate",
      description: `ReviewPackageSponsorHandoffStrip — ${EXTRACTION_FIDELITY_GATE_MESSAGE}`,
      href: inAppHelpHref("review-packages"),
    },
    {
      name: "Evidence source inspect (ESI)",
      description:
        "Stored evidence Open and Download on the review Evidence tab — originals for audit, not sealed package ZIP alone.",
      href: inAppHelpHref("inspect-stored-evidence"),
    },
    {
      name: "Pixel diagram NotVerifiable intake",
      description:
        "Intake emits application/vnd.archlucid.diagram+json stubs with verificationStatus NotVerifiable for PNG and similar pixel uploads.",
      href: inAppHelpHref("evidence-intake"),
    },
  ] as const;

export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_RULES_HEADING =
  "Extraction honesty rules (LN-034)" as const;

export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_RULES: readonly string[] = [
  "Evidence-backed findings must cite stored sources — inspect originals on the review before you disposition decision-grade rows.",
  "Heuristic LLM recommendations stay labeled until passage-backed; trust labels distinguish heuristic vs evidence-backed bands.",
  "NotVerifiable diagram shapes cannot mint decision-grade resources silently — topology follow-on is explicit, not assumed from pixels.",
  "Architect restatement cannot mint hard infeasible or decision-grade claims without citation (LN-036).",
  "No second evidence collector on this path — reuse Evidence source inspect and intake surfaces.",
  "OCR is not default-on for architecture intake; export Visio diagrams to PDF or PNG before upload when native formats are unsupported.",
  LIVELIHOOD_GRADE_NO_SEMANTIC_NOT_COMMIT_GATE_LINE,
] as const;

export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_ADR_REFERENCES = [
  { id: "0082", path: DECISION_GRADE_PROVENANCE_ADR_0082_RELATIVE_PATH },
] as const;

export type LivelihoodGradeNoHelpExtractionFidelityRelatedLink = {
  readonly label: string;
  readonly href: string;
};

export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_RELATED_TOPICS_HEADING_ID =
  "help-extraction-fidelity-related-topics" as const;

export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_RELATED_TOPICS_HEADING = "Related topics" as const;

export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_RELATED_TOPICS: readonly LivelihoodGradeNoHelpExtractionFidelityRelatedLink[] =
  [
    { label: "Inspect stored evidence on a review", href: inAppHelpHref("inspect-stored-evidence") },
    { label: "Findings", href: inAppHelpHref("findings") },
    { label: "Evidence trail", href: inAppHelpHref("evidence-trail") },
    { label: "Hard vs soft infeasibility", href: inAppHelpHref("false-hard-infeasibility") },
    { label: "Architecture desk — system, not job", href: inAppHelpHref("architecture-desk") },
  ] as const;

export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_HELP_RETURN = {
  label: HELP_TOPIC_BREADCRUMB_HUB_LABEL,
  href: HELP_HUB_CANONICAL_PATH,
} as const;

export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SAFETY_HEADING_ID, title: LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SAFETY_TITLE },
  { level: 2, id: "help-extraction-fidelity-applicability", title: "Scope and seat applicability" },
  { level: 2, id: "help-extraction-fidelity-provenance-gaps", title: "Named provenance gaps" },
  { level: 2, id: "help-extraction-fidelity-enforcement-surfaces", title: "Enforcement surfaces" },
  { level: 2, id: "help-extraction-fidelity-extraction-rules", title: LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_RULES_HEADING },
  { level: 2, id: "help-extraction-fidelity-adr-mapping", title: "ADR 0082 and LN-034" },
  { level: 2, id: "help-extraction-fidelity-where-to-go-next", title: "Where to go next" },
  {
    level: 2,
    id: LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_RELATED_TOPICS_HEADING_ID,
    title: LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_RELATED_TOPICS_HEADING,
  },
] as const;

export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_CANONICAL_PATH =
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_PATH;

/** Drift guard — in-app help must not deep-link GitHub blob URLs. */
export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_FORBIDDEN_LINK_MARKERS = ["github.com", "/blob/"] as const;
