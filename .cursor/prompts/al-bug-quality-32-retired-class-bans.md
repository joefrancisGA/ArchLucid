# ABQ-32 — CI bans for retired defect-class treadmills

**After ABQ-01/02/04/13/15 and ABQ-21 (shipped).** Do not grow the closed class enum. Do not add English-phrase signals to `al-bug-audit-proven-rows.py`. Do not hunt.

## Goal

Once a defect class has a **canonical implementation**, CI (grep or a tiny Roslyn/architecture test) **forbids new copies** of the retired pattern outside the allowed files. Cooldowns (ABQ-21) slow farming; bans **end** it. One rule per retired class, not a general “style police.”

## Why

ABQ-15 consolidated boolean JSON into `JsonBooleanStringReader`, but sibling `TryParseBooleanString` wrappers and local `bool.TryParse` on identity fields can still appear in new files. ABQ-01/02 token redactors still have cousins (`PromptFieldRedactor`, training redactors). File-level escalation never fires on a **new** file. A ban is a one-line CI failure at PR time instead of hunt 20.

## Context

Retired treadmills and **allowlisted** canonical types (extend only with evidence):

| Class | Canonical | Ban (new production code) |
| --- | --- | --- |
| `boolean-coercion` | `ArchLucid.Core/Json/JsonBooleanStringReader.cs` | New `TryParseBooleanString` **bodies** (copy-paste), or identity/schemaVersion fields calling `bool.TryParse` / accepting `"on"` |
| `fail-open-validation` (redaction) | `ArchLucid.Core/AzureExtractor/AzureExtractorSensitivePropertyRedactor.cs` (+ the config-path redactor from ABQ-02 — grep the type name) | New per-word allowlists / `IsEmbeddedSensitiveFragment` copies outside those types |
| `strictmode-script` | Pester 5 + `Invoke-Pester -Strict` | New `Should Be` (Pester 3) under `scripts/tests` (ABQ-11/17 already migrated — keep that gate) |
| `other` token negation | `ArchLucid.Core/Text/EnglishNegationTokenizer.cs` | New open-class English phrase arrays for negation (ABQ-04/13) |

Existing wrappers that **delegate** to the canonical reader (e.g. `FindingJsonConverter.Primitives.cs`, `RunExplanationAggregateJsonReader.TextTokens.cs`) stay allowlisted. Architecture tests under `ArchLucid.Architecture.Tests` are the preferred gate if a similar “must use X” pattern already exists — **grep** before adding a Python grep.

Do **not** ban every `bool.TryParse` in the repo (UI checkboxes, CLI flags). Scope identity JSON / schemaVersion / finding converters.

## What to build

1. **One check script or architecture test per class** (start with **boolean-coercion** + **fail-open redaction**; skip classes with no tight regex):

   - `scripts/ci/al-bug-ban-retired-boolean-coercion.py` **or** an `ArchLucid.Architecture.Tests` fact that walks syntax / file text.
   - Allowlist file: `scripts/ci/al-bug-retired-class-allowlist.txt` (canonical + known delegates). Adding a path requires a comment in the PR — do not silently grow it.
   - Exit 1 on a new match outside the allowlist. Exit 0 when clean.

2. **CI:** add the step to an existing **fast** job (architecture tests already run in CI, or `azure-extractor-pester` for Python). Must be **blocking** (not `continue-on-error`) once the allowlist is complete — that is the point. If the first run finds historical stragglers, **put them on the allowlist with a `TODO retire` comment** rather than failing all of `master`; do not mass-rewrite parsers in this prompt.

3. **`/al-bug` Phase 2 / ABQ-21 banner:** if `saturatedClasses` contains `boolean-coercion` (or fail-open), point at this ban: “do not add a sibling; extend `JsonBooleanStringReader` or the token redactor.”

4. **Docs:** ledger How-to: retired classes have CI bans; the enum does not grow. Link the allowlist.

5. Tests:

```text
python3 scripts/ci/tests/test_al_bug_ban_retired_classes.py
```

(or `dotnet test ArchLucid.Architecture.Tests/... --filter FullyQualifiedName~RetiredClass`)

Cover: (a) fixture file with a new `TryParseBooleanString` method body outside allowlist → fail; (b) file that only **calls** `JsonBooleanStringReader.TryParseBooleanString` → pass; (c) allowlisted delegate wrapper → pass; (d) Pester 3 `Should Be` in a fixture `scripts/tests` snippet → fail if you include that rule.

## Acceptance criteria

- At least **one** retired class is actually gated in CI (boolean-coercion preferred).
- Historical delegates are allowlisted, not “fixed” with a drive-by rewrite.
- Validity audit heuristics unchanged. Closed enum unchanged.
- No `/al-bug` invocation. No new phrase-class detectors.

## Constraints

- Do not split `GenericArchitectureAdvicePatternsMultiCloudTests.cs`.
- Do not recreate `_al-bug-pick-zone.ps1`.
- Do not reopen TB-135/TB-136 or GTM cohort rows.
- Working-tree safety. Each class in its own file. Check nulls.
- Pester 5 for any new script tests.
