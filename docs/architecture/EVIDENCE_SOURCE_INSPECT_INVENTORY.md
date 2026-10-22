> **Scope:** Evidence source inspect wave inventory (ESI-01–ESI-08).

# Evidence source inspect inventory (ESI)

| Prompt | Surface | Notes |
|--------|---------|-------|
| ESI-01 | `RunStoredEvidenceFiles` SQL + list API | Catalog ids |
| ESI-02 | `run-stored-evidence-file-api.ts` | Authorized GET/stream |
| ESI-03 | `RunDetailEvidenceInventorySection.tsx` | Open + Download on stored rows |
| ESI-04 | `run-stored-evidence-preview-policy.ts` | Preview vs download-only |
| ESI-05 | `RunDetailCreateHomeEvidenceCaptureRegion.tsx` | Catalog-bound capture list |
| ESI-06 | Intake original retention | Same catalog path as bulk upload |
| ESI-07 | `StoredEvidenceFileCells.tsx` | Sealed-record honesty copy |
| ESI-08 | `inspect-stored-evidence` help + Vitest ratchets | Regression guard |
