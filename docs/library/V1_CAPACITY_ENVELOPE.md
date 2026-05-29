> **Scope:** Buyer/evaluator — practical V1 capacity envelope for first-pilot and early production — documented targets and estimates, not contractual SLAs.

# V1 capacity envelope (first pilot and early production)

**Canonical region assumption (hosted SaaS):** **East US** unless a deployment explicitly configures another single region in Terraform.

## Envelope table

| Dimension | First-pilot / early-production assumption | Evidence class |
| --- | --- | --- |
| Active pilot tenants | Up to **5** | Documented target |
| Committed reviews per tenant per month | Up to **25** | Documented target |
| Concurrent operators (total) | Up to **10** | Documented target |
| API + worker replicas (starting point) | **1** API + **1** worker | Documented target |
| SQL | Azure SQL, per-tenant catalogs in product topology | Tested in staging smoke / pilot paths |
| Cache | Optional in-memory for single-replica pilots; Redis not required for V1 single-replica | Documented |
| LLM budget | Defaults from [`CONFIGURATION_REFERENCE.md`](CONFIGURATION_REFERENCE.md) · hard caps when configured | Config reference |
| Multi-region active/active | **Out of scope** for V1 | Deferred |

## Scale triggers (when to revisit)

| Signal | Action |
| --- | --- |
| Sustained operator queue or execute latency beyond first-pilot timing budget WARN | Add worker replica, review SQL tier, attach staging-smoke timings to proof |
| LLM budget blocks additional execution | Raise cap or reduce prompt surface; disclose in sponsor packet |
| Per-tenant review rate above envelope | Plan elastic pool / catalog capacity per [`TENANT_DATABASE_TOPOLOGY.md`](TENANT_DATABASE_TOPOLOGY.md) |

## Proof artifacts

- `scale-envelope-evidence.md` / `first-pilot-timing-budget.md` from [`../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md)
- [`CAPACITY_AND_COST_PLAYBOOK.md`](CAPACITY_AND_COST_PLAYBOOK.md) for component-level knobs

## Related

- [`../go-to-market/TRUST_CENTER.md`](../go-to-market/TRUST_CENTER.md)
- [`PERFORMANCE.md`](PERFORMANCE.md)
