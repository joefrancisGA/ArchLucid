> **Scope:** Canonical product and governance vocabulary for buyers, operators, engineers, and GRC reviewers; aligns naming across docs, UI copy, and API concepts. Does not redefine legal terms in procurement templates.
>
> **Status:** current

# Glossary — ArchLucid canonical terms

Use these meanings in buyer-facing narratives, **`docs/`**, and **`archlucid-ui`** surfaces unless a doc’s **Scope** explicitly defines a narrower local sense.

| Term | Definition |
|------|------------|
| **Review** | A structured examination of architecture change or design intent tied to **runs**, **artifacts**, and **policies**. In product copy, prefer **architecture review** when the reader might confuse “review” with code review alone. |
| **Review package** | The cohesive set of **review** outputs the product assembles for stakeholders: summaries, manifests, explanations, diagrams, findings, and links to underlying **evidence**. Exportable variants are still review packages unless the doc distinguishes **bundle** packaging. |
| **Signed manifest** | The cryptographic or provenance-backed record that closes the **authority** ledger for committed work (what was decided, bound to lineage). Treat “manifest” alone as ambiguous until provenance/signing semantics are stated. |
| **Finding** | A machine- or assisted-generated observation from **decisioning** (risk, drift, conformance, duplication, etc.). **Finding** severity and policy mapping live in packs and workflows; distinguish from informal “comments” outside the ledger. |
| **Risk** | A potential adverse outcome attached to architecture or operational change — often materialized through **finding** types and surfaced in dashboards and approvals. Risk **without** linkage to artifacts or approvals is conversational, not authoritative. |
| **Control** | A mitigating safeguard (process, tooling, entitlement, isolation, retention, alerting) asserted against **risk** — whether customer-operated (“customer control”) or platform-operated (**ArchLucid control** surfaces are documented separately from customer obligations). |
| **Decision** | A recorded disposition on **review** proposals (approve, waive, defer with rationale, escalate), auditable alongside **finding** deltas. Casual “team decided in Slack” is not a committed **decision** in this sense. |
| **Evidence trail** | The chronological, inspectable lineage from inputs (prompts, repositories, citations) through deterministic steps to reviewer-visible outputs. Evidence that cannot be reconstructed from stored traces is weaker procurement posture — call that gap explicitly. |
| **Governance approval** | A committed **decision** in the governance workflow affecting merge, rollout, waiver, exception, or escalation — differentiated from UX affordances labelled “Approve” unless they write to governance state. |
| **Audit trail** | The persisted, replayable ledger of authenticated actions across **reviews**, merges, approvals, retention, notifications, exports, and integrations — narrower than informal logging; wider than SIEM payloads alone. Audit trail retention norms are posture-specific. |

### Related canonical reads

- **UI term mapping:** [`../go-to-market/UI_GLOSSARY_V1.md`](../go-to-market/UI_GLOSSARY_V1.md) — label-level alignment for public shell copy.
- **Authority and traces:** [`../architecture/README.md`](../architecture/README.md) · ADR **`0012`**, **`0010`**.
