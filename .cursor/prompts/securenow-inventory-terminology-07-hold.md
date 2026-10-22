# SN-IT-HOLD — Written hold (not implementation)

**Wave:** SecureNow Azure inventory terminology (**SN-IT**). **Not an implementation prompt.** Paste when a session starts renaming REST routes, SQL tables, C# types, OpenAPI `snapshotId`, or Architecture review snapshot vocabulary.

Library copy: [`docs/library/SECURENOW_INVENTORY_TERMINOLOGY_HOLD.md`](../../docs/library/SECURENOW_INVENTORY_TERMINOLOGY_HOLD.md).

## Goal

Buyer copy says **Azure inventory capture**; engineering contracts stay `AzureInventorySnapshot` / `snapshotId` / `/v1/infra-evidence/snapshots`.

## Do not implement from SN-IT sessions

| Temptation | Hold |
|------------|------|
| Rename REST `/snapshots` or query `snapshotId` | Identifier hold |
| Rename `SnapshotAId` / `SnapshotBId` DTO fields | Internal diff pair |
| Global `snapshot` → `capture` sed | SN-IT-01–06 scoped modules only |
| Merge assessment snapshot with inventory capture | AuditEvidenceSnapshot stays distinct |
| Architecture golden manifest snapshot rename | Architecture product |

## Authorized slice

**SN-IT-01–06** — glossary, drift UI, infrastructure spine, architect metrics, help wording, CI ratchet.

## If a session is already implementing a hold item

Stop. Revert. Point at **SN-IT-HOLD** and finish **SN-IT-01–06** buyer copy only.
