> **Reviewed:** 2026-07-24

> **Scope:** Review cadence and role ownership for buyer-facing procurement documentation, including stale-document escalation expectations.

# Procurement Documentation Review Cadence

**Audience:** Maintainers of procurement/trust documents and release managers.

**Last reviewed:** 2026-07-24

---

## Cadence matrix

| Document | Owner role | Review frequency | Escalation when stale |
|---|---|---|---|
| `ASSURANCE_STATUS_CANONICAL.md` | Security lead | Every 30 days | Update first, then refresh all downstream assurance surfaces in the same change |
| `trust-center.md` | Security lead | Every 30 days | Raise in release checklist and update before procurement pack release |
| `CURRENT_ASSURANCE_POSTURE.md` | Security lead | Every 30 days | Block procurement deal-ready mode until refreshed |
| `BUYER_SECURITY_PROCUREMENT_PACKET.md` | Security lead | Every 30 days | Re-validate isolation / evidence routing before principal-architect or security reviews |
| `CLAIM_READINESS_STATUS.md` | Founder / GTM owner | After each pilot or release review | Hold outbound claim stage advances until gates refreshed |
| `SLA_SUMMARY.md` | Platform lead | Every 45 days | Escalate to product + ops owner for confirmation |
| `INCIDENT_COMMUNICATIONS_POLICY.md` | Incident manager role | Every 45 days | Escalate to on-call manager; confirm channels and timelines |
| `OPERATIONAL_TRANSPARENCY.md` | Platform lead | Every 90 days | Confirm status-page plan honesty (planned vs live) before buyer send |
| `SUBPROCESSORS.md` | Privacy/legal operations role | Every 90 days | Escalate to legal review queue and update changelog note |

---

## Process

1. Update `Last reviewed` (and `> **Reviewed:**` when using the audit stamp) in each document when substantive validation is done.
2. Keep status wording aligned with `ASSURANCE_STATUS_CANONICAL.md` — do not invent stronger SOC 2 / pen-test claims.
3. Run CI checks before shipping buyer packs.

---

## CI linkage

- Claim consistency: `scripts/ci/check_procurement_claim_coherence.py`
- Freshness check: `scripts/ci/check_procurement_doc_freshness.py`
- Trust-center links / posture: `scripts/ci/check_trust_center_links.py`, `scripts/ci/check_trust_center_posture_freshness.py`
