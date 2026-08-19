<!-- Dual-vocabulary cleanup prompt set — paste one prompt per Composer session.
     Last updated: 2026-08-03. Origin: principal-architect critique #3
     ("two vocabularies for the same objects").
     Fix strategy: (1) one written rosetta with an explicit end-state, (2) fix the
     canonical copy modules first, (3) sweep buyer-visible strings, (4) harden the
     leakage guard so regressions fail CI, (5) align CLI/help/docs seams. -->

# Dual-vocabulary cleanup — Composer prompt set

**Problem being fixed:** the product runs two parallel languages for the same objects. UI says *architecture review / architecture package / finalize / sealed review record*; API and CLI say `run` / `runId` / `commit` / manifest. The seams leak into buyer-visible surfaces — notably, the canonical buyer copy module `archlucid-ui/src/lib/buyer-surface-vocabulary.ts` itself says "Commit at least one review…" and "committed reviews" in executive-dashboard copy, while `.cursor/rules/UI-Enterprise-Design-Standard.mdc` bans "commit" as a buyer-facing word (buyer verb: **finalize**). Every mismatch a buyer sees (screen says "finalize", error toast says "commit failed", URL says `runId`) costs trust.

**Explicit non-goal (all prompts):** do NOT rename API routes, OpenAPI schema properties, `runId`/`commit` API nouns, database columns, or C# types. The API vocabulary is a compatibility surface guarded by OpenAPI snapshot gates. This prompt set fixes what humans *read*, not what machines *call*.

**Run order:** P1 → P2 → P3 → P4 → P5 → P6. P1 produces the inventory and rosetta the others execute against; run one prompt per Composer session.

**Global constraints (apply to every prompt):**

- Respect working-tree safety: many target files are dirty (`empty-state-presets.ts`, `contextual-help-registry.ts`, `internal-concept-leakage-guard.test.ts`, several help/insights files). Run `.\scripts\agent\check-working-tree-path.ps1 -Path <file>` before editing any tracked file; if blocked, skip that file and list it in your summary — never overwrite.
- Buyer verb/noun canon (from `UI-Enterprise-Design-Standard.mdc` and `docs/library/CONCEPT_VOCABULARY.md`): *architecture package, architecture review, finding, evidence trail, sealed review record, finalize, decision, governance approval, audit trail*. Banned as buyer-facing first-impression words: *run, commit, manifest, coordinator, Authority, V1*.
- Nuance: "run" stays legal as the CLI/API noun in engineering docs and code; "commit" stays legal in git contexts and API identifiers. The ban is on *buyer-visible rendered copy*.
- UI verification: focused Vitest only (`npx vitest run <files>` from `archlucid-ui/`); no full builds. One shell command per turn per repo shell-hygiene rules.

---

## P1 — Inventory + canonical rosetta (read-only audit, docs deliverable)

```text
ArchLucid is mid-migration from internal vocabulary (run, runId, commit, golden manifest) to
buyer vocabulary (architecture review, architecture package, finalize, sealed review record).
Produce the authoritative inventory and end-state mapping. READ-ONLY except for the two doc
deliverables below — no code changes.

1. Build the leak inventory. Search archlucid-ui/src for buyer-visible rendered strings (JSX
   text, copy constants, toast/error messages, empty states, breadcrumbs, aria-labels, page
   metadata titles) containing: "commit", "committed", "run" (as the review noun, not
   "running"/"run rate"), "runId", "manifest", "golden". Classify each hit:
   (a) buyer-visible leak — rendered on a customer surface;
   (b) operator-only surface — visible but internal persona (list separately);
   (c) legal — code identifier, API field, test name, git context, CLI/API noun in
       engineering docs.
   Cross-check surface classification against the buyer-surface list in
   archlucid-ui/src/lib/internal-concept-leakage-surfaces.ts and the route groups under
   archlucid-ui/src/app/. Known seed finding to verify and include:
   archlucid-ui/src/lib/buyer-surface-vocabulary.ts BUYER_EXECUTIVE_SUMMARY_VOCABULARY uses
   "Commit at least one review", "committed reviews", "Commit a review" in buyer copy.
2. Deliverable A — new file docs/library/VOCABULARY_ROSETTA.md: one table, columns
   Internal/API term | Buyer term | Where the internal term remains legal | Enforcement
   (guard/test). Rows at minimum: run/runId → architecture review / Review ID;
   commit (verb) → finalize; committed → finalized; golden manifest → sealed review record;
   pre-commit gate → pre-finalize governance gate; coordinator → (never buyer-visible);
   Authority → workspace role phrasing. State the END-STATE RULE explicitly: API/CLI/schema
   identifiers keep legacy nouns permanently (compatibility surface); every human-readable
   buyer surface uses buyer vocabulary; operator surfaces prefer buyer vocabulary but may
   show API identifiers inside disclosure affordances. Link CONCEPT_VOCABULARY.md and
   UI-Enterprise-Design-Standard as parents; keep this file the single mapping table.
3. Deliverable B — the leak inventory as a checklist appendix in the same file (file:line,
   current string, replacement, class a/b/c), ordered by surface visibility so P2/P3 can
   execute top-down.

Constraints: do not edit any .ts/.tsx file. Do not edit CONCEPT_VOCABULARY.md beyond adding
one pointer line to the new rosetta (skip if the working-tree check blocks it). Use Grep/Read
tools for the search, not shell grep.

Acceptance: VOCABULARY_ROSETTA.md exists with the mapping table, end-state rule, and a
complete classified inventory; zero code diffs.
```

