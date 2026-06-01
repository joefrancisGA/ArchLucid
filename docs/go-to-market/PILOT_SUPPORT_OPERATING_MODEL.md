> **Scope:** Controlled-pilot support and escalation posture (TB-162). Not a production SLA.

# Pilot support and operating model

**Last reviewed:** 2026-06-01

**Related:** [`docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md), [`docs/runbooks/TROUBLESHOOTING.md`](../runbooks/TROUBLESHOOTING.md), [`TRUST_CENTER.md`](TRUST_CENTER.md).

---

## 1. Support posture (V1 controlled pilot)

| Dimension | Pilot commitment | Not offered in V1 pilot |
| --- | --- | --- |
| Coverage hours | Business hours (buyer timezone agreed in SOW) | 24×7 on-call |
| Channel | Email + scheduled working sessions | Guaranteed chat-ops SLA |
| Scope | Pilot tenant, agreed systems | Full enterprise fleet |
| Language | English | Localized support packs |

---

## 2. Severity and response targets (pilot-only)

| Severity | Example | Target first response | Target workaround |
| --- | --- | --- | --- |
| **S1** | Pilot blocked; no committed reviews possible | 4 business hours | 1 business day |
| **S2** | Degraded run execution or governance workflow | 1 business day | 3 business days |
| **S3** | UX defect, non-blocking export issue | 2 business days | Next pilot patch window |
| **S4** | Question, how-to, documentation | 2 business days | Guidance or runbook link |

These targets are **pilot-only** and do not constitute a production SLA. Contractual SLA evidence remains V1.1 per [`V1_DEFERRED.md`](../library/V1_DEFERRED.md).

---

## 3. Escalation path

1. Operator or buyer champion opens ticket via agreed email alias.
2. Founder / designated pilot engineer triages using [`TROUBLESHOOTING.md`](../runbooks/TROUBLESHOOTING.md).
3. S1 escalations: same-day executive sponsor sync if workaround not available.
4. Security incidents: follow [`TRUST_CENTER.md`](TRUST_CENTER.md) notification guidance; preserve audit exports.

---

## 4. Incident communication

- Initial acknowledgment includes run id, tenant scope, and impact on review commit path.
- Updates at least every business day until resolved for S1/S2.
- Post-incident summary references audit event types when applicable (no secrets in email).

---

## 5. White-glove vs self-serve

| Mode | When used |
| --- | --- |
| **White-glove pilot** | Default for first design partner; founder attends first commit review |
| **Guided self-serve** | Buyer operators trained; founder office hours weekly |
| **Pure self-serve** | Not claimed in V1 pilot offers — reserved for future GA motion |
