---
description: Rate a UI screenshot with Opus High, ship every fix in the backlog with Composer 2.5, commit to master, and update traffic estimates
---

# Rate UI from screenshot (`/al-ui-rate`)

Owner/operator screenshot critique **plus remediation pipeline** for ArchLucid UI surfaces. Distinct from `/al-ui-score` (workbook score write only) and `/lucid-ui-audit` (persona screenshot suite). This command rates **what is visible in the attached screenshot**, then fixes **every concrete issue** in the critique backlog — P0, P1, and P2 — not only ship-blockers.

One invocation runs four phases end to end, with **no owner approval gate between them**:

| Phase | Who runs it | Output |
|-------|-------------|--------|
| **1 — Rate** | **Opus High** subagent (`claude-opus-5-thinking-high`) | Critique + full prioritized fix backlog + current/projected scores |
| **2 — Implement** | **Composer 2.5** subagent (`composer-2.5`) | Code changes for the **entire** fix backlog + scoped verification |
| **3 — Ship** | Parent agent | Commit + push to **`master`**, CI gate |
| **4 — Score** | Parent agent | UX + Evidence scores and Note in the owner traffic workbook |

**Required input:** at least one **screenshot attachment**. Without an image, stop and ask — do not invent a screen.

**Default git target:** **`master`** (this command explicitly names the branch; the user may override by naming another branch in the same message).

---

## Arguments

```text
/al-ui-rate
/al-ui-rate <ID>
/al-ui-rate <ID> "<optional context>"
/al-ui-rate "<optional context>"
/al-ui-rate <ID> --rate-only
```

- **Screenshot** (required) — attach one or more images to the message.
- **`<ID>`** (optional) — owner workbook route shorthand (e.g. `ASK`, `GFN`). When present, resolve path/section from `.local/owner/ui_route_traffic_estimates.md` for orientation and for the Phase 4 score write.
- **`"<optional context>"`** (optional) — free text: intended persona, demo mode (buyer-polished vs full architect workspace), what the user was trying to do, known env quirks.
- **`--rate-only`** (optional) — stop after Phase 1. No code changes, no commit, no workbook write. Also honor plain-language equivalents in the context text ("just rate this", "critique only").

Examples:

```text
/al-ui-rate [+ screenshot]
/al-ui-rate ASK [+ screenshot]
/al-ui-rate GFN "sponsor demo, buyer-polished shell" [+ screenshot]
/al-ui-rate GRS --rate-only [+ screenshot]
```

If **no screenshot** is attached, stop:

> Attach a screenshot of the screen to rate. Usage: `/al-ui-rate [ID] ["context"]` + image.

---

## Guardrails (read first)

- **The parent agent must not rate the screen itself.** Phase 1 is always delegated to an **Opus High** subagent, regardless of which model the parent is running. Do not skip delegation because the parent "can see" the screenshot.
- **Screenshot-derived facts are inferred** — label route, tenant, error text, and mode as **(inferred from screenshot)** unless the user confirmed them in text.
- Follow ArchLucid product language (`docs/library/UI_DESIGN_SYSTEM.md`, `archlucid-ui/AGENTS.md`): *architecture package*, *finding*, *evidence trail*, *sealed review record*, *decision*, *governance approval*, *audit trail* — not *run* / *job* / *alert* (unless it is an alert) / *log*. Never call the package a *signed decision record*.
- Ground visual judgment in **IBM Carbon + Fluent 2 shell** standards in `docs/library/UI_DESIGN_SYSTEM.md` (neutral surfaces, restrained teal accent, compact enterprise spacing, `StatusTag` / `SeverityTag`, disclosure for technical IDs).
- **Do not** soften the critique to spare feelings — the brief below requires brutal honesty.
- **Do not** invent backend defects you cannot see; if a failure mode is only suspected, mark it **hypothesis** and exclude it from Phase 2 scope.
- **Do not** create `TB-###` / `PD-###` rows unless the user explicitly asks (e.g. "escalate to TB"). Committing UI fixes to `master` and writing the workbook **are** in scope for this command.
- **Do not** treat decorative marketing polish as enterprise readiness when the screen is an operator/architect surface.
- **Do not** leave P1/P2 backlog items unimplemented when they are safe, surface-scoped UI fixes — this command ships **all** backlog items, not P0-only.
- Follow `.cursor/rules/Agent-Working-Tree-Safety.mdc` before editing tracked files; stage **only** paths changed for this run — never `git add -A`.
- Follow `.cursor/rules/shell-hygiene.mdc` and `.cursor/rules/shell-heartbeat.mdc` for every shell.

