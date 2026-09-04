> **Scope:** Composer prompt index for policy-pack coverage architecture v2 (PP-COV-01–09). Implementation branch: `cursor/policy-pack-architecture-v2-e986`.

# Policy-pack coverage architecture v2 — Grok prompts

**Model:** `cursor-grok-4.6-high` (slow tier) · **Branch prefix:** `cursor/policy-pack-<slug>-e986`

## Sequencing

| ID | Title | Status on branch |
|----|-------|------------------|
| PP-COV-01 | `IsOrganizationRequired` on assignments + migration 346 | **Shipped** |
| PP-COV-02 | Coverage preview API wiring + wizard `AssuranceCoveragePreviewPanel` | **Shipped** |
| PP-COV-03 | `PUT …/assignments/{id}/organization-required` | **Shipped** |
| PP-COV-04 | Curated rule `applicabilityConditions` + filter stage | **Shipped** (cloud provider gate; null context = no-op) |
| PP-COV-05 | Buyer-pack `advisoryDefaults` expectation facets | **Shipped** (SOC 2, HIPAA, GDPR, PCI, CIS AWS/GCP) |
| PP-COV-06 | Golden corpus extension | Deferred |
| PP-COV-07 | Coverage exclusion PATCH | Deferred (use org-required + enabled endpoints) |
| PP-COV-08 | Run detail multi-pack scope disclosure | Deferred |
| PP-COV-09 | Empty-key fail-closed governance filter | **Explicitly out** (breaks existing tests) |

## Global constraints

- Do not add new bundled pack filenames (GTM hold).
- `IsPinned` remains merge-precedence only; org-required uses `IsOrganizationRequired` with legacy `IsPinned` fallback via `PolicyPackAssignmentOrganizationRequired`.
- Applicability filter is additive; null run context preserves today’s behavior.
- Regenerate bundled packs: `python scripts/generate_v1_bundled_policy_packs.py` after JSON edits.

## Related docs

- [`docs/library/POLICY_PACK_EXPECTATION_FACET.md`](../library/POLICY_PACK_EXPECTATION_FACET.md)
- [`docs/architecture/POLICY_PACK_EXPECTATION_COMPOSER_PROMPTS.md`](POLICY_PACK_EXPECTATION_COMPOSER_PROMPTS.md)
