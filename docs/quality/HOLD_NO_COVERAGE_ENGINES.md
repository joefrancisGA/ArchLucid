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

## Related

- [`INSIGHT_DENSITY_MISS_CLAUSE.md`](INSIGHT_DENSITY_MISS_CLAUSE.md)
- [`../architecture/INSIGHT_DENSITY_COMPOSER_PROMPTS.md`](../architecture/INSIGHT_DENSITY_COMPOSER_PROMPTS.md) — do not start table
- [`../go-to-market/GTM_BACKLOG.md`](../go-to-market/GTM_BACKLOG.md) — **G-REAL-06**
