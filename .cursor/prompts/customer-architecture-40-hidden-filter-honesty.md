# CA-40 — Hidden-filter honesty

**Skip if** DA-08 already shipped on the surfaces you would touch. **Do not** change density demotion (IS-05).

## Goal

When a density / status / “hide generic” filter hides rows of **open work** (findings, reviews, architectures):

1. Visible **Hidden {k}** (or “Showing {n} of {total}; {k} hidden by filters”).
2. Architecture desk child reviews and Working findings lists included.
3. Do not treat “hidden because sealed/archived” the same as “hidden by density” — name the filter.

## Why

Open work that disappears without a count is a missed finding in a meeting.

## Context

- DA-08 (do not paste)
- `governance-findings-density-sort.ts`
- Findings visibility helpers

## What to build

1. Count helper + strip on Working lists you touch.
2. Vitest: filter hides 3 → copy includes 3.

## Acceptance criteria

- Working cannot look like the queue is empty when filters hid rows.
- Guided may keep denser teaching filters **with** the same count.

## Constraints

- Do not drop checklist rows from career inventory without counting (CA-41).
- No typed-engine gate change.
