# Founder UI — absorption process + exploratory cadence

**Status:** Adopted (2026-07-28)  
**GTM:** **M-100** (manual → automated absorption), **M-102** (unscripted exploratory cadence)  
**Parent:** [`../architecture/FOUNDER_UI_ACCEPTANCE_ROUTINE.md`](../architecture/FOUNDER_UI_ACCEPTANCE_ROUTINE.md)  
**Owner execution:** **G-QA-03** (run exploratory; promote defects), **G-QA-02** (pre-beta checklist)

This doc institutionalizes two habits so manual regression shrinks without losing judgment.

---

## M-100 — gradual manual → automated absorption

### Rule of two

Any **click-path** or **“is this page broken?”** check the founder (or reviewer) performs **twice** across controlled betas becomes a tagged Playwright test before the next controlled cut:

| Catch | Promote to |
|-------|------------|
| Same route fails / blank / wrong heading twice | `@founder` (and `@critical` if it would block a beta demo) |
| Buyer first-session step | `@founder` + `@buyer-journey` |
| Post-deploy marketing / showcase smoke | `@founder` + `@release-smoke` |
| Unexpected console / failed XHR | Prefer extending `e2e/founder-console-network.spec.ts` allowlist **only** for benign noise; otherwise fix product or add an assertion |
| A11y regression on a founder route | Prefer `e2e/founder-a11y.spec.ts` / shared `founder-acceptance-routes.ts` |

Prefer **tagging an existing** live/mock spec over inventing a parallel suite. Shared routes: `archlucid-ui/e2e/helpers/founder-acceptance-routes.ts`.

### How to absorb (engineering checklist)

1. Reproduce once against `ACCEPTANCE_BASE_URL` (or local loopback).
2. Add or tag a test (`{ tag: ["@founder", …] }` on the `test.describe`).
3. Run locally: `npm run test:e2e:founder` (or the file) against the same URL.
4. Retire the matching row from the manual checklist / defect log (mark **Automated** + link the spec path).
5. Optionally bump the suite-growth ledger below.

Do **not** absorb pure UX judgment (“wording feels off”, “would I demo this?”) — that stays in **M-102**.

### Suite growth ledger

Baseline after **M-96–M-98** / **M-104–M-105** (2026-07-28): ~**47** `@founder` tests across ~**27** files (`npx playwright test -c playwright.founder.config.ts --grep @founder --list`).

| Date | `@founder` tests (approx) | Notes |
|------|---------------------------|--------|
| 2026-07-28 | 47 | Initial tagged suite + founder console/a11y specs |
| _next cut_ | | After absorbing defects from **G-QA-03** / **M-106** |

Update one row per controlled beta (or when a batch of promotions lands).

### Defect log → promotion template

Copy into deal notes, a scratch pad, or append under [`PRODUCTION_DEFECT_LOG.md`](../library/PRODUCTION_DEFECT_LOG.md) when production-facing:

```markdown
### Founder UI defect — YYYY-MM-DD

- **Surface / URL:**
- **Symptom:**
- **Seen before?** (first time / second+ → absorb)
- **Severity:** blocks demo / buyer confusion / cosmetic
- **Disposition:** fix now / accept for this cut / automate (**M-100**)
- **Automation:** spec path + tags (when done)
```

---

## M-102 — unscripted exploratory cadence

### When

After **lane 2** tools pass against the chosen site (founder Playwright + console/network + axe; Lighthouse when relevant):

1. Before each **controlled beta** cut (**G-QA-02** / **M-106**).
2. After a **meaningful IA or buyer-path** change (shorter 10–15 min OK).

### Timebox

| Phase | Minutes | Trend |
|-------|---------|--------|
| Default | **15–30** | Shrink toward **15** as **M-100** absorbs click-paths |
| Floor | **10** | Never zero — judgment / embarrassment checks stay human |
| Cap | **45** | Stop; log remaining ideas as defects, do not turn into an all-day QA session |

### Script (questions only — no click checklist)

Use the product as a **first-time buyer / sponsor**, not as the person who built it:

1. Can I tell what to do next?
2. Can I find a feature without remembering its route?
3. Does terminology stay consistent?
4. Am I sent between disconnected experiences?
5. Do loading states explain what is happening?
6. Can I recover from mistakes?
7. Does anything look technically or commercially embarrassing?
8. Would I feel comfortable demonstrating this screen to a buyer?

Optional companions (do not replace this session): `lucid-ui-audit` skill, UX-audit screenshot jobs.

### Exit

- Log accepted defects (template above / **M-101**).
- Any deterministic “page broken / click-path” item caught **twice** → file under **M-100** before the next cut (**G-QA-03**).
- Judgment-only findings may remain accepted with an explicit note — never silent.

---

## Related commands

```bash
cd archlucid-ui
ACCEPTANCE_BASE_URL=https://your-host.example ACCEPTANCE_SKIP_LIVE_INFRA=1 FOUNDER_PUBLIC_ONLY=1 \
  npm run test:e2e:founder:release-smoke
ACCEPTANCE_BASE_URL=https://your-host.example npm run lighthouse:acceptance
```

Scheduled warn-only CI: [`.github/workflows/founder-ui-acceptance.yml`](../../.github/workflows/founder-ui-acceptance.yml) (**M-103**).
