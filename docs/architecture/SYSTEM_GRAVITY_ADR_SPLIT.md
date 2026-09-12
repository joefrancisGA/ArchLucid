> **Scope:** Contributor cheat sheet — locator vs surface vs instrument (ADR 0077 / 0079 / 0098). Internal engineering only.

**Created:** 2026-09-12 (SG-002). **Do not rewrite** the ADR bodies; quote this table in reviews.

## Three-layer model

| Layer | ADR | Question it answers | Working rule |
|-------|-----|---------------------|--------------|
| **Locator** | **0077** | What is the address bar / Start / last-open object? | `/architecture/architectures/{architectureId}` — never peer `reviewDetailPath` as Working Home. |
| **Surface** | **0079** | Where do Ask / Compare / Graph / Search / Findings live? | Nested under the architecture identity — not sibling `/insights/*` apps on Working. |
| **Instrument** | **0098** | Where does the **day’s work** live **after spawn**? | The **architecture desk** stays primary chrome; nested review-detail is a **job inspector**, not Monday morning. |

## Anti-patterns (fail SG done test)

| Anti-pattern | Why it fails 0098 |
|--------------|-------------------|
| Nested URL ⇒ review H1 is the owned system | Locator nested ≠ instrument nested; H1 must stay architecture display name. |
| Findings disposition only on `/governance/findings` when parent known | Exiles the architect from the desk instrument. |
| Finalize success → governance register as Home | Sealed child should highlight on the architecture desk. |
| “Continue in the review” as canonical work surface copy | Review is a **job of this architecture**, not the desk. |

## Guided split

Guided / demo / trial may keep peer review URLs and eval phrasing (ADR 0067). Instrument rules apply to **Working** only.

## Related

- [`0098-working-instrument-after-spawn-is-desk.md`](adrs/0098-working-instrument-after-spawn-is-desk.md)
- [`SYSTEM_GRAVITY_COMPOSER_PROMPTS.md`](SYSTEM_GRAVITY_COMPOSER_PROMPTS.md) (SG-001–120)
