> **Scope:** Gap list vs a typical private-beta legal/trust pack. **Cursor draft for owner/lawyer execution** — not legal advice. Canonical inventory: [`PROCUREMENT_PACK_INDEX.md`](PROCUREMENT_PACK_INDEX.md).

# Private-beta legal / trust pack — gap list (2026-09-14)

## Already in-repo (cite paths; do not re-invent)

| Typical beta artifact | Status | Source |
| --- | --- | --- |
| Privacy / data handling narrative | Self-attested | [`trust-center.md`](trust-center.md) |
| DPA template | Template | [`DPA_TEMPLATE.md`](DPA_TEMPLATE.md) |
| Subprocessors | Self-attested | [`SUBPROCESSORS.md`](SUBPROCESSORS.md) |
| Support + incident comms | Self-attested | [`SUPPORT_POLICY.md`](SUPPORT_POLICY.md) |
| SOC 2 honest posture | Self-attested / deferred CPA | [`ASSURANCE_STATUS_CANONICAL.md`](ASSURANCE_STATUS_CANONICAL.md), [`SOC2_STATUS_PROCUREMENT.md`](SOC2_STATUS_PROCUREMENT.md) |
| CAIQ / SIG pre-fills | Self-attested | [`../security/CAIQ_LITE_2026.md`](../security/CAIQ_LITE_2026.md), [`../security/SIG_CORE_2026.md`](../security/SIG_CORE_2026.md) |
| Buyer security packet | Self-attested | [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](BUYER_SECURITY_PROCUREMENT_PACKET.md) |
| Claim boundaries | Self-attested | [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md), [`../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md) |

## Gaps for controlled beta (owner / counsel)

| Gap | Why it matters for beta | Suggested action |
| --- | --- | --- |
| **Executed beta terms / AUP** | Invitees need a click-through or order-form reference | Draft from DPA + support policy; lawyer signs |
| **Beta-specific limitation of liability** | Pilot scope differs from GA MSA | Short beta rider referencing Simulator vs Real |
| **Invoice / SOW entity readiness** | **G-COMMERCE-01** | [`GTM_BACKLOG.md`](GTM_BACKLOG.md) — owner executes |
| **Public status page** | Planned, not live | [`SUPPORT_POLICY.md#8-operational-transparency--status-page-plan`](SUPPORT_POLICY.md#8-operational-transparency--status-page-plan) |
| **CPA SOC 2 Type II report** | Deferred — do not imply | **G-REAL-05** owner program |
| **Third-party pen-test publication** | Deferred — do not imply | **G-ASSURANCE-02** owner program |
| **PGP disclosure key** | Deferred V1.1 | [`../security/PGP_KEY_GENERATION_RECIPE.md`](../security/PGP_KEY_GENERATION_RECIPE.md) |

## Build the ZIP (when sending to procurement)

```bash
python scripts/build_procurement_pack.py --dry-run
python scripts/build_procurement_pack.py --strict   # release/procurement only
```

See [`PROCUREMENT_PACK_INDEX.md`](PROCUREMENT_PACK_INDEX.md) for the full artifact map.

## Related

- Claim audit: [`../assessments/PRIVATE_BETA_CLAIM_AUDIT_20260914.md`](../assessments/PRIVATE_BETA_CLAIM_AUDIT_20260914.md)
- Worklist: [`../assessments/PRIVATE_BETA_CURSOR_AGENT_WORKLIST.md`](../assessments/PRIVATE_BETA_CURSOR_AGENT_WORKLIST.md)
