# PC-05 — Monday morning opens the architecture portfolio desk

**Do not fork CA-25–38** if those rows already shipped — skip and note in PR. **Do not merge SQL tables.** **Do not fork LD-06** empty Working home if already one door.

## Goal

Working **Home** and **Overview** primary resume target is the **architecture portfolio** (`/architecture/architectures` identity list or per-architecture desk), not the reviews hub or draft list. In-flight reviews appear as **children** of an architecture row or a single “In flight” strip — not as a second start product.

## Why

Livelihood unit of work is the **system you own** (ADR 0074), not the last pipeline run. Casual tools open the job queue; professional tools open the document set.

## Context

- `ArchitectureIdentityListClient`, architecture desk routes (CA)
- `use-working-start-href.ts`, `resolveWorkingStartHref`
- `in-flight-operations-store`, `use-rehydrate-in-flight-from-architecture`
- ADR 0074, ADR 0069

## What to build

1. Working Home hero / resume card: last-open **architecture** (server prefs IS-13) with children counts (draft, open review, latest seal).
2. Primary CTA: **Open architecture** or **Resume** — not peer “Start review” / “Create architecture” cards.
3. Reviews hub remains reachable; demote as default Monday entry in Working only.
4. Vitest: Working fixture lands on architecture desk href from Home resume.

## Acceptance criteria

- Paying Working user reopens yesterday’s **named system**, not an anonymous run id.
- Guided keeps ADR 0067 peer teaching.

## Constraints

- No desktop review tab **More** menu.
