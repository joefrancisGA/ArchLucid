import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { GOVERNANCE_DECISION_REGISTER_PATH } from "@/lib/governance/governance-route-paths";
import { DESK_IA_HELP_SEALED_VS_REGISTER_PATH } from "@/lib/desk-ia-help-sealed-vs-decision-register-route";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

/** DI-023 — help: sealed review record (package) vs decision register (ledger). */
export const DESK_IA_HELP_SEALED_VS_REGISTER_SLUG = "sealed-record-vs-decision-register" as const;

export const DESK_IA_HELP_SEALED_VS_REGISTER_TITLE =
  "Sealed review record vs decision register" as const;

export const DESK_IA_HELP_SEALED_VS_REGISTER_TOPIC_LABEL = "Sealed record vs register" as const;

export const DESK_IA_HELP_SEALED_VS_REGISTER_PAGE_SUBTITLE =
  "Package manifest vs disposition ledger — separate surfaces, separate proof." as const;

export const DESK_IA_HELP_SEALED_VS_REGISTER_CLAIM_DISCIPLINE =
  "The decision register records dispositions — it is not the sealed package manifest or ZIP export." as const;

export const DESK_IA_HELP_SEALED_VS_REGISTER_CLAIM_HEADING_ID = "help-sealed-vs-register-claim-discipline" as const;

export const DESK_IA_HELP_SEALED_VS_REGISTER_OVERVIEW =
  "A sealed review record is the finalized package for one review — findings, exports, and manifest detail. The decision register is the ledger of recorded dispositions and approvals across reviews. Open the package when you need artifacts; open the register when you need who decided what." as const;

export const DESK_IA_HELP_SEALED_VS_REGISTER_APPLICABILITY_WORKING =
  "Working governance surfaces expose both sealed review records and the decision register with honest cross-links — neither replaces the other." as const;

export const DESK_IA_HELP_SEALED_VS_REGISTER_APPLICABILITY_SECURENOW =
  "SecureNow (Security) hosts governance sealed records and decision register routes for security workflows — Architecture package language still applies to cross-product help links." as const;

export const DESK_IA_HELP_SEALED_VS_REGISTER_SEAL_PROOFS = [
  "The manifest identifies the finalized package and the artifacts included in that package.",
  "Verification compares the recorded manifest integrity data with the stored package contents.",
  "A seal proves the state of that finalized package; it does not prove that later workspace decisions are unchanged.",
] as const;

export const DESK_IA_HELP_SEALED_VS_REGISTER_ERROR_RECOVERY_HEADING = "When verification or register load fails" as const;

export const DESK_IA_HELP_SEALED_VS_REGISTER_ERROR_RECOVERY = {
  whatFailed: "Sealed record verification or decision register rows could not load in the current workspace.",
  whatIsIntact: "Stored packages and prior register rows remain on the server — load failures do not delete seals or dispositions.",
  nextStep: "Retry from the list surface, confirm workspace scope, then open troubleshooting if verification stays blocked with a visible inline reason.",
} as const;

export type DeskIaHelpSealedVsRegisterRelatedLink = {
  readonly label: string;
  readonly href: string;
};

export const DESK_IA_HELP_SEALED_VS_REGISTER_RELATED_TOPICS_HEADING_ID =
  "help-sealed-vs-register-related-topics" as const;

export const DESK_IA_HELP_SEALED_VS_REGISTER_RELATED_TOPICS_HEADING = "Related" as const;

export const DESK_IA_HELP_SEALED_VS_REGISTER_RELATED_LINKS: readonly DeskIaHelpSealedVsRegisterRelatedLink[] = [
  { label: "Decision register", href: inAppHelpHref("decision-register") },
  { label: "Sealed review records", href: SIGNED_RECORDS_LIST_PATH },
  { label: "Decision register (workspace)", href: GOVERNANCE_DECISION_REGISTER_PATH },
  { label: "Evidence trail", href: inAppHelpHref("evidence-trail") },
] as const;

export const DESK_IA_HELP_SEALED_VS_REGISTER_HELP_RETURN = {
  label: HELP_TOPIC_BREADCRUMB_HUB_LABEL,
  href: HELP_HUB_CANONICAL_PATH,
} as const;

export const DESK_IA_HELP_SEALED_VS_REGISTER_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: DESK_IA_HELP_SEALED_VS_REGISTER_CLAIM_HEADING_ID, title: "Package vs ledger" },
  { level: 2, id: "help-sealed-package-heading", title: "Sealed review record" },
  { level: 2, id: "help-decision-register-heading", title: "Decision register" },
  { level: 2, id: "help-seal-integrity-heading", title: "What a seal proves" },
  { level: 2, id: "help-sealed-vs-applicability", title: "Scope and seat applicability" },
  { level: 2, id: "help-sealed-vs-error-recovery", title: DESK_IA_HELP_SEALED_VS_REGISTER_ERROR_RECOVERY_HEADING },
  { level: 2, id: DESK_IA_HELP_SEALED_VS_REGISTER_RELATED_TOPICS_HEADING_ID, title: DESK_IA_HELP_SEALED_VS_REGISTER_RELATED_TOPICS_HEADING },
] as const;

export const DESK_IA_HELP_SEALED_VS_REGISTER_CANONICAL_PATH = DESK_IA_HELP_SEALED_VS_REGISTER_PATH;

export const DESK_IA_HELP_SEALED_VS_REGISTER_PRIMARY_ACTIONS = {
  sealedRecords: { label: "Open sealed review records", href: SIGNED_RECORDS_LIST_PATH },
  decisionRegister: { label: "Open the decision register", href: GOVERNANCE_DECISION_REGISTER_PATH },
} as const;

export const DESK_IA_HELP_SEALED_VS_REGISTER_ALIASES = [
  "sealed record",
  "signed record",
  "finalized review record",
  "decision register",
  "signed decision record",
  "package vs ledger",
] as const;
