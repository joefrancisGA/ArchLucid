> **Scope:** TB-013 starter — how to pick documentation by **audience** so contributors route changes to the right surface. Full split is incremental; this index is the canonical entry.

# Documentation audiences (TB-013)

| Audience | Intent | Start here |
|----------|--------|------------|
| **Buyer / pilot / sponsor** | Time-to-value, trust, procurement | [`docs/FIRST_5_DOCS.md`](../FIRST_5_DOCS.md), [`docs/CORE_PILOT.md`](../CORE_PILOT.md), [`docs/go-to-market/TRUST_CENTER.md`](../go-to-market/TRUST_CENTER.md) |
| **Operator / tenant admin** | Day-2 configuration, runbooks, shell | [`docs/library/OPERATOR_QUICKSTART.md`](OPERATOR_QUICKSTART.md), [`docs/library/API_CONTRACTS.md`](API_CONTRACTS.md), [`docs/OPERATIONS_ADMIN.md`](../OPERATIONS_ADMIN.md) |
| **Contributor / platform engineer** | Repo layout, invariants, CI, migrations | [`.cursor/rules/Architecture-Invariants.mdc`](../../.cursor/rules/Architecture-Invariants.mdc), [`docs/library/TECH_BACKLOG.md`](TECH_BACKLOG.md), [`docs/library/CONFIGURATION_REFERENCE.md`](CONFIGURATION_REFERENCE.md) |

**Rule of thumb:** if a change touches HTTP JSON or operator-visible behavior, update **buyer-facing** summaries only when the behavior is customer-visible; otherwise prefer **operator** or **contributor** libraries. When in doubt, add a one-line “**Audience:**” note at the top of new markdown (see existing scope headers).

## Related

- [`docs/library/PILOT_GUIDE.md`](PILOT_GUIDE.md)
- [`docs/contributor/README.md`](../contributor/README.md) (if present)