---

## Critique brief (use verbatim)

This brief is the evaluation stance for Phase 1 — pass it to the Opus High subagent **exactly**, without paraphrase or softening:

> Critique this as if you were the design lead for Microsoft Azure Portal. Be brutally honest. Focus on enterprise UX, information architecture, visual hierarchy, trustworthiness, accessibility, discoverability, and buyer confidence. Produce a complete prioritized fix backlog covering every concrete issue you find on this screen, no matter how small. Tag each item P0, P1, or P2 by severity.

Apply that stance to **each** attached screenshot. If multiple images show a flow, critique the flow as a sequence and still emit one consolidated fix backlog.

---

## Workflow (strict order)

### Step 0 — Parse inputs

1. Confirm at least one image attachment; otherwise stop.
2. Parse optional **ID** (uppercase if present), optional context text, and `--rate-only`.
3. If ID is present and `.local/owner/ui_route_traffic_estimates.md` exists, look up Path / Section / current Scores / Notes (read-only) to orient Phases 1 and 4.
4. Resolve the local file path of each attached screenshot — Phase 1 needs it to attach the images to the subagent.

---

### Phase 1 — Rate (Opus High subagent, always)

Launch **one** `Task` subagent:

| Setting | Value |
|---------|-------|
| `subagent_type` | `generalPurpose` |
| `model` | **`claude-opus-5-thinking-high`** |
| `run_in_background` | `false` |
| `file_attachments` | Every attached screenshot path |
| `description` | `UI rating (Opus High)` |

The subagent prompt must contain:

1. The **critique brief** above, verbatim.
2. The route ID / path / section / current scores when known, and the user's context text.
3. The product-language and Carbon/Fluent grounding rules from **Guardrails**, plus pointers to `docs/library/UI_DESIGN_SYSTEM.md` and (only when buyer confidence is in play) `docs/go-to-market/BUYER_PERSONAS.md`.
4. Instruction to skim the matching route component(s) via Grep/Glob **only** to name concrete fix targets — file paths make Phase 2 implementable.
5. The seven critique lenses and the fix backlog item schema below.
6. The **rating output contract** below — the subagent's final message must end with it.

#### Critique lenses (subagent must cover all)

| Lens | Ask |
|------|-----|
| Enterprise UX | Would a cloud operator trust this at 2am? Density, scanability, irreversible-action safety |
| Information architecture | Is the primary job obvious in one glance? Are secondary tools crowding the primary path? |
| Visual hierarchy | What does the eye hit first / second / third? Is that the correct priority? |
| Trustworthiness | Status honesty, provenance, no fake polish, no unexplained empty chrome |
| Accessibility | Contrast, hit targets, focus order cues, text alternatives, tag/color-only status |
| Discoverability | Can a new buyer or architect find the next correct action without tribal knowledge? |
| Buyer confidence | Would a procurement sponsor or principal architect dismiss this screen in the first 30 seconds? |

Be concrete: cite **what is visible** (regions, labels, spacing, competing CTAs). No generic "improve UX" advice.

#### Fix backlog item schema

Every concrete issue goes in the backlog. Tag severity honestly — **do not** park small fixes outside the backlog as "optional commentary."

| Field | Content |
|-------|---------|
| **Severity** | `P0`, `P1`, or `P2` |
| **Title** | Imperative, specific (≤12 words) |
| **Why** | One sentence: what fails for enterprise / buyer if unfixed (scale urgency to severity) |
| **Evidence** | What in the screenshot proves it (inferred as needed) |
| **Fix direction** | Concrete UI/IA change; name likely file/component when known |
| **Acceptance** | Observable pass condition on this screen |

Severity guide:

| Tag | Meaning |
|-----|---------|
| **P0** | Ship-blocking — broken trust, blocked primary task, severe a11y, or buyer-demo embarrassment |
| **P1** | Meaningful polish — visible hierarchy, spacing, copy, or discoverability gaps that hurt scanability |
| **P2** | Small but real — minor contrast, label consistency, disclosure placement, redundant chrome |

Rules:

- Include **every** concrete issue you can ground in the screenshot or named components — no matter how small.
- Prefer **5–15** backlog items when the screen warrants it; sparse screens may have fewer. Do **not** inflate with vague advice.
- List **hypothesis** / needs-repro items separately — they are **not** part of `fix_count`.
- Merge duplicates across screenshots. Order by severity (P0 first, then P1, then P2).

#### Rating output contract (required tail of the subagent's reply)

