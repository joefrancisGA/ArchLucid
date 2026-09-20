> **Scope:** Contributor-reference — written hold for SecureNow buyer-facing **Azure inventory** terminology (**SN-IT-HOLD**). Internal engineering only.
> **Spine:** [`INFRA_EVIDENCE_PLANE.md`](INFRA_EVIDENCE_PLANE.md) §3 name map · **Prompts:** [`../architecture/SECURENOW_INVENTORY_TERMINOLOGY_COMPOSER_PROMPTS.md`](../architecture/SECURENOW_INVENTORY_TERMINOLOGY_COMPOSER_PROMPTS.md) · **Paste:** [`.cursor/prompts/securenow-inventory-terminology-07-hold.md`](../../.cursor/prompts/securenow-inventory-terminology-07-hold.md)

# SecureNow Azure inventory terminology hold (SN-IT-HOLD)

**Status:** Active written hold — **not implementation**. Paste [`.cursor/prompts/securenow-inventory-terminology-07-hold.md`](../../.cursor/prompts/securenow-inventory-terminology-07-hold.md) when a session starts renaming REST routes, SQL tables, C# types, or Architecture review snapshot language.

## Goal

SecureNow operators should read **Azure inventory** and **inventory capture** on infrastructure-evidence workbenches — not bare **snapshot**, **Snapshot A**, or **Snapshot B** — while internal contracts stay `AzureInventorySnapshot` / `snapshotId`.

## Authorized slice (SN-IT-01–SN-IT-06)

```text
Locked glossary + copy helper (SN-IT-01)
        → Drift workbench + nav labels (SN-IT-02)
              → Infrastructure spine copy modules (SN-IT-03)
                    → Architect metrics + honesty verify hints (SN-IT-04)
                          → Help / Category-1 job-match strings (SN-IT-05)
                                → Security-shell CI ratchet (SN-IT-06)
```

Architecture shell (`NEXT_PUBLIC_ARCHLUCID_PRODUCT=architecture`) keeps existing review / golden manifest snapshot vocabulary unless a separate owner pass reopens it.

## Do not implement (ever from SN-IT sessions)

| Temptation | Hold |
|------------|------|
| Rename `GET /v1/infra-evidence/snapshots` or `snapshotId` query params | SN-08-style identifier hold; URLs are not buyer copy |
| Rename C# `AzureInventorySnapshot`, `SnapshotAId`, `SnapshotBId`, DbUp tables | Plane §3 name map — buyer labels only |
| Global `sed` replacing `snapshot` in tests, OpenAPI, or log templates | Scoped Security-shell copy modules + guards |
| Collapse **assessment snapshot** (`AuditEvidenceSnapshot`) into inventory capture | Audit lineage keeps assessment snapshot where ARC-AMPE export requires it |
| Rename sealed architecture review **golden manifest snapshot** | Architecture product; not SecureNow infrastructure spine |
| `terraform apply` / second collector / `IFindingEngine` | Plane |
| GTM M-90 / M-44 / M-91 / M-92; TB-135 / TB-136 | Owner/GTM |
| Desktop review tabs behind **More** | workspace rule |

## If a session is already implementing a hold item

Stop. Revert uncommitted hold-item renames. Point at **SN-IT-01–06** and this hold. Finish buyer copy in the Security shell only.

## Related

- [`SECURENOW_ARCHITECT_PLANE.md`](SECURENOW_ARCHITECT_PLANE.md) — verify on **next inventory capture**
- [`.cursor/prompts/securenow-inventory-terminology-00-index.md`](../../.cursor/prompts/securenow-inventory-terminology-00-index.md)
- [`.cursor/prompts/securenow-brand-08-platform-hold.md`](../../.cursor/prompts/securenow-brand-08-platform-hold.md) (identifiers)
