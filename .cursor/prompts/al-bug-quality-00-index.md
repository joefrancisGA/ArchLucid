<!-- /al-bug quality Composer prompts — paste one prompt per session.
     Origin: 2026-09-06 owner follow-up after /al-bug degenerated into a
     synthetic-hit treadmill (redaction allowlists, schemaVersion leniency,
     English-negation phrase lists, mega-zone picker lock).
     Wave 3 (ABQ-14–18): leftover work after ABQ-01–13 shipped in code.
     Wave 4 (ABQ-19–25): seed quality, fix honesty, and ungameable metrics (shipped).
     Wave 5 (ABQ-26–35): surviving-mutant seeds, CI/flake ingest, class bans,
     concurrency/authz/clock probes, drills, ratchets. Prompts only until implemented.
     Do not implement from this index. -->

# `/al-bug` quality — Composer prompt set (ABQ-01–ABQ-35)

**Status:** **ABQ-01–25 shipped in code** (wave 4 merged as #1957). **ABQ-26–35 are ready to run** (one prompt file per session). Do **not** re-implement 01–25 from their files.

`/al-bug` finds a real defect with a failing repro, ships a minimal fix to `bugsmash`, and updates `docs/library/AL_BUG_HUNT_LEDGER.md`. By 2026-09-06 the loop was manufacturing bugs: 1,236 logged hunts, 1,182 hits, mega-zone `archlucid-core` reporting thousands of “bugs,” and redactors that redact `beefAccessKey` while leaking `adminPassword`.

**Do not implement from this index.**

**Do not treat this set as a V1 assessment scorecard.** Do not add GTM cohort work (**M-90**, **M-44**, **M-91**, **M-92**) or closed assurance programs (**TB-135** / **TB-136**). Owner GTM rows **G-REAL-05** (SOC 2 CPA) and **G-ASSURANCE-02** (third-party pen test) stay on the GTM backlog — do not resurface as engineering batches. **TB-645** vocabulary stays. Do not create `PD-###` rows. Do not run `/al-bug` to implement these prompts.

## What this set does *not* change

Keep: tenant isolation (ADR 0037); sealed-manifest immutability (ADR 0039); `/al-defect` operator intake; the hunt ledger as an append-mostly history (do not mass-delete `(proven)` rows); `bugsmash` as the default `/al-bug` push target.

Do **not** revert every post–2026-08-23 bugsmash merge. Replace the *mechanisms* (redaction tokenizer, schema-version reader, negation tokenizer, picker score). Do **not** hide desktop review workspace tabs. Do **not** copy Home layout. Do **not** enumerate another fictional `*AccessKey` prefix.

## Diagnosis classes

| Class | Failure | Prompts |
|-------|---------|---------|
| **Fail-open redaction** | `IsEmbeddedSensitiveFragment` + per-word allowlist; real camelCase secrets leak | ABQ-01, ABQ-02 *(shipped)* |
| **Leniency treadmill** | Boolean / `"on"` / `null` accepted as `schemaVersion`; sibling “parity” hunts | ABQ-03, ABQ-15 *(shipped)* |
| **Phrase-list treadmill** | Open-class English phrases (`mightn't configure to`) instead of closed-class negation tokens | ABQ-04, ABQ-13 *(shipped)* |
| **Weak hunt bar** | Concrete-but-unreachable inputs count as hunt-ready; instance-list diffs count as fixes | ABQ-05 *(shipped)* |
| **Picker Goodhart** | `bugs-found / hunts` unbounded; no cooldown; sequential auto-push | ABQ-06, ABQ-07 *(shipped)* |
| **Catalog shape** | Project-wide zones; `-Nominate` documented but missing; recent churn unzoned | ABQ-08, ABQ-09 *(shipped)* |
| **Inflated yield** | Ledger `(proven)` count treated as product quality | ABQ-10, ABQ-16 *(shipped)* |
| **Silent tests** | Pester 3 syntax + ungated suites hid StrictMode defects | ABQ-11, ABQ-12, ABQ-17 *(shipped)* |
| **Stale wire fixtures** | `enforcementTier` required in converter; fixtures omit it | ABQ-14 *(shipped)* |
| **Cloud Agent image** | Linux image has no `pwsh`; prompts assume it | ABQ-18 *(shipped)* |
| **Self-reported yield** | Hunt KPI ignores operator/CI/pilot escapes | ABQ-19 *(shipped)* |
| **Unguarded proven rows** | Cited tests would still pass if the production patch vanished | ABQ-20 *(shipped)* |
| **Class treadmill** | Same defect class farmed across sibling files; file cooldown never fires | ABQ-21 *(shipped)* |
| **Example-only parsers** | Identity readers covered by a handful of `"on"` facts | ABQ-22 *(shipped)* |
| **Blind seed hunts** | Hypotheses only from file reading; analyzer diagnostics unused | ABQ-23 *(shipped)* |
| **Churn-only nominate** | `-Nominate` cannot tell an untested orchestrator from a constants file | ABQ-24 *(shipped)* |
| **Ignored mutation scores** | Scheduled Stryker exists; picker does not show kill rate | ABQ-25 *(shipped)* |
| **Score without loci** | Mutation % shown; surviving mutants not seeded | ABQ-26 |
| **Single-thread seeds** | Commit/persist races never constructed | ABQ-27 |
| **Hand-picked authz routes** | New OpenAPI paths skip cross-tenant cases | ABQ-28 |
| **Local DateTime windows** | JSONL ISO parsed as local; DST/Kind skew | ABQ-29 |
| **Manual escape log** | CI red on production paths never recorded | ABQ-30 |
| **Forgotten flakes** | Retry-then-green hides races | ABQ-31 |
| **Class cooldown only** | Sibling copies of retired helpers still compile | ABQ-32 |
| **Self-reported sensitivity** | Loop never measured against a known injected defect | ABQ-33 |
| **Warn-only revert verifier** | New unguarded `(proven)` rows still merge | ABQ-34 |
| **Unearned high impact** | Multiplier accepts “scary file” as user-visible harm | ABQ-35 |

## Run order

**01–25 are done** (do not paste those files to re-do the work).

**26–35 recommended order:** cheap compounding first (**26, 30, 32**), then **31**, **29**, **28**, **27**, **33**, then ratchets (**34** last, after an unguarded baseline exists). **35** can run anytime as a docs/audit script (no product-code dependency).

| # | Prompt file | Flaw it mitigates |
|---|----------------|-------------------|
| 01 | `al-bug-quality-01-azure-extractor-redactor.md` | Azure ARM property redactor fail-open |
| 02 | `al-bug-quality-02-config-path-matcher.md` | Operator-summary config-path redactor fail-open |
| 03 | `al-bug-quality-03-schema-version-leniency.md` | schemaVersion boolean/`on`/null coercion |
| 04 | `al-bug-quality-04-negation-tokenizer.md` | Advice/constraint phrase-list accretion |
| 05 | `al-bug-quality-05-hunt-ready-bar.md` | Hunt-ready + fix-generality + failure-direction |
| 06 | `al-bug-quality-06-picker-scoring.md` | Unbounded speed; missing impact multiplier; no cooldown |
| 07 | `al-bug-quality-07-escalation-and-triage.md` | Same-file hit streaks; sequential low-severity auto-push |
| 08 | `al-bug-quality-08-split-mega-zones.md` | `archlucid-core` / controller-tree zones |
| 09 | `al-bug-quality-09-churn-nominate-new-zones.md` | Unzoned recent functionality; implement `-Nominate` |
| 10 | `al-bug-quality-10-proven-row-audit.md` | Unaudited `(proven)` totals |
| 11 | *(no prompt file — shipped in code)* | Al-bug Pester 3→5; four StrictMode/scoring defects |
| 12 | *(no prompt file — shipped in code)* | Structural proven-row classification; CI gates AlBug* suites; deleted stale `_al-bug-pick-zone.ps1` |
| 13 | *(no prompt file — shipped in code)* | Tokenizer `EndsWithWordToken` compares characters; complete contraction class |
| 14 | *(no prompt file — shipped in code)* | Required `enforcementTier` fixtures; `JsonException` on missing |
| 15 | *(no prompt file — shipped in code)* | `JsonBooleanStringReader`; identity fields reject boolean/`on` |
| 16 | *(no prompt file — shipped in code)* | `effective-bugs` picker + `al-bug-lint-ledger-counters.py` |
| 17 | *(no prompt file — shipped in code)* | Nine Pester 3 suites migrated; `first-pilot-pester` CI job |
| 18 | *(no prompt file — shipped in code)* | Cloud `AGENTS.md` pwsh/Pester setup |
| **19** | `al-bug-quality-19-escaped-defect-feedback.md` | PD/CI/pilot escapes → zone escape rate |
| **20** | `al-bug-quality-20-patch-revert-verifier.md` | Revert production hunk; named test must fail |
| **21** | `al-bug-quality-21-defect-class-cooldown.md` | Closed defect-class enum + saturation cooldown |
| **22** | `al-bug-quality-22-parser-property-tests.md` | FsCheck properties on strict JSON readers |
| **23** | `al-bug-quality-23-analyzer-seeded-hypotheses.md` | Analyzer/SARIF seeds as `(candidate)` only |
| **24** | `al-bug-quality-24-coverage-churn-nominate.md` | `-Nominate` rank = churn × (1−coverage) × size |
| **25** | `al-bug-quality-25-stryker-zone-quality.md` | Map scheduled Stryker baselines onto zones |
| **26** | `al-bug-quality-26-surviving-mutant-seeds.md` | Surviving mutants → `(candidate)` only |
| **27** | `al-bug-quality-27-concurrency-idempotency-probes.md` | Double-submit / crash-retry / two-caller commit probes |
| **28** | `al-bug-quality-28-schema-authz-fuzz.md` | OpenAPI-derived wrong-tenant 403/404 matrix |
| **29** | `al-bug-quality-29-clock-skew-properties.md` | UTC/Kind/DST properties for 24h/7d/90d windows |
| **30** | `al-bug-quality-30-ci-escape-ingest.md` | Default-branch CI failure → escape-log `source: ci` |
| **31** | `al-bug-quality-31-flake-ledger.md` | Retry-then-pass JSONL → race candidates |
| **32** | `al-bug-quality-32-retired-class-bans.md` | CI ban new copies of retired treadmill helpers |
| **33** | `al-bug-quality-33-seeded-defect-drills.md` | Inject known defect; measure picker/seed hit (no `/al-bug`) |
| **34** | `al-bug-quality-34-revert-verifier-ratchet.md` | Fail CI on **new** unguarded proven rows vs baseline |
| **35** | `al-bug-quality-35-severity-calibration-audit.md` | Sample high-impact rows for named 1.1b harm |

## Already shipped — do not re-open as this set’s job

| Item | Evidence |
|------|----------|
| Hunt ledger + picker | `docs/library/AL_BUG_HUNT_LEDGER.md`, `scripts/agent/al-bug-pick-zone.ps1` |
| Seed vs thorough kinds | `.cursor/commands/al-bug.md` Phase 0 / 1.1a |
| Rolling 24h log | `docs/library/AL_BUG_HUNT_RUN_LOG.jsonl`, `scripts/agent/al-bug-rolling-stats.ps1` |
| Candidate vs hunt-ready tags | Ledger § Hypothesis tags (keep; ABQ-05 *added* Reachability) |
| Token redaction (01/02) | ARM + config-path token redactors |
| Strict schemaVersion (03) | `ArchLucid.Core/Json/StrictSchemaVersionReader.cs` |
| Negation tokenizer (04/13) | `ArchLucid.Core/Text/EnglishNegationTokenizer.cs` + `EnglishNegationTokenizerTests.cs` |
| Hunt-ready bar (05) | Reachability + no instance-list-only fixes |
| Picker scoring (06/11) | Capped speed; impact; cooldown; forfeit speed when `bugs > hunts` or zero yield |
| Escalation (07/11) | `scripts/agent/al-bug-escalation.ps1`; sequential runner calls `Get-CurrentEscalatedFiles` (never `-EscalatedFiles @()`) |
| Mega-zone split + nominate (08/09) | Retired `archlucid-core`; `-Nominate` |
| Validity audit (10/12) | `scripts/agent/al-bug-audit-proven-rows.py` classifies **all** proven rows by guard symbol; CI + `python3 scripts/tests/test_al_bug_audit_proven_rows.py` |
| Al-bug Pester 5 + CI (11/12/17) | `AlBugPickZone` / `RollingStats` / `Escalation` + `first-pilot-pester` job |
| Boolean reader + identity reject (15) | `ArchLucid.Core/Json/JsonBooleanStringReader.cs`; `StrictSchemaVersionReader` on CloudInventory manifest |
| Honest ledger counters (16) | `effectiveBugs` in picker; `al-bug-lint-ledger-counters.py` in CI |
| Cloud pwsh setup (18) | `AGENTS.md` § Cursor Cloud specific instructions |
| Escape log + picker penalty (19) | `docs/library/AL_BUG_ESCAPE_LOG.jsonl`; `escapeCount90d` / `−1` |
| Revert verifier warn-only (20) | `scripts/agent/al-bug-verify-proven-revert.py`; CI `--limit 5`, no `--fail-on-unguarded` |
| Defect-class cooldown (21) | Closed enum + picker `saturatedClasses` |
| Parser properties (22) | FsCheck on `StrictSchemaVersionReader` / `JsonBooleanStringReader` / numeric readers |
| Analyzer seeds (23) | `scripts/agent/al-bug-seed-from-analyzers.ps1` `(candidate)` only |
| Coverage×churn nominate (24) | `-Nominate -CoverageCobertura` |
| Stryker zone map (25) | `al-bug-stryker-zone-map.json`; unmapped `mutationScore` is `null`, not `0` |

### Footnotes for stale 01–10 prompt text

- ABQ-06 still says “Pester 3.4 only” and “do not edit `.cursor/_al-bug-pick-zone.ps1`”. **Pester 5 is required now.** The stale `_al-bug-pick-zone.ps1` file was **deleted** in ABQ-12. Implementers of 19–35 must not recreate it.
- ABQ-10 asked for a **sample**; ABQ-12 classified the **full** proven-row population. Do not revert to sampling.
- ABQ-03 + ABQ-15 consolidated boolean parsing into `JsonBooleanStringReader`; identity fields use whole-number/enum readers only.
- ABQ-09 `-Nominate` **exists** in `al-bug-pick-zone.ps1`. Wave 4 prompt 24 **extends** it; do not re-implement Nominate from the stale 09 file.
- ABQ-20 CI is warn-only on purpose. **ABQ-34** is the ratchet (new unguarded vs baseline). Do not flip `--fail-on-unguarded` in a 26–33 session.
- ABQ-25 is display-only scores. **ABQ-26** seeds surviving mutants from an **existing** `mutation-report.json`; still do not run Stryker inside `/al-bug`.
- ABQ-19 escape ingest is manual. **ABQ-30** adds CI `source: ci` (artifact/dry-run unless a bot-commit path already exists). Do not invent `PD-###`.

### Footnotes for 26–35 implementers

- Shared ledger parser is `scripts/agent/al_bug_ledger.py` (`parse_zones`, `collect_proven_rows`, `ProvenRow`). Import it; do not fork.
- Closed defect-class enum (ABQ-21) stays: `fail-open-validation`, `boolean-coercion`, `strictmode-script`, `state-machine-gap`, `null-deref`, `off-by-one`, `authz-scope`, `other`. Do **not** grow it in 26–35.
- Default hunt push target remains **`bugsmash`**. Drills (33) must not push there.
- Picker param for Stryker files is **`StrykerBaselinesPath`** (not `StrykerBaselines` — hashtable clash).
- `ConvertTo-RunLogUtcDateTime` already accepts ISO strings **and** `[datetime]` (ABQ-29 locks Kind/DST, does not re-litigate the JSON parser).
- Pester **5** only (`Invoke-Pester -Strict -EnableExit`). Do not recreate deleted `_al-bug-pick-zone.ps1`.

## Won’t do (explicitly not prompted)

Do **not** create implementation prompts or engineering batches for:

- Driving the validity audit’s remaining **unclassified** share down with more English-phrase signals (diminishing returns / misclassification). The audit is guard-symbol based on purpose. ABQ-21’s class tags are **opt-in on new rows**, not a retroactive regex pass.
- Splitting `GenericArchitectureAdvicePatternsMultiCloudTests.cs` (~9.8k lines, ~38 `InlineData` blocks). That file is not treadmill residue.
- Running Stryker inside `/al-bug` or adding coverlet collect to PR `dotnet-fast-core` (ABQ-24/25 are offline/scheduled inputs only).
- Creating `PD-###` / `TB-###` ids from hunt-quality work (ABQ-19 maps existing defects; `/al-defect` remains the only PD intake; ABQ-30 `source: ci` is not a PD).
- Running `/al-bug` to implement 26–35 (especially 33 — drills measure the loop offline).
- Treating ABQ-28 or ABQ-33 as G-ASSURANCE-02 / a published third-party pen test.
- Auto-pushing escape/flake JSONL from CI unless a bot-commit pattern already exists (30/31 default to artifact + dry-run).
- Mass-reticking historical `(proven)` to `(invalid)` when ratcheting ABQ-34.

## Global constraints (every prompt)

- Working-tree safety: `.\scripts\agent\check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report. On Cursor Cloud, use `pwsh -File` after ABQ-18’s install.
- Stage only paths this prompt changes. No `git add -A`.
- Each class in its own file. Prefer LINQ. Prefer concrete types over `var`. Blank line before `if` / `foreach` unless first in method. Check nulls. No `ConfigureAwait(false)` in tests.
- Verification: scoped `dotnet test` / Pester named in the prompt. No full-solution builds. No `/al-bug` invocation. No `/fix-ci`.
- Pester for **new** script tests is **Pester 5**: `Invoke-Pester -Strict -EnableExit`, `Should -Be`, `BeforeAll`.
- Do **not** hide desktop review workspace tabs (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- Claim discipline: `docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md`. Do not imply CPA SOC 2 or third-party pen-test publication.

## After each prompt

Summarize: files changed, tests run, whether fictional allowlists/phrase lists shrank, residual risk, and which later ABQ prompt still owns leftovers. Do not mark `/al-bug` itself as retired.

Wave 5 leftovers (do not steal another prompt’s job): 26 does not ratchet Stryker; 30 does not create PDs; 32 does not rewrite historical parsers; 33 does not invoke `/al-bug`; 34 does not fail all historical unguarded; 35 does not rewrite `bugs-found`.