```text
RATING
evidence_current: <0-100>
evidence_projected: <0-100>   # if every backlog item below ships
ux_current: <0-100>
ux_projected: <0-100>         # if every backlog item below ships
fix_count: <n>               # non-hypothesis backlog items (P0+P1+P2)
p0_count: <n>                # P0 subset only (reporting)
one_line_verdict: <=15 words
```

Both dimensions match the workbook's Scores series: **Evidence** is position 1 (traceability, provenance, sponsor-safe citations); **UX** is position 2, scored against `docs/library/UI_UX_SCORING_RUBRIC.md` when that rubric exists and against the seven lenses above when it does not. `*_projected` must never be below `*_current`.

**Print the full critique and fix backlog in chat** before starting Phase 2 — the owner reads it while the work proceeds; it is not an approval gate.

**Stop here** when `--rate-only` was requested, when `fix_count` is **0** (only hypothesis items), or when every backlog item is marked **hypothesis** / needs-repro. In the zero-fix case, still run Phase 4 with `shipped = 0` (see the cap formula) so the workbook records the rating.

---

### Phase 2 — Implement (Composer 2.5 subagent)

Launch **one** `Task` subagent:

| Setting | Value |
|---------|-------|
| `subagent_type` | `generalPurpose` |
| `model` | **`composer-2.5`** |
| `run_in_background` | `false` |
| `description` | `Ship UI fix backlog (Composer)` |

The subagent prompt must contain:

1. The **full fix backlog verbatim** from Phase 1 (P0, P1, and P2), including each item's Fix direction and Acceptance.
2. Route ID, path, and the named component files.
3. Repo conventions it cannot infer: `archlucid-ui/AGENTS.md`, `docs/library/UI_DESIGN_SYSTEM.md`, `.cursor/rules/UI-Enterprise-Design-Standard.mdc`, `.cursor/rules/Agent-Working-Tree-Safety.mdc`.
4. Scope fence: implement **every** backlog item (P0, P1, P2) except hypothesis / needs-repro; no drive-by refactors beyond what backlog items require; no `TB-###` edits; no commits or pushes — the parent commits.
5. Verification duty: update or add unit tests / snapshots for changed components and run the scoped checks below.
6. Reporting duty: return **per backlog item** a status of `shipped` / `partial` / `skipped` with a one-line reason, plus the exact list of changed file paths.

#### Quality gate (Composer runs, parent verifies before commit)

1. **`/check-compiler-errors`** — scoped type-check/tests for the touched area (`.\scripts\ci\agent-compile-check.ps1 -Ui`, or the targeted `npm run test` for changed components). Fix failures before continuing.
2. **`/deslop`** — strip AI slop from the diff (narrating comments, defensive try/catch, `any` casts, needless nesting).
3. **`/review-bugbot`** — Bugbot subagent with `Diff: uncommitted changes`. Fix Critical/High findings.
4. **`/review-security`** — Security Review subagent with `Diff: uncommitted changes`. Fix Critical/High findings.
5. Re-run step 1 once if steps 2–4 changed code.

If a backlog item cannot be shipped safely (needs backend work, blocked by a dirty tracked path, or the fix is larger than this surface), mark it **skipped** with the reason rather than half-landing it. Skipped items lower the Phase 4 score cap, which is the intended honest outcome.

---

### Phase 3 — Ship to `master`

1. `git status --short` — confirm the changed paths match Composer's reported list; investigate anything unexpected before staging.
2. Stage **only** those paths. Never `git add -A`.
3. Confirm the working tree is on **`master`** (or the branch the user named); tell the user before switching branches.
4. Commit with one concise why-focused sentence naming the surface, e.g.
   `al-ui-rate ASK: raise primary CTA, status tag contrast, and spacing polish.`
5. Push to **`master`**.
6. **CI gate** — follow `/fix-ci`: `gh run list --branch master --limit 1`, then `gh run view --log-failed` on that run. Fix one failure at a time and push until green. Do not proceed to Phase 4 with known-red CI for this change.

---

### Phase 4 — Update traffic estimates

The workbook at `.local/owner/ui_route_traffic_estimates.md` is **gitignored** — these writes are local and are not part of the Phase 3 commit.

1. **Resolve the ID.** Use the supplied `<ID>`; if none was given, match the inferred route path against the workbook. If no unambiguous match exists, **skip this phase** and say so in the report — do not guess an ID.
2. **Working-tree safety:**

```powershell
.\scripts\agent\check-working-tree-path.ps1 -Path '.local/owner/ui_route_traffic_estimates.md'
```

Exit code **2** → stop Phase 4 and report the block. If the workbook is missing:

```powershell
python .\scripts\ci\bootstrap-ui-route-traffic-owner-workbook.py
```

