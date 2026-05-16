> **Scope:** ADR template enforcement — `Trade-offs`, `Constraints`, and `Expected impact` are merge-blocking for new numbered ADRs; meta-doc, not an ADR.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# ADR template — strict sections (canonical)

**Use:** Copy the block below into `docs/architecture/adrs/NNNN-short-slug-kebab-case.md` per [README.md](README.md). Replace every `⌈placeholder⌉`.

**Immutability:** Once **Accepted**, do not rewrite; supersede with another ADR.

**Longer skeleton** (optional blocks, tables, links): [adr-template-full.md](adr-template-full.md).

---

## Enforcement rules (organizational MUST)

These rules are **merge-blocking** unless an exception is recorded in the PR and in the ADR **Context**:

1. The ADR **must** contain three top-level Markdown headings with **exact** titles (case and wording as shown): `## Trade-offs`, `## Constraints`, `## Expected impact`.
2. Each of those sections **must** hold **substantive prose**: multiple sentences that a reviewer can argue with. **Forbidden:** empty sections, placeholder-only text (`TBD`, `⌈⌉` left unfilled), or a single vague sentence with no concrete trade-offs, constraints, or impacts.
3. **`## Trade-offs`** **must** name what the decision gives up (latency, cost, flexibility to change, operational burden, security surface, time to market, etc.) and what it gains.
4. **`## Constraints`** **must** list real boundaries (policy, budget, platform, compliance, staffing, vendor lock-in, deadlines, upstream dependencies).
5. **`## Expected impact`** **must** state expected effects on the system, **security posture**, **operations**, **cost**, and **teams**, with falsifiable or observable statements where possible.

If any rule above fails, the ADR is **not ready to merge**.

---

## Paste into your new ADR file

```markdown
> **Scope:** ADR ⌈NNNN⌉ — ⌈short title⌉.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# ADR ⌈NNNN⌉: ⌈Full title⌉

- **Status:** Proposed | Accepted | Superseded
- **Date:** ⌈YYYY-MM-DD⌉

## Context

⌈Problem, forces, alternatives, audience⌉.

## Decision

⌈Single clear commitment⌉.

## Trade-offs

⌈MANDATORY: explicit gains vs sacrifices — merge-blocking if empty or non-substantive⌉.

## Constraints

⌈MANDATORY: real boundaries — merge-blocking if empty or non-substantive⌉.

## Expected impact

⌈MANDATORY: system, security, ops, cost, team effects — merge-blocking if empty or non-substantive⌉.

## Consequences

- **Positive:** ⌈⌉
- **Negative:** ⌈⌉
- **Follow-ups:** ⌈⌉
```

Additional `##` sections are allowed when needed; they **do not** replace the three mandated sections above.
