> **Scope:** One-page **comparison matrix** for buyers — complements the deeper [competitive landscape](COMPETITIVE_LANDSCAPE.md).

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md).

# ArchLucid competitive comparison

**Last reviewed:** 2026-05-10

**Grounding:** Capabilities listed for ArchLucid follow **[V1_SCOPE.md](../library/V1_SCOPE.md)**, **[ARCHITECTURE_CONTEXT.md](../library/ARCHITECTURE_CONTEXT.md)**, and primary engineering docs. This is positioning guidance, not a third-party audit of other vendors.

---

## Comparison matrix

| Dimension | ArchLucid (in-contract V1) | Manual architecture review (docs + meetings) | General-purpose AI chat | Static architecture diagrams (EAM / drawing tools) |
|-----------|---------------------------|----------------------------------------------|-------------------------|------------------------------------------------------|
| **Repeatable run object** | Structured **run → manifest** with versioned metadata and exports. | Ad hoc decks and email threads. | Conversations without durable enterprise record. | Models often drift from production truth. |
| **Governed AI orchestration** | Multi-step **agent pipeline** with configurable modes, bounded retries, and trace storage options. | Human-only; slow to scale. | No native governance, retention, or workspace RBAC tie-in. | No automated reasoning over live evidence. |
| **Findings + severity** | **Finding engines** (topology, security, policy, compliance, cost) with structured payloads and UI surfacing. | Depends on reviewer skill and time. | Explanations may omit evidence or cite stale text. | Manual annotation only. |
| **Compare / replay** | **Manifest/compare** and **replay export** paths for drift and regression posture (see [COMPARISON_REPLAY.md](../library/COMPARISON_REPLAY.md)). | Difficult to diff two time-stamped reviews. | Not applicable. | Manual diff of diagrams. |
| **Auditability** | **Append-only audit** surface with CSV/JSON/CEF export ([AUDIT_COVERAGE_MATRIX.md](../library/AUDIT_COVERAGE_MATRIX.md)). | Evidence scattered across tools. | Typically no enterprise audit trail. | Limited operational audit. |
| **Scope honesty** | **Deferred** items tracked in **[V1_DEFERRED.md](../library/V1_DEFERRED.md)** — procurement “nice-to-haves” are not silently promised as GA. | N/A | Often over-claims capability. | N/A |

---

## How to use this in a deal cycle

1. **Anchor on the run artifact** — ask alternatives how they produce a *single* review object with exports, not only slides.
2. **Demand proof of governance** — role separation, audit export, and pre-commit gates ([PRE_COMMIT_GOVERNANCE_GATE.md](../library/PRE_COMMIT_GOVERNANCE_GATE.md)).
3. **Map integrations** — use **[CONNECTOR_READINESS_MATRIX.md](../library/CONNECTOR_READINESS_MATRIX.md)** against the buyer’s ITSM / wiki stack.

---

## Related

- **[COMPETITIVE_LANDSCAPE.md](COMPETITIVE_LANDSCAPE.md)** — market context and narrative.
- **[POSITIONING.md](POSITIONING.md)** — category and messaging.
- **[INTEGRATION_CATALOG.md](INTEGRATION_CATALOG.md)** — connector packaging.
