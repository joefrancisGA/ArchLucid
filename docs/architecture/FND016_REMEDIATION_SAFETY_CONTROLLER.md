# FND-016 — fail-closed remediation safety controller

This reference controller integrates FND-014 simulated changes and FND-015 rollback planning without enabling any execution. It requires independently verified tenant/project/proposal facts, current source-model digest matching the dry-run input, bounded steps and distinct affected resources, exact operation allowlist, explicit resource criticality classification, complete dependency inventory, approved dependent impacts, and emergency-stop inactive state. It rejects missing or mismatched evidence and incomplete rollback plans.

A passing preliminary safety review returns `review_required`, **never execution eligibility**. FND-015 produces a manual rollback plan, not validated recovery readiness. The controller does not execute commands, change cloud resources, provision permissions or call a production remediation service.

## Next integration gates
- Source current facts from independently authenticated inventory with freshness and signed provenance.
- Bind dry-run change list exactly to proposed steps and independently verify rollback inverses.
- Implement durable emergency stop with in-flight cancellation semantics.
- Add recovery rehearsal evidence, dependency graph confidence and criticality policy per tenant.
- Revalidate policy, authorization, resource versions and emergency stop immediately before a separately authorized execution gate.
- Verify full CI and adversarial cases before connecting to production remediation.