---

## P2 — Fix the canonical copy modules (commit → finalize in buyer constants)

```text
ArchLucid's canonical buyer copy modules themselves leak internal vocabulary. Fix the
constants at the source so every consuming surface inherits the correction. The mapping and
inventory live in docs/library/VOCABULARY_ROSETTA.md (execute class-(a) rows that live in
src/lib copy modules; if the rosetta is missing, apply the mapping: commit→finalize,
committed→finalized, run→review, golden manifest→sealed review record).

1. archlucid-ui/src/lib/buyer-surface-vocabulary.ts — BUYER_EXECUTIVE_SUMMARY_VOCABULARY and
   siblings: replace buyer-visible "Commit"/"committed" phrasing with "Finalize"/"finalized"
   (e.g. "Finalize at least one review to populate dashboard metrics.", "finalized reviews",
   "Available after first finalized review"). Preserve sentence rhythm; do not reword beyond
   the vocabulary swap.
2. Apply the same swap to other src/lib copy-constant modules the rosetta flags as class (a)
   (candidates to check: buyer-polish-copy.ts, empty-state-presets.ts, impact-preview-page-copy.ts,
   executive-workspace-health-page-copy.ts, route-titles source, breadcrumb-map.ts). Working
   tree: empty-state-presets.ts and several others are DIRTY — run the working-tree check
   first; skip blocked files and list them.
3. Update every test that asserts the old literals (Vitest snapshot and string-equality
   tests). Run the focused tests for each edited module plus their consuming page tests.
4. Do NOT touch: API client code, generated types, anything under src/lib that maps API
   fields (runId stays runId in code), operator-only diagnostic surfaces flagged class (b).

Acceptance: no buyer copy constant in src/lib renders "commit"/"committed"/"run" as the
review noun; focused Vitest green; skipped-because-dirty files listed for a follow-up pass.
```

---

## P3 — Sweep buyer-visible component strings (toasts, errors, empty states, titles)

```text
Execute the remaining class-(a) rows of the leak inventory in
docs/library/VOCABULARY_ROSETTA.md: buyer-visible strings rendered directly in components
and pages rather than via the src/lib copy modules (those were fixed in a prior pass).

1. Sweep archlucid-ui/src/app and src/components for rendered buyer-visible text using
   internal vocabulary: error toasts and failure messages ("commit failed", "run not found"),
   empty states, page titles/metadata, aria-labels, button labels, helper text. Apply the
   rosetta mapping (commit→finalize, run→review, golden manifest→sealed review record,
   runId→Review ID when displayed as a label; the raw ID value may still be shown inside a
   disclosure affordance per the end-state rule).
2. Special attention to the API error seam: where UI code interpolates API problem-details or
   status text directly into user-facing messages, wrap/translate at the message-construction
   site so API nouns don't pass through verbatim to buyer surfaces. Keep it minimal — a local
   mapping at the call site or the existing error-copy helper if one exists; do NOT build a
   new translation framework.
3. Route paths stay as-is (/reviews/[runId] param names are code, not copy). Legacy /runs
   redirects stay. Do not touch operator diagnostic surfaces flagged class (b) in the
   inventory.
4. Update affected tests/snapshots; run focused Vitest per edited surface. Respect the dirty
   working-tree list (several (operator) help/insights files are dirty — working-tree check
   before each edit; skip and report if blocked).

Acceptance: inventory class-(a) component rows all resolved or explicitly skipped-as-blocked;
no buyer-visible rendered string containing "commit"/"run"-as-noun/"manifest" outside
disclosure affordances on swept surfaces; focused tests green.
```

---

## P4 — Harden the leakage guard so regressions fail CI

