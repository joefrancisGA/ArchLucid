> **Scope:** Engineering hold — do not add coverage-shaped finding engines from assessment weakness prompts until G-REAL-06 names a category.

# Hold: no new coverage engines (V1)

**Status:** Active hold (WK-20). Tech TB tracking for resilience/DR/IAM-depth engines remains parked on **G-REAL-06**.

## Do not implement from Cursor weakness batches

Until the owner executes **G-REAL-06** with an explicit pillar/category decision, engineering agents must **not** add finding engines for:

- Resilience / DR semantics beyond existing coverage checks
- IAM depth beyond declaration + intake actors
- Secrets / key lifecycle
- Network segmentation semantics beyond edge presence
- Observability completeness
- Capacity planning

Adding engines that re-read `GraphSnapshot` grows the insight-density denominator without a buyer-validated category.

## Allowed alternatives

- UX honesty when engines are silent (WK-07, WK-18)
- Declaration property → Actor materialization (WK-08) as an **information source**, not a new coverage engine
- Policy-pack overlays and golden corpus expansion for **existing** engines

## Exception — insight-density excellence set (2026-09-06)

Owner strategy [`../architecture/INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`](../architecture/INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md) authorizes **path and contradiction** engines in [`../architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md`](../architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md) **DX-06–DX-09** (identity blast-radius, segmentation **rules**, DR/RPO vs replica, secrets lifecycle vs inventory) and follow-on [`../architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](../architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md) **DX-22** (checklist-cluster synthesis), **DX-24** (dangling declaration refs), **DX-25** (requirement × SKU/tier). Those engines must still fail closed when properties/inventory are missing — they must **not** emit “node type X is absent.”

Coverage-shaped engines (resilience/DR *presence*, IAM *depth as node-exists*, observability completeness, capacity planning) remain held.

## Related

- [`INSIGHT_DENSITY_MISS_CLAUSE.md`](INSIGHT_DENSITY_MISS_CLAUSE.md)
- [`../architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md`](../architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md) — **DX-01–DX-16** shipped (path engines DX-06–DX-09 authorized)
- [`../architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](../architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md) — **DX-22 / DX-24 / DX-25** authorized as synthesis/contradiction, not coverage
- [`../architecture/INSIGHT_DENSITY_COMPOSER_PROMPTS.md`](../architecture/INSIGHT_DENSITY_COMPOSER_PROMPTS.md) — ID-01–07 archive; do not re-run
- [`../go-to-market/GTM_BACKLOG.md`](../go-to-market/GTM_BACKLOG.md) — **G-REAL-06**
