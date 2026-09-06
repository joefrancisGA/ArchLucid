> **Scope:** Copy-paste Composer prompts that stop `/al-bug` from manufacturing synthetic defects (especially redaction, schema-version coercion, and English-negation phrase lists) and restore a hunt catalog that covers recent product surface. Internal engineering only — not buyer-facing copy.
> **Paste-ready files:** [`.cursor/prompts/al-bug-quality-00-index.md`](../../.cursor/prompts/al-bug-quality-00-index.md) (**ABQ-01–10**)
> **Workflow:** [`.cursor/commands/al-bug.md`](../../.cursor/commands/al-bug.md) · ledger [`../library/AL_BUG_HUNT_LEDGER.md`](../library/AL_BUG_HUNT_LEDGER.md)
> **Do not fork:** GTM cohorts **M-90 / M-44 / M-91 / M-92**; closed assurance **TB-135 / TB-136**; `/al-defect` PD intake; a full `bugsmash` revert

# `/al-bug` quality — Composer prompts (ABQ-01–ABQ-10)

**Created:** 2026-09-06 · **Status:** ready to run · **Audience:** Cursor Composer implementing the hunt-quality recommendations.

`/al-bug` is supposed to find real defects with a failing repro, then ship a minimal fix to `bugsmash`. By 2026-09-06 the loop had inverted: 1,236 logged hunts with a 95%+ hit rate, mega-zones (`archlucid-core`, `api-governance-tenancy-controllers`) locking the picker, and “fixes” that enumerate open-ended input spaces one instance per hunt.

Verified damage on `master` (scratch probe of current redactors, 2026-09-06): `adminPassword`, `storageAccountAccessKey`, `sshPrivateKey`, `sqlAdminPassword`, and `ArchLucid:OpenAiApiKey` were **not** redacted, while fictional treadmill keys such as `beefAccessKey` **were**. `IsEmbeddedSensitiveFragment` skips any sensitive fragment preceded by a letter, which describes nearly every real camelCase ARM / config key.

Paste **one** `.cursor/prompts/al-bug-quality-NN-*.md` file per Composer session. Do not implement from this document’s tables.

## Diagnosis → prompt

| Class | Prompt | Residual |
|-------|--------|----------|
| Fail-open redaction | **ABQ-01** | Azure extractor allowlists fictional `*accesskey` words; real `adminPassword` leaks |
| Fail-open config redaction | **ABQ-02** | Config-path matcher same mechanism; operator summaries leak `AdminPassword` / `OpenAiApiKey` |
| Parser leniency treadmill | **ABQ-03** | `schemaVersion` readers accept `true` / `"on"` / `null`; “parity” hunts copy that to siblings |
| Phrase-list treadmill | **ABQ-04** | Advice/constraint matchers accrete “mightn't configure to …” instead of tokenizing negation |
| Weak hunt-ready bar | **ABQ-05** | Concrete-but-unreachable inputs (`beefAccessKey`) count as hunt-ready |
| Unbounded picker speed | **ABQ-06** | `bugs-found > hunts` makes mean hunts/bug < 1 and locks mega-zones |
| No escalation / triage | **ABQ-07** | Sequential-100 auto-pushes low-severity instance fixes; no same-file cooling |
| Mega-zones | **ABQ-08** | `paths: ArchLucid.Core/` and whole controller trees defeat curated hunting |
| Stale coverage | **ABQ-09** | `-Nominate` is documented but not implemented; recent churn is unzoned |
| Inflated proven count | **ABQ-10** | Sample `(proven)` rows; classify realistic vs synthetic; do not treat ledger totals as quality |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **ABQ-01** Azure redactor rewrite | **First** (security) | None |
| **ABQ-02** Config matcher rewrite | After 01 | Shared tokenizer from 01 |
| **ABQ-03** schemaVersion rollback | Parallel with 01 | Do not “fix” by adding more accepted tokens |
| **ABQ-04** Negation tokenizer | Parallel with 01/03 | Do not add another phrase |
| **ABQ-05** Hunt-ready bar | Parallel with 01 | Docs/commands only |
| **ABQ-06** Picker scoring | After 05 preferred | Pester in `scripts/tests/AlBugPickZone.Tests.ps1` |
| **ABQ-07** Escalation + sequential hold | After 06 | Uses cooldown / warning fields |
| **ABQ-08** Split mega-zones | After 06 preferred | Picker must still parse new zone ids |
| **ABQ-09** Churn nominate + new zones | After 08 | Do not nominate into zones 08 is about to split |
| **ABQ-10** Proven-row audit | After 01–04 preferred | Classifies the treadmill rows those prompts retire |

## Intentional — do not “fix”

- Do **not** revert all of `bugsmash` or rewrite the hunt ledger’s historical `(proven)` rows as a mass delete. ABQ-10 samples; ABQ-01/02/03/04 replace the *mechanisms* going forward.
- Do **not** keep the fictional `bearAccessKey` / `yachtAccessKey` allowlist “just in case.” Adjacent `access`+`key` tokens cover real `*AccessKey` names.
- Do **not** treat over-redacting `PasswordlessAuth` as a shippable bug. Conservative redaction on an ambiguous name is `valid-no-repro`.
- Do **not** add GTM cohort work (**M-90**, **M-44**, **M-91**, **M-92**) or reopen **TB-135** / **TB-136**.
- Do **not** log `PD-###` unless the owner also asked for `/al-defect` intake.
- Do **not** hide desktop review workspace tabs.
- Do **not** run `/al-bug` itself as the implementation vehicle for this set.

## Global constraints

See [`.cursor/prompts/al-bug-quality-00-index.md`](../../.cursor/prompts/al-bug-quality-00-index.md). Working-tree safety; one class per file; no `ConfigureAwait(false)` in tests; scoped tests only; stage only files the prompt names.