```text
ArchLucid has a Vitest leakage guard (archlucid-ui/src/lib/internal-concept-leakage-guard.test.ts,
IA-013) that scans the surface files listed in
archlucid-ui/src/lib/internal-concept-leakage-surfaces.ts for banned patterns (currently
internal rank/version labels like Authority/V1). Extend it to enforce the vocabulary
end-state defined in docs/library/VOCABULARY_ROSETTA.md, now that buyer surfaces were swept.

1. internal-concept-leakage-surfaces.ts: extend INTERNAL_CONCEPT_LEAKAGE_BANNED_PATTERNS
   with buyer-copy vocabulary bans. Design them to avoid false positives on code identifiers:
   ban rendered-copy forms, e.g. quoted-string fragments like "Commit a review",
   "committed review", "golden manifest", " runId" appearing inside copy constants — NOT the
   bare identifier tokens (runId as a variable/property must stay legal). Prefer several
   narrow literal patterns over one broad regex; this guard does substring matching on source
   files, so precision comes from pattern choice.
2. Extend INTERNAL_CONCEPT_LEAKAGE_SURFACES to cover the buyer copy modules fixed in the
   sweep (buyer-surface-vocabulary.ts at minimum, plus other class-(a) copy modules from the
   rosetta inventory that are not yet listed). Only add files that are actually clean now —
   run the guard after each addition.
3. Add focused test cases mirroring the existing style: one asserting the executive-dashboard
   copy uses "Finalize"/"finalized" phrasing, one asserting no surface file contains the new
   banned literals.
4. If a listed surface still trips a new pattern because it was skipped-as-dirty in the
   earlier sweep, do NOT weaken the pattern — leave the file out of the surface list and
   record it in the rosetta checklist as blocked.

Working tree: internal-concept-leakage-guard.test.ts is DIRTY — run the working-tree check
first; if blocked, put new assertions in a sibling test file
(internal-concept-leakage-vocabulary.test.ts) instead and say so.

Acceptance: new patterns + surfaces in place; focused Vitest for the guard green; guard
demonstrably fails (verified locally by temporary injection, then reverted) when "Commit a
review" is reintroduced into a listed surface.
```

---

## P5 — CLI help text and customer-facing docs alignment

```text
Align the human-readable seams outside the UI with the vocabulary end-state in
docs/library/VOCABULARY_ROSETTA.md. API/CLI identifiers stay; descriptions change.

1. CLI (ArchLucid.Cli): keep verbs archlucid run / commit unchanged (scripting compatibility).
   Update help/description strings so each legacy verb self-describes in buyer vocabulary:
   run → "Starts an architecture review (API: run)"; commit → "Finalizes the review into a
   signed architecture package (API: commit)". Console output messages users read (progress,
   success, errors) adopt buyer nouns with the API id in parentheses where useful. Do not
   rename commands, flags, or output JSON fields.
2. Customer-facing docs sweep: docs/library/customer-facing/ and in-app help content sources —
   apply the rosetta to prose (finalize, architecture package, sealed review record), keeping
   one explicit bridge line where the API is taught: "the API and CLI use run and commit for
   compatibility; the product calls these a review and finalize." Engineering docs
   (docs/engineering/, ADRs, API_CONTRACTS.md) are OUT of scope — internal nouns are correct
   there.
3. Working tree: docs/library/customer-facing/DATA_HANDLING.md and several help sources are
   DIRTY — working-tree check before each edit; skip blocked files and list them.
4. If CLI strings changed, run the single scoped compile check permitted:
   .\scripts\ci\agent-compile-check.ps1 -ProjectPath ArchLucid.Cli/ArchLucid.Cli.csproj
   (with the heartbeat wrapper per shell-heartbeat.mdc). Docs-only changes need no compile.

Acceptance: CLI help self-describes in buyer vocabulary without renaming anything callable;
customer-facing docs use buyer nouns with one deliberate bridge line each where the API
surface is documented; compile check green if CLI touched.
```

---

## P6 — Verification sweep

```text
A multi-session vocabulary cleanup just landed (rosetta doc, buyer copy modules commit→finalize,
component string sweep, leakage-guard hardening, CLI/docs alignment). Verify, fixing only
what fails:

1. From archlucid-ui/: focused Vitest for internal-concept-leakage-guard (and the sibling
   vocabulary test if created), buyer-surface-vocabulary consumers, and any snapshot suites
   updated in the sweep.
2. Grep archlucid-ui/src for remaining buyer-visible "Commit a review" / "committed review" /
   "golden manifest" rendered copy; reconcile every hit against the rosetta checklist —
   each must be class (b) operator-surface, class (c) legal identifier, or documented as
   blocked-by-dirty-working-tree. Fix unclassified stragglers minimally.
3. Confirm docs/library/VOCABULARY_ROSETTA.md checklist statuses are current (done / blocked /
   legal) and the blocked list matches reality.
4. If ArchLucid.Cli was touched earlier, confirm its compile check passed; do not re-run
   otherwise. No full builds, no full test suites, one shell command per turn.

Report pass/fail per step with exact commands, plus the final blocked-file list the user must
unblock (commit or stash their dirty edits) before a follow-up pass can finish those files.
```

---

## Model guidance

- **Composer-safe:** P1 (read-only inventory), P5 (mechanical description swaps), P6 (verification).
- **Composer with care:** P2, P3 (copy edits ripple into snapshots — keep swaps literal, resist rewording), P4 (pattern precision — overbroad bans will false-positive on legal identifiers like `runId` in code).
- **Strong-model review recommended before merge:** the rosetta end-state rule in P1 (it is the durable decision record; everything else executes it).