3. **Compute the shipped-capped scores.** With `shipped` = backlog items Composer reported as `shipped` (count `partial` as 0.5) and `total` = `fix_count` from the rating:

```text
final = round(current + (projected - current) * shipped / total)
```

`total = 0` → `final = current`. Never write above `projected`, never below `current`. Apply the formula independently to the Evidence and UX dimensions.

4. **Write both dimensions** (UX drives Weight/Deficit and the table sort):

```powershell
python .\scripts\ci\set-archlucid-ui-route-score.py <ID> <ux_final> --dimension ux
python .\scripts\ci\set-archlucid-ui-route-score.py <ID> <evidence_final> --dimension evidence
```

5. **Write a dated Note** carrying the verdict and what remains:

```powershell
python .\scripts\ci\set-archlucid-ui-route-note.py <ID> "<YYYY-MM-DD> al-ui-rate: <one_line_verdict>; shipped <n>/<total> fixes (<commit sha>); open: <skipped titles or none>"
```

Use `--replace` only when the user asks; the default append keeps prior owner notes.

---

### Step 5 — Report back (always)

```markdown
## UI rate — screenshot critique and remediation

| Field | Value |
| --- | --- |
| Route ID | `<ID>` / none |
| Path | `<path or inferred>` |
| Context | `<user text or none>` |
| Screenshots | `<filenames>` |
| Rating model | `claude-opus-5-thinking-high` |
| Implementation model | `composer-2.5` |
| Stance | Azure Portal design lead (brutal) |

### Critique

<Opus High critique across the seven lenses; brutal, specific, pixel-grounded>

### Fix backlog and disposition

| # | Severity | Item | Status | Note |
|---|----------|------|--------|------|
| 1 | P0 | <title> | shipped / partial / skipped | <reason if not shipped> |

<full backlog detail — Why / Evidence / Fix direction / Acceptance — beneath the table>

### Hypothesis / needs repro (optional)

- …

### Shipped

| Field | Value |
|-------|-------|
| Branch | `master` |
| Commit | `<sha>` |
| Files | `<paths>` |
| Quality gate | compiler / deslop / Bugbot / security — findings and fixes |
| CI | green / fixes applied via `/fix-ci` |

### Traffic estimates

| Dimension | Before | Projected | Written | Rank |
|-----------|--------|-----------|---------|------|
| UX (pos 2) | `<n>` | `<n>` | `<n>` | `<r>` / `<total>` |
| Evidence (pos 1) | `<n>` | `<n>` | `<n>` | — |

**Note written:** `<note text>`
```

When a phase is skipped (rate-only, zero fix items, blocked path, unresolvable ID, red CI), state which phase stopped and why — never report a phase as done that did not run.

---

## Failure handling

| Situation | Action |
|-----------|--------|
| No screenshot | Stop at Step 0 with the usage line |
| Opus High subagent unavailable | Stop and tell the user; do **not** rate with a substitute model |
| Composer 2.5 unavailable | Report the rating, skip Phases 2–3, run Phase 4 with `shipped = 0` |
| Quality gate cannot go green | Do not commit; report the failing gate and leave changes uncommitted for the owner |
| Target path dirty at session start | Per `Agent-Working-Tree-Safety.mdc`, skip that backlog item as `blocked` and name the path |
| CI red after push | Loop `/fix-ci` before Phase 4; if still red, report red and write scores with `shipped` reduced accordingly |

---

## Canonical files

- `.local/owner/ui_route_traffic_estimates.md` — live master table (gitignored)
- `scripts/ci/set-archlucid-ui-route-score.py` — score write (`--dimension ux` / `evidence`) + resort
- `scripts/ci/set-archlucid-ui-route-note.py` — Notes write
- `docs/library/UI_UX_SCORING_RUBRIC.md` — UX dimension rubric (when present)
- `docs/library/UI_DESIGN_SYSTEM.md` — Carbon + Fluent 2 standard
- `docs/architecture/UI_ROUTE_TRAFFIC_ESTIMATES_OWNER.md` — workbook location + guards

## Related commands

- `/al-ui-score` — set Evidence or UX score by ID without a critique
- `/al-ui-note` — capture notes by ID
- `/al-ui-lowest` — list lowest buyer-facing UX scores
- `/al-ui-rate-lowest` — rate + ship full backlog for lowest UX routes (no screenshot required)
- `/al-ui-tableupdate` — reconcile workbook with live routes
- `/al-defect` — production defect intake (broken behavior, not design critique)
- `/lucid-ui-audit` — full persona screenshot suite + dated audit report
