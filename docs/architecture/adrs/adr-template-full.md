> **Scope:** Long-form ADR skeleton for contributors — optional tables and extra sections; same three mandated headings as [template.md](template.md); meta-doc, not an ADR.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# ADR template — full skeleton (mandatory reasoning sections)

**How to use:** Copy into `docs/architecture/adrs/NNNN-short-slug-kebab-case.md` per [README.md](README.md). Replace every `⌈placeholder⌉`. Remove optional blocks only when they truly do not apply—**never** remove the three mandated sections below.

**Immutability:** Once **Accepted**, do not rewrite; supersede with another ADR.

**Merge-blocking rules (exact wording):** [template.md](template.md).

---

## Enforcement rules (MUST)

The following **MUST** appear as top-level `##` headings (exact titles) with substantive prose—not empty, not placeholder-only, not a single vague sentence.

1. **`## Trade-offs`** — You **MUST** name what you are trading away for this decision (performance, cost, flexibility, operational load, security surface, time to ship, etc.) and what you gain.
2. **`## Constraints`** — You **MUST** list constraints the decision operates under (org policy, budget, platform, compliance, staffing, dependencies, deadlines).
3. **`## Expected impact`** — You **MUST** describe expected impact on the system, security posture, operations, cost, and teams (concrete, falsifiable where possible).

If any of the three are missing or non-substantive, treat the ADR as **not ready to merge** until fixed.

---

## Paste below into your new ADR file

```markdown
> **Scope:** ADR ⌈NNNN⌉ — ⌈short title⌉ — full detail in sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# ADR ⌈NNNN⌉: ⌈Full title⌉

- **Status:** Proposed | Accepted | Superseded
- **Date:** ⌈YYYY-MM-DD⌉

## Context

⌈Problem, forces, alternatives, audience⌉.

## Decision

⌈Single clear commitment⌉.

## Trade-offs

⌈MANDATORY: explicit gains vs sacrifices⌉.

## Constraints

⌈MANDATORY: boundaries the decision must respect⌉.

## Expected impact

⌈MANDATORY: system, security, ops, cost, team effects⌉.

## Consequences

- **Positive:** ⌈⌉
- **Negative:** ⌈⌉
- **Follow-ups:** ⌈⌉
```

Deeper architecture structure (objective, data flow, etc.) lives in `.cursor/rules/architecture-outputs.mdc` and MAY be added as additional `##` sections when the ADR is large.
