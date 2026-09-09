/**
 * AS-002 — shrink-only inventory of wizard-accepted and diagram file kinds across
 * intake context builders, authority context ingestion, and ESI catalog lanes.
 *
 * SoT for AS-038 ratchets and later architecture-spine prompts. No production behavior change.
 */

export type ArchitectureInputTodayLane =
  | "drop"
  | "extract-text"
  | "inline-text"
  | "pixel-stub"
  | "store-only"
  | "analyze"
  | "separate-ingest"
  | "structured-parse";

export type ArchitectureInputOwnerStatus = "asOwned" | "asDeferred" | "shipped";

/** How ESI rows classify inspectable bytes vs citation-only pointers today. */
export type ArchitectureInputEsiCatalogKind =
  | "stored-file"
  | "citation-only"
  | "not-applicable";

export type ArchitectureInputKindRow = {
  readonly id: string;
  readonly extensions: readonly string[];
  readonly mimeTypes: readonly string[];
  /** Repo-relative paths that define today's behavior for this row. */
  readonly sourceRoots: readonly string[];
  readonly wizardAccepts: boolean;
  readonly intakeContextBuilderToday: ArchitectureInputTodayLane;
  readonly authorityContextIngestionToday: ArchitectureInputTodayLane;
  readonly esiCatalogToday: ArchitectureInputEsiCatalogKind;
  /** True when the authority decide path silently omits this kind today. */
  readonly droppedFromAuthority: boolean;
  readonly status: ArchitectureInputOwnerStatus;
  readonly ownerPrompt: string;
  readonly notes: string;
};

const INTAKE_CONTEXT_BUILDER_ROOT = "archlucid-ui/src/lib/intake-context-documents-from-files.ts";

const READABLE_TEXT_ROOT = "archlucid-ui/src/lib/evidence-readable-text.ts";

const WIZARD_ACCEPT_ROOT = "archlucid-ui/src/lib/evidence-upload-accepted-formats.ts";

const AUTHORITY_MIME_ROOT = "ArchLucid.ContextIngestion/SupportedContextDocumentContentTypes.cs";

const ESI_INVENTORY_ROOT = "archlucid-ui/src/lib/runs/run-detail-evidence-inventory.ts";

const WIZARD_UPLOAD_ROOT = "archlucid-ui/src/lib/wizard-pending-evidence-upload.ts";

const API_CONTRACTS_ROOT = "docs/library/API_CONTRACTS.md";

