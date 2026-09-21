/** ESI-08 — help: open and download submitted evidence files on the review. */
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { WORKING_BIND_TOOL_REQUIRES_ARCHITECTURE_REASON } from "@/lib/apply-working-bind-tool-nav-gate";
import {
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SAFETY_HEADING_ID,
} from "@/lib/evidence-source-inspect-help-stored-evidence-evidence-copy";
import { EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PATH } from "@/lib/evidence-source-inspect-help-stored-evidence-route";
import { EVIDENCE_SOURCE_INSPECT_PREVIEW_DIALOG_HONESTY } from "@/lib/evidence-source-inspect-sealed-honesty";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SLUG = "inspect-stored-evidence" as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TITLE =
  "Inspect stored evidence on a review" as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PAGE_SUBTITLE =
  "Working help — preview or download submitted source files on the review Evidence tab (ESI-08), not the sealed package ZIP." as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_OVERVIEW_LEAD =
  "After intake stores originals with the review, open the architecture package, go to the Evidence tab, and use Submitted evidence to reach stored catalog rows. Preview when the client policy allows inline display; otherwise download only. Citation-only inventory rows never expose Download — they were never persisted as files." as const;

/** @deprecated Use {@link EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_OVERVIEW_LEAD} — kept for drift guards. */
export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_OVERVIEW =
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_OVERVIEW_LEAD;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SAFETY_TITLE =
  "Submitted evidence is not the sealed review record" as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SAFETY_BODY =
  `${EVIDENCE_SOURCE_INSPECT_PREVIEW_DIALOG_HONESTY} The sealed package ZIP and manifest exports live on sealed review record surfaces — do not treat a downloaded PNG, PDF, or text source as proof of seal integrity.` as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SAFETY_STATUS_TAG =
  "Not sealed package proof" as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CONTROLS_HEADING =
  "Open vs Download on stored-file rows" as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CONTROLS_BODY =
  "Stored-file rows render the file name as the preview control when inline preview is allowed — there is no separate Open button. Click the file name to open the preview dialog for images, text, Markdown, Mermaid, or PDF when safe. Use Download to save a copy of the submitted source bytes. When preview is not allowed, the file name is plain text and Download is the only action." as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_DOWNLOAD_ONLY_HEADING =
  "Download-only and unsafe inline types" as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_DOWNLOAD_ONLY_BODY =
  "StoredEvidenceFileContentSafety mirrors server preview policy: HTML, SVG, and other unsafe inline types resolve to download-only. Unknown or binary content types also stay download-only — the UI does not attempt inline preview for those rows." as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CITATION_HEADING =
  "Citation-only rows" as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CITATION_BODY =
  "Inventory rows with inventoryKind citation reference external or passage-backed evidence that was never stored in dbo.RunStoredEvidenceFiles. They do not render file-name preview or Download — inspect stored originals on stored-file rows instead." as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_AUDIT_HEADING =
  "Authority and audit recording" as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_AUDIT_BODY =
  "ReviewStoredEvidenceFilesController requires ReadAuthority on GET /v1/architecture/review/{runId}/evidence/files/{evidenceItemId}. Successful stream or download requests emit EvidenceSourceOpened on the tenant audit trail — not a sealed-record export label and not a substitute for sealed package verification." as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PREVIEW_KEYBOARD_HEADING =
  "Preview dialog keyboard behavior" as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PREVIEW_KEYBOARD_BODY =
  "The submitted evidence preview dialog closes on Escape and returns focus to the file-name control that opened it. Use the dialog Download button to save a copy while previewing — the same sealed-record denial applies inside the dialog." as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_APPLICABILITY_WORKING =
  "Working Architecture seats show Submitted evidence on in-flight and committed reviews when your role has ReadAuthority for the package. Portfolio headline savings stay disposition-aware and deduplicated by FindingId — per-system rows do not sum to the headline." as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_APPLICABILITY_GUIDED =
  "Guided, demo, and trial seats may show teaching chrome and sample scope. Stored-file inspect still applies when originals are persisted — do not treat practice labeling as sponsor proof." as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_APPLICABILITY_SECURENOW =
  "The SecureNow (Security) product shell does not host Architecture review Evidence tabs — this topic applies to Architecture review workflows and in-app Architecture help routes only." as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_RECORD_PRACTICE_HEADING =
  "Record vs Practice on stored evidence" as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_RECORD_PRACTICE_BODY =
  "Record (career) and Practice (rehearsal) both persist submitted source files on the review when intake retained originals. Practice labeling stays explicit on exports — downloaded sources from a Practice review are not sealed-record proof. Use Record paths when sponsors need career-grade evidence." as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SCOPE_NAV_HEADING =
  "Workspace scope and gated navigation" as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SCOPE_NAV_BODY =
  `Packages hidden by restrict-to-shares inside your tenant never appear in review lists — that is workspace sharing policy, not Evidence source inspect. When Working bind tools stay disabled until an architecture desk is open, navigation uses this visible reason: ${WORKING_BIND_TOOL_REQUIRES_ARCHITECTURE_REASON}` as const;

