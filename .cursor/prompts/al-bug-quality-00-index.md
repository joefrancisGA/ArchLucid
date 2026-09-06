<!-- /al-bug quality Composer prompts — paste one prompt per session.
     Origin: 2026-09-06 owner follow-up after /al-bug degenerated into a
     synthetic-hit treadmill (redaction allowlists, schemaVersion leniency,
     English-negation phrase lists, mega-zone picker lock).
     Do not implement from this index. -->

# `/al-bug` quality — Composer prompt set (ABQ-01–ABQ-10)

**Status:** **Ready to run.** Paste one `.cursor/prompts/al-bug-quality-NN-*.md` file per Composer session.

`/al-bug` finds a real defect with a failing repro, ships a minimal fix to `bugsmash`, and updates `docs/library/AL_BUG_HUNT_LEDGER.md`. By 2026-09-06 the loop was manufacturing bugs: 1,236 logged hunts, 1,182 hits, mega-zone `archlucid-core` reporting thousands of “bugs,” and redactors that redact `beefAccessKey` while leaking `adminPassword`.

**Do not implement from this index.**

**Do not treat this set as a V1 assessment scorecard.** Do not add GTM cohort work (**M-90**, **M-44**, **M-91**, **M-92**) or closed assurance programs (**TB-135** / **TB-136**). **TB-645** vocabulary stays. Do not create `PD-###` rows. Do not run `/al-bug` to implement these prompts.

## What this set does *not* change

Keep: tenant isolation (ADR 0037); sealed-manifest immutability (ADR 0039); `/al-defect` operator intake; the hunt ledger as an append-mostly history (do not mass-delete `(proven)` rows); `bugsmash` as the default `/al-bug` push target.

Do **not** revert every post–2026-08-23 bugsmash merge. Replace the *mechanisms* (redaction tokenizer, schema-version reader, negation tokenizer, picker score). Do **not** hide desktop review workspace tabs. Do **not** copy Home layout. Do **not** enumerate another fictional `*AccessKey` prefix.

## Diagnosis classes

| Class | Failure | Prompts |
|-------|---------|---------|
| **Fail-open redaction** | `IsEmbeddedSensitiveFragment` + per-word allowlist; real camelCase secrets leak | ABQ-01, ABQ-02 |
| **Leniency treadmill** | Boolean / `"on"` / `null` accepted as `schemaVersion`; sibling “parity” hunts | ABQ-03 |
| **Phrase-list treadmill** | Open-class English phrases (`mightn't configure to`) instead of closed-class negation tokens | ABQ-04 |
| **Weak hunt bar** | Concrete-but-unreachable inputs count as hunt-ready; instance-list diffs count as fixes | ABQ-05 |
| **Picker Goodhart** | `bugs-found / hunts` unbounded; no cooldown; sequential auto-push | ABQ-06, ABQ-07 |
| **Catalog shape** | Project-wide zones; `-Nominate` documented but missing; recent churn unzoned | ABQ-08, ABQ-09 |
| **Inflated yield** | Ledger `(proven)` count treated as product quality | ABQ-10 |

## Run order

**01 first** (extractor secrets on disk / hashes). **02** after 01 (reuse the shared tokenizer). **03** and **04** may run in parallel with 01 (different files) but must not add more accepted tokens or phrases. **05** is docs-only and may run in parallel with 01. **06** after 05 preferred. **07** after 06. **08** after 06 preferred. **09** after 08. **10** after 01–04 preferred so the sample can label treadmill rows those prompts retire.

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

## Already shipped — do not re-open as this set’s job

| Item | Evidence |
|------|----------|
| Hunt ledger + picker | `docs/library/AL_BUG_HUNT_LEDGER.md`, `scripts/agent/al-bug-pick-zone.ps1` |
| Seed vs thorough kinds | `.cursor/commands/al-bug.md` Phase 0 / 1.1a |
| Rolling 24h log | `docs/library/AL_BUG_HUNT_RUN_LOG.jsonl`, `scripts/agent/al-bug-rolling-stats.ps1` |
| Candidate vs hunt-ready tags | Ledger § Hypothesis tags (keep; ABQ-05 *adds* Reachability) |

## Global constraints (every prompt)

- Working-tree safety: `.\scripts\agent\check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- Stage only paths this prompt changes. No `git add -A`.
- Each class in its own file. Prefer LINQ. Prefer concrete types over `var`. Blank line before `if` / `foreach` unless first in method. Check nulls. No `ConfigureAwait(false)` in tests.
- Verification: scoped `dotnet test` / Pester named in the prompt. No full-solution builds. No `/al-bug` invocation. No `/fix-ci`.
- Do **not** hide desktop review workspace tabs (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- Claim discipline: `docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md`. Do not imply CPA SOC 2 or third-party pen-test publication.

## After each prompt

Summarize: files changed, tests run, whether fictional allowlists/phrase lists shrank, residual risk, and which later ABQ prompt still owns leftovers. Do not mark `/al-bug` itself as retired.