/** Canonical rows — extend only with an owner prompt and AS-038 ratchet update. */
export const ARCHITECTURE_INPUT_KIND_INVENTORY: readonly ArchitectureInputKindRow[] = [
  {
    id: "markdown",
    extensions: [".md"],
    mimeTypes: ["text/markdown"],
    sourceRoots: [INTAKE_CONTEXT_BUILDER_ROOT, READABLE_TEXT_ROOT, AUTHORITY_MIME_ROOT],
    wizardAccepts: true,
    intakeContextBuilderToday: "inline-text",
    authorityContextIngestionToday: "analyze",
    esiCatalogToday: "stored-file",
    droppedFromAuthority: false,
    status: "asDeferred",
    ownerPrompt: "AS-003",
    notes: "Sent as text/markdown on the decide path.",
  },
  {
    id: "plain-text",
    extensions: [".txt"],
    mimeTypes: ["text/plain"],
    sourceRoots: [INTAKE_CONTEXT_BUILDER_ROOT, READABLE_TEXT_ROOT, AUTHORITY_MIME_ROOT],
    wizardAccepts: true,
    intakeContextBuilderToday: "inline-text",
    authorityContextIngestionToday: "analyze",
    esiCatalogToday: "stored-file",
    droppedFromAuthority: false,
    status: "asDeferred",
    ownerPrompt: "AS-003",
    notes: "Sent as text/plain on the decide path.",
  },
  {
    id: "json",
    extensions: [".json"],
    mimeTypes: ["application/json"],
    sourceRoots: [INTAKE_CONTEXT_BUILDER_ROOT, READABLE_TEXT_ROOT, AUTHORITY_MIME_ROOT],
    wizardAccepts: true,
    intakeContextBuilderToday: "inline-text",
    authorityContextIngestionToday: "analyze",
    esiCatalogToday: "stored-file",
    droppedFromAuthority: false,
    status: "asDeferred",
    ownerPrompt: "AS-003",
    notes: "Readable text file bridged as text/plain today.",
  },
  {
    id: "yaml",
    extensions: [".yaml", ".yml"],
    mimeTypes: ["application/yaml", "text/yaml"],
    sourceRoots: [INTAKE_CONTEXT_BUILDER_ROOT, READABLE_TEXT_ROOT, AUTHORITY_MIME_ROOT],
    wizardAccepts: true,
    intakeContextBuilderToday: "inline-text",
    authorityContextIngestionToday: "analyze",
    esiCatalogToday: "stored-file",
    droppedFromAuthority: false,
    status: "asDeferred",
    ownerPrompt: "AS-003",
    notes: "Readable text file bridged as text/plain today.",
  },
  {
    id: "pdf",
    extensions: [".pdf"],
    mimeTypes: ["application/pdf"],
    sourceRoots: [INTAKE_CONTEXT_BUILDER_ROOT, READABLE_TEXT_ROOT, AUTHORITY_MIME_ROOT, API_CONTRACTS_ROOT],
    wizardAccepts: true,
    intakeContextBuilderToday: "extract-text",
    authorityContextIngestionToday: "extract-text",
    esiCatalogToday: "stored-file",
    droppedFromAuthority: false,
    status: "asDeferred",
    ownerPrompt: "AS-039",
    notes: "Extracted prose as text/plain — not structured diagram topology.",
  },
  {
    id: "docx",
    extensions: [".docx"],
    mimeTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    sourceRoots: [INTAKE_CONTEXT_BUILDER_ROOT, READABLE_TEXT_ROOT, AUTHORITY_MIME_ROOT],
    wizardAccepts: true,
    intakeContextBuilderToday: "extract-text",
    authorityContextIngestionToday: "extract-text",
    esiCatalogToday: "stored-file",
    droppedFromAuthority: false,
    status: "asDeferred",
    ownerPrompt: "AS-039",
    notes: "Extracted prose as text/plain — original bytes stored for ESI inspect.",
  },
  {
    id: "png",
    extensions: [".png"],
    mimeTypes: ["image/png"],
    sourceRoots: [
      INTAKE_CONTEXT_BUILDER_ROOT,
      "archlucid-ui/src/lib/architecture-spine/intake-pixel-diagram-context-document.ts",
      WIZARD_ACCEPT_ROOT,
      ESI_INVENTORY_ROOT,
    ],
    wizardAccepts: true,
    intakeContextBuilderToday: "pixel-stub",
    authorityContextIngestionToday: "drop",
    esiCatalogToday: "stored-file",
    droppedFromAuthority: true,
    status: "asOwned",
    ownerPrompt: "AS-005",
    notes: "Emits application/vnd.archlucid.diagram+json NotVerifiable stub (AS-004); topology extract is follow-on.",
  },
  {
    id: "jpeg",
    extensions: [".jpg", ".jpeg"],
    mimeTypes: ["image/jpeg"],
    sourceRoots: [
      INTAKE_CONTEXT_BUILDER_ROOT,
      "archlucid-ui/src/lib/architecture-spine/intake-pixel-diagram-context-document.ts",
      WIZARD_ACCEPT_ROOT,
      ESI_INVENTORY_ROOT,
    ],
    wizardAccepts: true,
    intakeContextBuilderToday: "pixel-stub",
    authorityContextIngestionToday: "drop",
    esiCatalogToday: "stored-file",
    droppedFromAuthority: true,
    status: "asOwned",
    ownerPrompt: "AS-005",
    notes: "Same NotVerifiable structured stub as PNG (AS-004).",
  },
  {
    id: "svg",
    extensions: [".svg"],
    mimeTypes: ["application/vnd.archlucid.diagram+svg"],
    sourceRoots: [INTAKE_CONTEXT_BUILDER_ROOT, AUTHORITY_MIME_ROOT],
    wizardAccepts: true,
    intakeContextBuilderToday: "structured-parse",
    authorityContextIngestionToday: "structured-parse",
    esiCatalogToday: "stored-file",
    droppedFromAuthority: false,
    status: "shipped",
    ownerPrompt: "AS-008",
    notes: "SVG posts as application/vnd.archlucid.diagram+svg; server sanitizes and parses labels. image/svg+xml remains forbidden on authority; ESI preview stays download-only.",
  },
  {
    id: "vsdx",
    extensions: [".vsdx"],
    mimeTypes: ["application/vnd.ms-visio.drawing.main+xml"],
    sourceRoots: [WIZARD_ACCEPT_ROOT, API_CONTRACTS_ROOT],
    wizardAccepts: false,
    intakeContextBuilderToday: "drop",
    authorityContextIngestionToday: "drop",
    esiCatalogToday: "not-applicable",
    droppedFromAuthority: true,
    status: "asOwned",
    ownerPrompt: "AS-010",
    notes: "Help directs Visio export to PDF/PNG; native .vsdx parse is follow-on.",
  },
  {
    id: "drawio",
    extensions: [".drawio", ".drawio.xml"],
    mimeTypes: ["application/vnd.jgraph.mxfile", "application/xml"],
    sourceRoots: [INTAKE_CONTEXT_BUILDER_ROOT],
    wizardAccepts: false,
    intakeContextBuilderToday: "drop",
    authorityContextIngestionToday: "drop",
    esiCatalogToday: "not-applicable",
    droppedFromAuthority: true,
    status: "asOwned",
    ownerPrompt: "AS-009",
    notes: "draw.io XML structured parse is follow-on.",
  },
  {
    id: "mermaid",
    extensions: [".mmd", ".mermaid"],
    mimeTypes: ["text/vnd.mermaid"],
    sourceRoots: [INTAKE_CONTEXT_BUILDER_ROOT],
    wizardAccepts: true,
    intakeContextBuilderToday: "structured-parse",
    authorityContextIngestionToday: "structured-parse",
    esiCatalogToday: "not-applicable",
    droppedFromAuthority: false,
    status: "shipped",
    ownerPrompt: "AS-007",
    notes: "Mermaid source posts as text/vnd.mermaid; server parses to ArchitectureDiagramModelRecord.",
  },
  {
    id: "terraform",
    extensions: [".tf"],
    mimeTypes: ["text/plain"],
    sourceRoots: [
      INTAKE_CONTEXT_BUILDER_ROOT,
      WIZARD_ACCEPT_ROOT,
      "ArchLucid.ContextIngestion/ConnectorStages/InfrastructureDeclarationsPayloadNormalizer.cs",
    ],
    wizardAccepts: true,
    intakeContextBuilderToday: "drop",
    authorityContextIngestionToday: "separate-ingest",
    esiCatalogToday: "stored-file",
    droppedFromAuthority: false,
    status: "asDeferred",
    ownerPrompt: "AS-043",
    notes: "IaC via infrastructureDeclarations — not ContextDocumentRequest bytes.",
  },
  {
    id: "bicep",
    extensions: [".bicep"],
    mimeTypes: ["text/plain"],
    sourceRoots: [
      INTAKE_CONTEXT_BUILDER_ROOT,
      WIZARD_ACCEPT_ROOT,
      "ArchLucid.ContextIngestion/ConnectorStages/InfrastructureDeclarationsPayloadNormalizer.cs",
    ],
    wizardAccepts: true,
    intakeContextBuilderToday: "drop",
    authorityContextIngestionToday: "separate-ingest",
    esiCatalogToday: "stored-file",
    droppedFromAuthority: false,
    status: "asDeferred",
    ownerPrompt: "AS-043",
    notes: "IaC via infrastructureDeclarations — not ContextDocumentRequest bytes.",
  },
  {
    id: "cloud-inventory-zip",
    extensions: [".zip"],
    mimeTypes: ["application/zip"],
    sourceRoots: [WIZARD_ACCEPT_ROOT, WIZARD_UPLOAD_ROOT, ESI_INVENTORY_ROOT],
    wizardAccepts: true,
    intakeContextBuilderToday: "drop",
    authorityContextIngestionToday: "separate-ingest",
    esiCatalogToday: "stored-file",
    droppedFromAuthority: false,
    status: "asDeferred",
    ownerPrompt: "AS-046",
    notes: "Wizard pending upload / IE plane — not inline context documents.",
  },
] as const;

export function architectureInputKindParticipatesInAuthorityAnalyzeToday(
  row: ArchitectureInputKindRow,
): boolean {
  return row.authorityContextIngestionToday === "analyze";
}
