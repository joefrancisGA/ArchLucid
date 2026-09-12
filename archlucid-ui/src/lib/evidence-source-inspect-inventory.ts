/** ESI wave surface inventory — stored evidence inspect ladder. */

export const EVIDENCE_SOURCE_INSPECT_CATALOG_TABLE = "dbo.RunStoredEvidenceFiles" as const;

export const EVIDENCE_SOURCE_INSPECT_SURFACES: readonly string[] = [
  "ArchLucid.Api/Controllers/Authority/ReviewStoredEvidenceFilesController.cs",
  "archlucid-ui/src/lib/runs/run-stored-evidence-file-api.ts",
  "archlucid-ui/src/components/runs/StoredEvidenceFileCells.tsx",
  "archlucid-ui/src/components/runs/RunDetailEvidenceInventorySection.tsx",
  "archlucid-ui/src/lib/runs/run-stored-evidence-preview-policy.ts",
  "archlucid-ui/src/lib/evidence-intake-help-guide-content.ts",
];
