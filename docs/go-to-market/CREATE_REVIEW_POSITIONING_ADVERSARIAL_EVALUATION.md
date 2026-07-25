> **Reviewed:** 2026-07-24

> **Scope:** Closed adversarial evaluation — create vs review positioning and buyer messaging. Assessment anchor for Done **TB-738**–**TB-747**; not an open engineering batch.

# Create review positioning — adversarial evaluation

**Audience:** Product, UI, and GTM authors updating `/reviews/new`, home dual-path cards, billing meter nouns, and marketing CTAs.

**Last reviewed:** 2026-07-24

**Status:** Closed — findings shipped as **TB-738**–**TB-747** (all **Done**). This file is the durable assessment pointer; implement detail lives in [`TECH_BACKLOG.md`](../library/TECH_BACKLOG.md) `## TB-738` through `## TB-747`.

---

## Verdict

| Question | Answer |
| --- | --- |
| Symmetric **create** / **review** as **workflows**? | **Yes** — both paths produce the same governed architecture package shape. |
| Symmetric **create** / **review** as **headline positioning**? | **No** — do not pitch two equal product nouns. Subordinate both verbs to the **architecture package** noun (evidence-package-first, review-led trust ladder). |

**One-sentence positioning rule:** Create and review are verbs; the artifact buyers hire ArchLucid for is an **architecture package** with findings, evidence, and a decision record — not “AI creates your architecture” as the lead claim.

**Guardrails for `/reviews/new`, wizard intake, and marketing CTAs:**

- Do **not** over-promise automated approval or production deployment.
- Do **not** lead create-path copy with commodity “generate from goals” without a born-governed follow-on (findings, risks, evidence, explicit limits).
- Prefer the **review / sample** path as **Recommended first** on first-run home surfaces.

---

## Deliverable index → shipped TB rows

| Theme (evaluation) | Backlog | Outcome (summary) |
| --- | --- | --- |
| List noun + empty states + drift guards | **TB-738** | **Architecture packages** vocabulary; hub/home/nav; Vitest drift guards |
| Home tagline + dual-path trust ladder | **TB-739** | Born-governed create promise; review/sample **Recommended first** |
| Created / Reviewed origin badges | **TB-740** | Package origin on list rows |
| Creation output parity with review | **TB-741** | Same agent pipeline / governance surfaces; create ≠ second-class |
| Inspectable created sample | **TB-742** | Demo seed + showcase created sample |
| Billing meter noun | **TB-743** | Packages/month (buyer-facing); internal keys may remain `review*` |
| Scorecard nav label | **TB-744** | **Architecture scorecard** |
| Demo scripts package-first | **TB-745** | `DEMO_QUICKSTART` / video script realigned |
| Positioning one-noun-two-verbs | **TB-746** | [`POSITIONING.md`](POSITIONING.md) alignment |
| Create intake feels like drafting | **TB-747** | Create wizard differentiated from evidence-only review intake |

---

## Related

- Cluster intro: [`TECH_BACKLOG.md`](../library/TECH_BACKLOG.md) (search **TB-738 — TB-747**)
- Glossary: [`UI_GLOSSARY_V1.md`](UI_GLOSSARY_V1.md) — **Architecture package**
- Public narrative: [`POSITIONING.md`](POSITIONING.md)
- Claim honesty: [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md)
