> **Scope:** Operator / SE demo script for ArchitectureIntelligence closed-loop reasoning on the golden incomplete fixture. Complements Specialty accelerator templates; does not replace [CORE_PILOT.md](../../CORE_PILOT.md).

# Architecture intelligence — golden-path demo

**Audience:** Sales engineers and architects demonstrating evidence-gated architecture reasoning.

**Goal:** Load an incomplete architecture → run closed-loop reasoning → answer interview questions → publish into findings/advisory → show product surfaces.

---

## Preconditions

- Operator UI reachable; ArchitectureIntelligence API enabled on the host.
- Optional: live Azure OpenAI for LLM-backed extraction/review (heuristic path still demos the loop).

---

## Script (≈12 minutes)

### 1. Enter from a product surface (discovery)

1. Open any finalized review (`/reviews/{runId}`).
2. Expand **Pipeline tools (operator)** → **Architecture intelligence**.
3. Confirm the inbound banner shows the scoped `runId` (`from=reviews`) and that **product intake auto-loads** (description + attached documents).

Alternate: from `/governance/findings`, use **Architecture intelligence** on a queue row (`from=findings`).

Direct URL: `/architecture/architecture-intelligence` (or load the golden fixture for a canned demo without a product run).

### 2. Confirm intake (or load golden fixture)

1. If opened from a product run: description textarea should already be filled; extra docs are included on run.
2. If demoting without a product run: click **Load golden fixture** (incomplete auth / ownership gaps).

### 3. Run closed-loop reasoning

1. Choose a **Review tier** (Trial / Standard / Deep) to show unit-economics tradeoffs.
2. From a hydrated product run: click **Analyze this review** (runs + publishes gated output in one step).
   Otherwise: **Run architecture reasoning** (optionally with publish-on-run), then **Publish to findings/advisory**.
3. Point out:
   - Model elements extracted (or heuristic fallback)
   - Specialist findings with conclusion / evidence-condition / disposition
   - Interview framing + evidence-driven questions
   - Trust / publish gate (integrity-passed ids, block reasons)
   - Economics line: cache hit/miss + estimated tokens vs tier budget
4. After publish: use **Open findings** / **Open review** / **Open advisory** — those links carry `?runId=` so findings/advisory open scoped to this review. Individual published findings also link to evidence trace.

### 4. Answer and continue

1. Fill one or two interview answers (e.g. business outcome, data classification).
2. Click continue (or re-run with answers) so the model records user-asserted evidence.
3. Show that re-review / recommendations update without inventing citations.

### 5. Publish into the product path

1. Enable **Publish gated findings/recommendations into product stores on run**, or click **Publish to findings/advisory**.
2. Open `/governance/findings` and/or advisory recommendations for the run.
3. Emphasize: only integrity-passed, non-blocked findings land in product stores.

### 6. Golden regression (optional CI story)

1. Click **Run golden test**.
2. Call out planted-defect recall, four category scores, and mutation change — the CI gate (`ArchitectureIntelligenceGoldenRegression`).

---

## Talking points

| Claim | Honest boundary |
| --- | --- |
| Closed loop from finding → interview → re-review | Heuristic path works offline; live LLM improves extraction/adversarial quality |
| Evidence integrity before publish | Stage-1 deterministic integrity fails closed without citations |
| Unit economics | Per-tier estimated-token budgets + dependency-manifest cache (TB-1992) |
| Not a replacement for Core pilot | Core finalize + sponsor export remains the first-value spine |

---

## Related

- UI: `/architecture/architecture-intelligence`
- API: `POST /v1/architecture-intelligence/run`, `…/golden-test`, `…/runs/{runId}/continue`, `…/publish`
- Specialty catalog: [walkthroughs/README.md](README.md)