export type EvidenceSourceInspectHelpStoredEvidenceEnforcementSurface = {
  readonly name: string;
  readonly description: string;
  readonly href: string;
};

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_ENFORCEMENT_SURFACES: readonly EvidenceSourceInspectHelpStoredEvidenceEnforcementSurface[] =
  [
    {
      name: "Review stored evidence files API",
      description:
        "ReviewStoredEvidenceFilesController — authorized GET stream for catalog evidenceItemId rows (ReadAuthority).",
      href: inAppHelpHref("api-contracts"),
    },
    {
      name: "Preview policy (client)",
      description: "run-stored-evidence-preview-policy.ts — StoredEvidenceFileContentSafety.resolvePreviewKind fail-closed.",
      href: inAppHelpHref("inspect-stored-evidence"),
    },
    {
      name: "Evidence tab inventory",
      description:
        "RunDetailEvidenceInventorySection — stored-file rows expose preview + Download; citation rows do not.",
      href: REVIEWS_LIST_PATH,
    },
    {
      name: "Extraction fidelity (LN-034)",
      description: "Decision-grade findings still require Kind A/B provenance — inspect originals before disposition.",
      href: inAppHelpHref("extraction-fidelity"),
    },
  ] as const;

export type EvidenceSourceInspectHelpStoredEvidencePurposeLink = {
  readonly label: string;
  readonly href: string;
  readonly description: string;
};

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PURPOSE_LINKS: readonly EvidenceSourceInspectHelpStoredEvidencePurposeLink[] =
  [
    {
      label: "Evidence intake",
      href: inAppHelpHref("evidence-intake"),
      description: "Upload and verify attachments before finalize — then inspect stored files on the review.",
    },
    {
      label: "Architecture reviews",
      href: REVIEWS_LIST_PATH,
      description: "Open a package Evidence tab to reach Submitted evidence controls.",
    },
    {
      label: "Sealed review record vs decision register",
      href: inAppHelpHref("sealed-record-vs-decision-register"),
      description: "Package manifest exports are not the same as downloading a submitted PNG or PDF source.",
    },
    {
      label: "Architecture sharing inside your tenant",
      href: inAppHelpHref("architecture-sharing"),
      description: "Restrict-to-shares hides packages from unshared workspace members — lists stay tenant-scoped.",
    },
  ] as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PRIMARY_ACTION = {
  label: "Open architecture reviews",
  href: REVIEWS_LIST_PATH,
  testId: "help-inspect-stored-evidence-open-reviews",
} as const;

export type EvidenceSourceInspectHelpStoredEvidenceRelatedLink = {
  readonly label: string;
  readonly href: string;
};

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_RELATED_TOPICS_HEADING_ID =
  "help-inspect-stored-evidence-related-topics" as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_RELATED_TOPICS_HEADING = "Related topics" as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_RELATED_TOPICS: readonly EvidenceSourceInspectHelpStoredEvidenceRelatedLink[] =
  [
    { label: "Evidence trail", href: inAppHelpHref("evidence-trail") },
    { label: "Findings", href: inAppHelpHref("findings") },
    { label: "Architecture packages", href: inAppHelpHref("review-packages") },
    { label: "Record vs Practice on the Working desk", href: inAppHelpHref("career-vs-rehearsal") },
    { label: "Search review evidence", href: inAppHelpHref("search-review-evidence") },
  ] as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_HELP_RETURN = {
  label: HELP_TOPIC_BREADCRUMB_HUB_LABEL,
  href: HELP_HUB_CANONICAL_PATH,
} as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  {
    level: 2,
    id: EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SAFETY_HEADING_ID,
    title: EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SAFETY_TITLE,
  },
  { level: 2, id: "help-inspect-stored-evidence-applicability", title: "Scope and seat applicability" },
  {
    level: 2,
    id: "help-inspect-stored-evidence-record-practice",
    title: EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_RECORD_PRACTICE_HEADING,
  },
  {
    level: 2,
    id: "help-inspect-stored-evidence-controls",
    title: EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CONTROLS_HEADING,
  },
  {
    level: 2,
    id: "help-inspect-stored-evidence-download-only",
    title: EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_DOWNLOAD_ONLY_HEADING,
  },
  {
    level: 2,
    id: "help-inspect-stored-evidence-citation-only",
    title: EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CITATION_HEADING,
  },
  {
    level: 2,
    id: "help-inspect-stored-evidence-audit",
    title: EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_AUDIT_HEADING,
  },
  {
    level: 2,
    id: "help-inspect-stored-evidence-preview-keyboard",
    title: EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PREVIEW_KEYBOARD_HEADING,
  },
  {
    level: 2,
    id: "help-inspect-stored-evidence-scope-nav",
    title: EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SCOPE_NAV_HEADING,
  },
  {
    level: 2,
    id: "help-inspect-stored-evidence-enforcement-surfaces",
    title: "Enforcement surfaces",
  },
  {
    level: 2,
    id: "help-inspect-stored-evidence-purpose-links",
    title: "Purpose-specific navigation links",
  },
  { level: 2, id: "help-inspect-stored-evidence-where-to-go-next", title: "Where to go next" },
  {
    level: 2,
    id: EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_RELATED_TOPICS_HEADING_ID,
    title: EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_RELATED_TOPICS_HEADING,
  },
] as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CANONICAL_PATH =
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PATH;

/** Drift guard — in-app help must not deep-link GitHub blob URLs. */
export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_FORBIDDEN_LINK_MARKERS = [
  "github.com",
  "/blob/",
] as const;
