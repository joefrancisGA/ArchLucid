> **Scope:** Copy-paste skeleton for authoring a new numbered Architecture Decision Record in this folder; meta-doc for contributors—not a numbered ADR and not immutable once filed.

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md).

# ADR authoring template

**How to use:** Copy this skeleton into **`docs/adr/NNNN-short-slug-kebab-case.md`** where **`NNNN`** is the next free integer listed in [`README.md`](README.md). Replace every `⌈placeholder⌋`. Remove sections you do not need; keep **Status**, **Date**, **Context**, **Decision**, **Consequences** at minimum.

Immutability rule: once an ADR file is merged as **Accepted**, do not rewrite history—**supersede** with another ADR instead.

Structured architecture outputs (`Objective`, `Assumptions`, `Constraints`, `Architecture Overview`, `Component Breakdown`, `Data Flow`, `Security Model`, `Operational Considerations`) MAY be pasted under **Architecture notes** below when the decision is large; small ADRs can omit those headings.

---

```markdown
> **Scope:** ADR ⌈NNNN⌋ — ⌈short title⌉ - full detail, tables, and links in the sections below.

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md). Read this file only if you have a specific reason beyond those five entry documents.

# ADR ⌈NNNN⌋: ⌈Full title⌉

- **Status:** Proposed | Accepted | Superseded
- **Date:** ⌈YYYY-MM-DD⌉
- **Supersedes:** *(ADR numbers or none)*
- **Superseded by:** *(ADR numbers or none)*
- **Amends:** *(ADR numbers or none)*
- **Amended by:** *(ADR numbers or none)*

## Context

⌈What problem, forces, alternatives at a glance, and who needs this decision⌉.

## Decision

⌈Single clear statement—what we will do⌉.

## Consequences

- **Positive:** ⌈benefits⌉
- **Negative:** ⌈costs / accepted risks⌉
- **Follow-ups:** ⌈telemetry, backlog IDs, superseding work⌉

## Architecture notes *(optional)*

Use the sections from `.cursor/rules/architecture-outputs.mdc` when the change spans multiple hosts, data paths, or security boundaries.

### Objective

⌈⌉

### Assumptions

⌈⌉

### Constraints

⌈⌉

### Architecture overview

⌈⌉

### Component breakdown

| Component | Responsibility | Tests / owners |
|-----------|----------------|----------------|

### Data flow

⌈diagram or bullets⌉

### Security model

⌈authz, tenancy, secrets, abuse⌉

### Operational considerations

⌈deploy, rollout, observability, runbooks⌉

## Compliance / governance *(optional)*

⌈SOC 2 / procurement notes ONLY when the ADR materially changes boundary or subprocessors—not routine refactors⌉

## Lifecycle

⌈Who owns review, revisit trigger, deprecation policy⌉

## Links

- ⌈paths to code, TECH_BACKLOG, OpenAPI snapshots, terraform⌉
```
