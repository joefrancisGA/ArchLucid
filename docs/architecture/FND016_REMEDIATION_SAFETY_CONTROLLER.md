# FND-016 — fail-closed remediation safety controller

This reference controller integrates FND-014 simulated changes and FND-015 rollback planning without enabling any execution. It requires independently verified tenant/project/proposal facts, current source-model digest matching the dry-run input, bounded steps and distinct affected resources, exact operation allowlist, explicit resource criticality classification, complete dependency inventory, approved dependent impacts, and emergency-stop inactive state. It rejects missing or mismatched evidence and incomplete rollback plans.

A passing preliminary safety review returns `review_required`, **never execution eligibility**. FND-015 produces a manual rollback plan, not validated recovery readiness. The controller does not execute commands, change cloud resources, provision permissions or call a production remediation service.

## Strict evidence interpretation (reuse audit, 2026-11-23)

Integration adapters can supply invalid Boolean-like values at Python runtime despite
dataclass annotations. The reference preliminary controller now accepts
`facts_verified` **only when literally `True`**, and clears an emergency
stop **only when literally `False`**. Ambiguous or missing stop states are
reported as `emergency_stop_unverified`, not treated as inactive. These
are fail-closed decisions in a pure reference model; they do not introduce
an external verifier, a production reader, or cloud execution eligibility.

FND-018's reference containment model already requires these same strict
Boolean proof semantics. This FND-016 change aligns the existing contracts
without importing the unrelated failure-containment model or creating
a new architecture control. The FND-016 recovery gate applies the same
strict typing to independently verified stop authority and rehearsal claims.

## Next integration gates
- Source current facts from independently authenticated inventory with freshness and signed provenance.
- Bind dry-run change list exactly to proposed steps and independently verify rollback inverses.
- Implement durable emergency stop with in-flight cancellation semantics.
- Add recovery rehearsal evidence, dependency graph confidence and criticality policy per tenant.
- Revalidate policy, authorization, resource versions and emergency stop immediately before a separately authorized execution gate.
- Verify full CI and adversarial cases before connecting to production remediation.
