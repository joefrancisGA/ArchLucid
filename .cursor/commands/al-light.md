# Light desk — `/al-light`

Run a **light rescore** of the **47 architectural qualities** for **SecureNow** and **ArchLucid**, show **deltas since the latest full or light desk anchor**, and emit a **numbered backlog of engineering-safe score-improvement suggestions**. **Read-only** unless the user explicitly asks to write `docs/assessments/` or implement a batch.

Default model: **Composer 2.5 slow** (`composer-2.5`). Do not substitute fast tier without override rules in `.cursor/rules/Model-Allowlist-Override.mdc`.

---

## Arguments

```text
/al-light
/al-light <count>
/al-light "<focus>"
/al-light <count> "<focus>"
```

| Argument | Meaning |
|----------|---------|
| **`<count>`** | Number of **codable follow-up suggestions** to produce. **Default `35`**. Integer **5–50** (clamp; if missing or invalid, use **35**). |
| **`"<focus>"`** | Optional scope hint (e.g. `partial capture`, `compare`, `digest browse`). Biases suggestion ordering and evidence reads; does **not** change the 47-quality weight formula. |

With **no arguments**, use **35** suggestions and no focus filter.

---

## Guardrails (read first)

1. Load **`.cursor/skills/assessment-scope-v1_1/SKILL.md`** (or rule **`Assessment-Scope-V1_1`**) — dual **`(A)` headline** vs **`(B)` procurement** scoring.
2. Apply workspace rules: **GTM-V1_1-assessment-exclusions** (#2, #3, #5, #6), **V1_1-assurance-backlog** (#23, #25 parked), **no PathRankingEngine replacement**, **no compliance route remap** as score-lift bait.
3. **Do not** reduce **`(A)`** for absent CPA SOC 2, third-party pen test publication, design partner, GTM cohorts, MCP/SDK/marketplace, or AT user studies — cite under **`(B)`** only.
4. **Suggestions must be engineering-safe** (UI honesty, empty-vs-failure, partial-capture recovery, tests, CI drift guards) — not owner cohorts, not pen-test vendor SoW, not public pricing.
5. **Do not** commit assessment markdown or implement code unless the user asks in the same or a follow-up message.

---

## Quality model (47 / 120)

- **Products:** **SecureNow** and **ArchLucid** (separate headline **`(A)`** scores).
- **Qualities:** **47** named dimensions with fixed weights; **total weight = 120** (`46 × weight + Cutting-Edge AI Technology at 8`), as used in **`docs/assessments/FRESH_DESK_*_FULL_RESCORE.md`**.
- **Headline formula:** `sum(score × weight) / 120` → percentage with two decimal places.
- **Light pass:** Re-score **only** qualities with **new evidence** since the anchor (merged score-lift CHANGELOG entries, honesty modules, mounted contract tests, or focused code reads). **Do not** re-justify all 47 rows in prose — defer unchanged qualities to the anchor file.

The abbreviated **`docs/library/ASSESSMENT_QUALITY_MODEL.md`** (9 qualities / weight 45) is **not** the light-desk model; cite it only for definitions when helpful.

---

## Workflow (strict order)

### Step 0 — Parse inputs

- `suggestionCount` = first numeric token, default **35**, clamp **5–50**.
- `focus` = quoted string if present; else optional trailing free text after count.

### Step 1 — Resolve baseline anchor

Find the **most recent** desk artifact under `docs/assessments/`:

1. **Prefer** `LIGHT_DESK_*.md` — sort by date in filename / `**Scored:**` line (newest wins).
2. Else **latest** `FRESH_DESK_*_FULL_RESCORE.md`.
3. Else fall back to headline tables in **`docs/assessments/LATEST_GPT55.md`** (note weaker anchor in output).

Record from the anchor:

- **SecureNow** and **ArchLucid** headline **`(A)`** (percent + weighted sum `N/120` if present).
- Anchor **kind** (light vs full), **scored date**, **score-lift round / PR** if cited.
- **Last full desk** headline (if anchor is light, keep cumulative vs full desk from anchor or nearest `FRESH_DESK_*`).

### Step 2 — Discover delta since anchor

On **`origin/master`** (run `git fetch origin master` once if needed):

- `git log <anchor-merge-ish>..origin/master --oneline` — emphasize **Merge pull request** and **`score-lift-round`** branches.
- Read **`docs/CHANGELOG.md`** entries for **Score lift round** batches since the anchor date/round.
- Skim **only** code paths mentioned in those CHANGELOG lines (plus `focus` surfaces if set). Use **Grep/Read**, not broad `dotnet test` unless the user asked.

Build a short table: **what shipped since anchor** (surface | product | honesty/wiring).

### Step 3 — Light rescore (47-quality discipline)

For **each product**:

1. Start from the anchor’s **per-quality scores** (if the anchor only lists **row-level nudges**, carry forward unstated qualities from the cited **FRESH_DESK** table).
2. Apply **only** score changes justified by Step 2 evidence (typically **0–8** qualities per product on a single round).
3. Recompute headline **`(A)`** with integer quality scores and weight **120**; show mechanical weighted sum delta.
4. Produce **Headline `(A)`** table: Prior light/full → New light → **Delta (pp)** + anchor link.
5. Produce **Row-level nudges** table: Quality | SecureNow | ArchLucid | Why — **only changed rows**.
6. Include standard sections: **Unchanged caps**, **`(B)` procurement realism (weight 0)**, **Most important truth** (honest-capped vs feature-capped).

Optional: if the user passed **`--full-table`** (not default), append compact 47-row tables for both products (scores only, one line justification max). **Default chat output omits full 47 tables.**

### Step 4 — Diff since last desk (explicit)

Add a subsection **Differences since anchor** with:

| Dimension | At anchor | After this light pass | Delta |
|-----------|-----------|------------------------|-------|
| SecureNow `(A)` | … | … | … |
| ArchLucid `(A)` | … | … | … |
| Cumulative vs last **FRESH_DESK** | … | … | … |
| Qualities touched (count) | — | list names | — |
| Score-lift rounds absorbed | anchor round | through round **N** | — |

If **no** material code delta since anchor, say so, keep headline **`(A)`** flat, and still emit suggestions from **remaining backlog** (do not invent fake deltas).

### Step 5 — Generate `suggestionCount` suggestions

Title: **`Codable follow-ups (round N+ backlog — <count> engineering-safe suggestions)`**.

Rules:

- **Omit** anything already shipped per Step 2 and anchor backlog strikethroughs.
- Number **1..N** with columns: **# | Suggestion | Product** (SecureNow / ArchLucid / Both).
- Prioritize by **weighted deficiency** on the **new** light scores (high `(100−score)×weight` first), then **`focus`** if provided.
- Each item: **one shippable honesty or wiring outcome** (copy module + surface + optional `data-testid` / mounted contract / `assert-score-lift-round*.py`).
- End with **Do not reopen:** bullet (same standing exclusions as prior light desks).

### Step 6 — Output and optional persist

- **Default:** Print the full light desk in **chat** (markdown), matching the tone/sections of `docs/assessments/LIGHT_DESK_2026_11_15_POST_ROUND53.md`.
- **Do not** write `docs/assessments/LIGHT_DESK_*.md` unless the user says **commit desk**, **save assessment**, or **write light desk to repo**.
- If persisting: filename `docs/assessments/LIGHT_DESK_YYYY_MM_DD_POST_ROUND<nn>.md` or `POST_BATCH<nn>.md`; do not stage unrelated assessment files.

---

## Relation to other commands

| Command | Role |
|---------|------|
| **`/al-light`** | Light **47-quality** desk + deltas + suggestion backlog (this command) |
| Full assessment prompts | `docs/assessments/ASSESSMENT_PROMPT_SERIES.md`, `FRESH_DESK_*` |
| **`/ship-next-improvement`** | Implements **one** TB/assessment row — not a substitute for light rescore |
| Score-lift implement PRs | User-driven batches (often the top items from the latest `/al-light` list) |

---

## Acceptance criteria

- [ ] Both products have headline **`(A)`** before/after with mechanical consistency (`N/120`).
- [ ] Anchor file named with path; delta since anchor is explicit.
- [ ] Unchanged qualities explicitly deferred to anchor (light pass, not silent full rescore).
- [ ] Exactly **`suggestionCount`** numbered suggestions (default **35**), engineering-safe, exclusions footer present.
- [ ] **`(B)`** procurement items not folded into **`(A)`**.