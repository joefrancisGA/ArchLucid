> **Scope:** Copy-paste Composer prompts that close **all-day-desk wave-6 leftovers** after CD-01–15. Internal engineering only — not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Founding contract:** [`ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md`](../ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md) R4 / R13 · **UI standard:** [`../library/UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md)
> **Paste-ready files:** [`.cursor/prompts/all-day-desk-00-index.md`](../../.cursor/prompts/all-day-desk-00-index.md) (**AD-01–12**)
> **Shipped predecessors:** LI-01–15 (`master` #1397), LD-01–15 (#1421 / #1439), RS-01–15 (#1457), WA-01–24 (#1496)
> **Wave 5:** [`CAREER_DESK_COMPOSER_PROMPTS.md`](CAREER_DESK_COMPOSER_PROMPTS.md) (**CD-01–15**) — run first if still open; do not fork.
> **Wave 7 leftovers:** [`FOUNDING_DESK_COMPOSER_PROMPTS.md`](FOUNDING_DESK_COMPOSER_PROMPTS.md) (**FD-01–13**) — do not fork AD.
> **Wave 8:** [`INSTRUMENT_SPINE_COMPOSER_PROMPTS.md`](INSTRUMENT_SPINE_COMPOSER_PROMPTS.md) (**IS-01–15**)
> **Wave 9:** [`LIVELIHOOD_SPINE_COMPOSER_PROMPTS.md`](LIVELIHOOD_SPINE_COMPOSER_PROMPTS.md) (**LS-01–12**)
> **Wave 10 leftovers:** [`SEALED_DESK_COMPOSER_PROMPTS.md`](SEALED_DESK_COMPOSER_PROMPTS.md) (**SD-01–12**)

# All-day-desk Composer prompts (AD-01–AD-12)

**Created:** 2026-09-04 · **Status:** ready to run **after CD-01–15** (or in parallel except AD-01 vs CD-10 on finding inspect) · **Do not re-run LI, LD, RS, WA, or CD.** Wave 7: [`FOUNDING_DESK_COMPOSER_PROMPTS.md`](FOUNDING_DESK_COMPOSER_PROMPTS.md) (**FD-01–13**). Wave 8: [`INSTRUMENT_SPINE_COMPOSER_PROMPTS.md`](INSTRUMENT_SPINE_COMPOSER_PROMPTS.md) (**IS-01–15**). Wave 9: [`LIVELIHOOD_SPINE_COMPOSER_PROMPTS.md`](LIVELIHOOD_SPINE_COMPOSER_PROMPTS.md) (**LS-01–12**). Wave 10: [`SEALED_DESK_COMPOSER_PROMPTS.md`](SEALED_DESK_COMPOSER_PROMPTS.md) (**SD-01–12**).

ArchLucid is a working-architect tool: people will sit in it much of the day, and their livelihoods may depend on the sealed record. **CD-01–15** owns eval-first teaching, stamp/print honesty, and remaining amend mounts.

This set is **wave 6** — leftovers from a livelihood-grade UX audit of the architect workspace. It does **not** rewrite the product spine. It does **not** change `typed-engine-protected`. It does **not** restore breadcrumbs (**TB-2090**). It does **not** collapse desktop review tabs.

Paste **one** `.cursor/prompts/all-day-desk-NN-*.md` file per Composer session. Do not implement from this document’s tables.

## The problem these prompts solve

Casual tools optimize first-run success, sample recovery, wizard collapse, wait-on-this-tab, confirm-then-forever, and a package that looks done.

Livelihood tools optimize resume, keyboard work, in-flight queue, amendable writes, honest coverage, a cited “no,” a trail at the stamp, and a meeting that survives token refresh.

Production UX now has Working overlays and CD/WA gates. The remaining failures are: finding inspect fields that drop on sidebar navigation, one-click cancel of a long review pipeline, inverted deep-page back links, new drafts that cannot enqueue offline until they have an id, last-visit dots that are this-browser only, a collab strip that is honest but stale, eleven-column hubs with no sticky identity, TB-2155 recovery only on four roots, Azure Boards still deferred from the dirty-guard inventory, and shortcut docs that still describe an old listener mount.

## Diagnosis → prompt

| Class | Prompt | Residual after CD-01–15 |
|-------|--------|-------------------------|
| Continuity | **AD-01** | Finding inspect dirty fields are not in the livelihood-guard inventory |
| Career defense | **AD-02** | In-flight **Cancel** has no confirm dialog |
| Wayfinding | **AD-03** | Deep-page back links invert by buyer-polish |
| Continuity | **AD-04** | New-draft offline queue requires a persisted architecture id |
| Honesty | **AD-05** | Last-visit watermarks are `localStorage` only |
| Honesty | **AD-06** | Recent-actor strip has no as-of / refresh |
| Throughput | **AD-07** | Reviews hub has eleven columns, no seat layout |
| Recovery | **AD-08** | TB-2155 golden-path inventory is four roots |
| Continuity | **AD-09** | Azure Boards connection form still deferred (LD-12) |
| Discoverability | **AD-10** | Keyboard shortcut docs still say header is outside the listener |
| Recovery | **AD-11** | Full-operator draft load failure is not TB-2155 |
| Throughput | **AD-12** | Virtualized queues clip identity columns at 1280px |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **AD-01** Finding inspect dirty | Prefer first | LD-12 / RS-07; not CD-10 (amend) |
| **AD-09** Azure Boards dirty | After AD-01 preferred | LD-12 deferred list |
| **AD-02** Cancel confirm | Independent | LI-08 affordance |
| **AD-04** New-draft offline | Independent | LI-12 queue |
| **AD-03** Back links | Independent | TB-2090; do not restore crumbs |
| **AD-05** / **AD-06** | After AD-01 if both touch inspect | WA-14 / RS-11 |
| **AD-07** / **AD-12** | Independent | WA-14 / WD-12 |
| **AD-08** / **AD-11** | After naming roots | TB-2155 |
| **AD-10** Docs truth | Independent | PT-09 |

## Intentional — do not “fix”

- Desktop review tabs stay a full strip (no **More** menu).
- Working mode does not remount the first-review progress strip.
- Collab is recent disposition history, not live occupancy (AD-06 adds freshness only).

## Global constraints

See [`.cursor/prompts/all-day-desk-00-index.md`](../../.cursor/prompts/all-day-desk-00-index.md). Same as CD: no desktop **More** menu; no `typed-engine-protected` change; no ADR 0067 rewrite; no GTM cohorts **M-90 / M-44 / M-91 / M-92**; no reopening **TB-135 / TB-136**; TB-645 vocabulary; focused Vitest; scoped compile only for C#.

## Do not re-run

- **CD-01–15** — wave 5 leftovers; do not implement from AD files
- **WA-01–24** — shipped #1496
- **RS-01–15** — shipped #1457
- **LD-01–15** — shipped #1421 / #1439
- **LI-01–15** — shipped #1397
- **PT-01–20** / **WD-01–12** / **DD-01–10** — owners; AD files name leftovers only
- **FD-01–13** — wave 7 founding leftovers; do not implement from AD files
