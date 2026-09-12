> **Scope:** v10 quality-ROI wave inventory (QR-16–QR-25).

# v10 quality-ROI inventory (QR)

| Prompt | Evidence | Notes |
|--------|----------|-------|
| QR-16 | `openapi-v1.contract.snapshot.json` | OpenAPI fail-fast + `api-types` sync |
| QR-16 | `OpenApiContractSnapshotTests.cs` | Canonical drift guard |
| QR-16 | `update_openapi_contract_snapshot.sh` | `ARCHLUCID_REGENERATE_UI_API_TYPES=1` regen |
| QR-16 | `architecture-inventory-binding-api.ts` | AS-048 attach/detach client |

Vitest ratchet module: `archlucid-ui/src/lib/v10-quality-roi-inventory.ts` · `v10-quality-roi-qr16-ratchet.test.ts`

Close audit (QR-16): [`V10_QUALITY_ROI_QR16_ACCEPTANCE_2026-09-12.md`](V10_QUALITY_ROI_QR16_ACCEPTANCE_2026-09-12.md)
