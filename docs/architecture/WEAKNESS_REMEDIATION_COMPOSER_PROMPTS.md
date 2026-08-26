> **Scope:** Copy-paste Composer/Cursor prompts that close remaining **v3 assessment weaknesses** after PP-01–PP-05 and ID-08–ID-10. Internal engineering and owner-prep only — not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Scores:** [`../assessments/LATEST_GPT55.md`](../assessments/LATEST_GPT55.md) §8 / §17 · **Shipped (do not re-run):** [`POLICY_PACK_EXPECTATION_COMPOSER_PROMPTS.md`](POLICY_PACK_EXPECTATION_COMPOSER_PROMPTS.md) PP-02–PP-05 · [`INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md`](INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md) ID-08–ID-10 · [`INGESTION_FIT_GAP_COMPOSER_PROMPTS.md`](INGESTION_FIT_GAP_COMPOSER_PROMPTS.md) FIT-01–05

# Weakness-remediation Composer prompts (WK-01–WK-22)

**Created:** 2026-08-26 · **Status:** ready to run (one prompt per chat).

These prompts map 1:1 to the **top-10 weaknesses** and **§17** items from the 2026-08-26 v3 assessments. They do **not** implement the remediations — paste each block into a fresh Composer/Cloud Agent chat.

**Verify current HEAD before skipping WK-01.** `archlucid-ui/src/lib/help/help-topic-view-resolver-operate.tsx` was truncated on `origin/master` when this file was written (`<HelpTopicMarkdownView entry={loaded.entry` unclosed, stray `return null`). An evening assessment pass claimed `tsconfig.build.json` green; **do not trust that claim without re-running typecheck**. If typecheck is already exit 0, skip WK-01 / WK-01b and start at WK-02.

## Why this set exists

| Weakness (assessment §8) | Prompt | Kind |
|--------------------------|--------|------|
| Insight density is still subtractive | **WK-15**, **WK-20** | honesty + hold |
| UI production typecheck FAIL (Gate 5) | **WK-01**, **WK-01b** | compile |
| Zero completed real-mode pilots (G-REAL-06) | **WK-13**, **WK-14** | owner-prep, not fake pilots |
| Bundled packs do not encode expectation extras | **WK-04**, **WK-05**, **WK-21** | default content |
| CodeQL on `master` is red | **WK-03**, **WK-03b** | security merge |
| Golden corpus still 6 of 39 engines | **WK-06** | harness |
| Alert rules client crash (`rules.slice`) | **WK-02**, **WK-02b**, **WK-17** | Operate UI |
| Full CI does not run on `master` push | **WK-11** | process |
| Actor-dependent engines silent on IaC-only reviews | **WK-07**, **WK-08**, **WK-18** | UX + optional ingest |
| Dual finding model + Simulator default | **WK-09**, **WK-10**, **WK-19** | product-of-record |
| Policy-toggle demo / moat invisible | **WK-12** | GTM artifact |
| M-07 screenshots blocked until compile | **WK-16** | owner capture |
| Synthetic frontier-delta corpus | **WK-15** (do not capture fake transcripts) | hold |

## Do not re-run (already in tree or out of contract)

| Item | Why |
|------|-----|
| PP-01 declaration prefix-family gating | Shipped (`DeclarationSignalPolicyKeyMap`) |
| PP-02–PP-05 expectation facet / stamp / resolver UNION / cost require-cap | Shipped (`POLICY_PACK_EXPECTATION_FACET.md`) |
| ID-01–ID-07, ID-08–ID-10 | Shipped or already prompted; **ID-11** is the only leftover density prompt — run it via WK-15, do not rewrite ID-08 |
| FIT-01–05 ingestion parsers | Archive |
| Pack-per-engine JSON; muting `open-commitment` / `portfolio-recurrence` / `*-cross-run-diff` | Never |
| New coverage-shaped finding engines; Graph-RAG community summarization (ADR 0057) | Hold for **G-REAL-06** |
| SOC 2 CPA (**G-REAL-05** / TB-135) and third-party pen test (**G-ASSURANCE-02** / TB-136) | Owner assurance; not `(A)` |
| GTM **M-90** / **M-44** / **M-91** / **M-92** (assessment #2/#3/#5/#6) | GTM V1.1 human cohorts |

## Sequencing

| Prompt | Title | Parallel? | Depends on |
|--------|-------|-----------|------------|
| **WK-01** | Restore Operate help catch-all JSX (Gate 5) | First if typecheck is red | none |
| **WK-01b** | Catch-all source-shape test so truncation cannot land again | After WK-01 | WK-01 |
| **WK-02** | Alert rules + composite `rules.slice` guard | Yes with WK-01 | none |
| **WK-02b** | Advisory Scans render-gate heading | Yes with WK-02 | none |
| **WK-03** | CodeQL C# SARIF | After WK-01 if JS job needs UI build | none for C# |
| **WK-03b** | CodeQL JavaScript SARIF | After WK-01 | WK-01 |
| **WK-04** | Seed FinOps `cost.requireBudgetCap` | Yes | none |
| **WK-05** | Seed CIS Azure topology `identity` extra | Yes with WK-04 | none |
| **WK-06** | Golden harness: declaration engines | Yes | none |
| **WK-07** | First-review Actor / intake requirement copy | Yes | none |
| **WK-08** | Derive Actor nodes from IAM/service-account IaC | After WK-07 | WK-07 (docs first) |
| **WK-09** | Dual-finding product-of-record design note | Yes | none |
| **WK-10** | Simulator chrome honesty on first-review / exports | Yes with WK-09 | none |
| **WK-11** | Thin `master` push typecheck corset | After WK-01 | WK-01 |
| **WK-12** | Policy-toggle demo artifact (findings + overlay extras) | After WK-04 or WK-05 | one overlay seed |
| **WK-13** | G-REAL-06 agent-prep (runbooks/scripts) | Yes | none |
| **WK-14** | G-REAL-07 proof-packet checklist alignment | After WK-13 | WK-13 |
| **WK-15** | Insight-density honesty (ID-11 + miss-clause note) | Yes | none |
| **WK-16** | M-07 operator screenshots | After WK-01 | WK-01 |
| **WK-17** | Continue-last family array guards | After WK-02 | WK-02 |
| **WK-18** | First-review empty-state when Actor engines silent | After WK-07 | WK-07 |
| **WK-19** | Dual-finding labels on buyer exports | After WK-09 | WK-09 |
| **WK-20** | Hold memo: no new coverage engines | Yes | none |
| **WK-21** | Bundled-pack GTM honesty (expectation keys unused by default) | After WK-04/WK-05 | WK-04 or WK-05 |
| **WK-22** | Policy-filtered golden harness must not switch production provider | Companion to WK-06 | WK-06 |

**Run one prompt per chat.** Feature branch per prompt. Suggested Cloud Agent shape: `cursor/<short-name>-9750`. Name the branch in any commit/push request.

## Global constraints

- Each class in its own file. Prefer LINQ. Prefer concrete types over `var`. Blank line before `if` / `foreach` unless first line of a method. Always check nulls. Comment anything a two-year developer would not follow. **No `ConfigureAwait(false)` in tests.**
- Tenant isolation stays database-per-tenant (ADR 0037).
- Before editing tracked files, run `.\scripts\agent\check-working-tree-path.ps1` on those paths.
- Stage only files this prompt changes. **No `git add -A`.** Do **not** push to `master` unless the user named `master` in the same request.
- **No new `PolicyPackContentDocument` properties** (no OpenAPI). Reuse `advisoryDefaults` keys from [`POLICY_PACK_EXPECTATION_FACET.md`](../library/POLICY_PACK_EXPECTATION_FACET.md).
- **No new finding engine** unless the prompt explicitly requires one. WK-08 may add a *materializer*, not a coverage engine.
- Do not start **G-REAL-06** live Azure OpenAI spend, SOC 2 CPA, or third-party pen test.
- One scoped compile per prompt; one retry on exit code 1.

---

# WK-01 — Restore Operate help catch-all (Gate 5)

**Closes:** §8 weakness “UI production typecheck FAIL”; §17 item restore `help-topic-view-resolver-operate.tsx`. **This is the V1 ship-gate FAIL when the file is truncated.**
**Depends on:** none
**Branch suggestion:** `cursor/help-operate-catchall-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: restore the truncated catch-all return in archlucid-ui/src/lib/help/help-topic-view-resolver-operate.tsx so production typecheck compiles. Do not redesign help dispatch.

Why: Gate 5 (architect workspace does not break on the first-review / demo path) fails when this file's catch-all HelpTopicMarkdownView JSX is unclosed. Current broken shape (verify on HEAD):

  assertHelpTopicCatchAllFallthroughAllowed(loaded.entry);

  return (
    <HelpTopicMarkdownView
      entry={loaded.entry

  return null;
}

npx tsc --noEmit -p tsconfig.build.json fails with TS1005/TS1003. next.config does not set ignoreBuildErrors. CodeQL JavaScript job runs npm run build and cannot start analysis while this is broken. M-07 screenshots are blocked.

Read first:
- archlucid-ui/src/lib/help/help-topic-view-resolver-operate.tsx (end of file)
- archlucid-ui/src/lib/help/help-topic-view-resolver.tsx (canonical catch-all: entry={loaded.entry} markdown={loaded.markdown} showContextualHelp)
- archlucid-ui/src/lib/help/help-topic-catch-all-fallthrough.ts (assertHelpTopicCatchAllFallthroughAllowed must stay)
- Sibling slug returns earlier in the operate file (e.g. scope slug) for JSX style

Work:
1. After assertHelpTopicCatchAllFallthroughAllowed(loaded.entry), return HelpTopicMarkdownView with:
   - entry={loaded.entry}
   - markdown={loaded.markdown}
   - showContextualHelp
   Match help-topic-view-resolver.tsx. Close the JSX and the function. Delete the stray `return null`.
2. Do not remove assertHelpTopicCatchAllFallthroughAllowed. Do not silently swallow unknown slugs. Do not rewrite specialty slug branches.

Do not:
- Redesign help routing or merge operate/admin/integrations resolvers.
- Set ignoreBuildErrors in next.config.
- Touch C#, OpenAPI, or SQL DDL.
- Push to master.

Compile: cd archlucid-ui && npx tsc --noEmit -p tsconfig.build.json  (exit 0)
Also run: npm run typecheck (includes build:api-types) if tsconfig.build.json is green.
Tests: existing help-topic-catch-all-fallthrough.test.ts must stay green. Do not run the full Vitest matrix.

Done when: tsc -p tsconfig.build.json exit 0; catch-all matches the parent resolver; no stray return null.
```

---

# WK-01b — Catch-all source-shape regression test

**Closes:** Gate 5 can regress on a truncated operate resolver because the existing TB-1601 source test only reads `help-topic-view-resolver.tsx`.
**Depends on:** WK-01
**Branch suggestion:** `cursor/help-operate-catchall-test-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: extend the TB-1601 source-shape test so help-topic-view-resolver-operate.tsx cannot ship a truncated catch-all again. Docs/tests only plus the test file. Do not change dispatch behavior.

Why: help-topic-catch-all-fallthrough.test.ts already readFileSyncs help-topic-view-resolver.tsx and asserts it contains assertHelpTopicCatchAllFallthroughAllowed. The truncation that broke Gate 5 was in the *operate* module, which that test does not read.

Read first:
- archlucid-ui/src/lib/help/help-topic-catch-all-fallthrough.test.ts
- archlucid-ui/src/lib/help/help-topic-view-resolver-operate.tsx (catch-all after evidence-trail slug)
- archlucid-ui/src/lib/help/help-topic-view-resolver.tsx

Work:
1. Add a test (same describe, or a sibling describe in the same file) that reads help-topic-view-resolver-operate.tsx source and asserts:
   - it contains assertHelpTopicCatchAllFallthroughAllowed
   - after that call, the source contains markdown={loaded.markdown}
   - the file does not contain a stray `return null` after the catch-all assert
2. Keep the existing parent-resolver source test.

Do not:
- Change assertHelpTopicCatchAllFallthroughAllowed contract.
- Add Playwright. Full Vitest matrix is a non-goal.

Test: cd archlucid-ui && npx vitest run src/lib/help/help-topic-catch-all-fallthrough.test.ts
Done when: removing markdown={loaded.markdown} from the operate catch-all would fail the new test.
```

---

# WK-02 — Alert rules continue-last array guard

**Closes:** §8 Alert rules client crash; §17 `rules.slice`; Vitest `operator-client-pages-render-gate.test.tsx` TB-1584.
**Depends on:** none
**Branch suggestion:** `cursor/alert-rules-slice-guard-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: make resolveContinueLastAlertRule and resolveContinueLastCompositeAlertRule return null when rules is missing, not an array, or empty, so AlertRulesContent does not throw. Add unit tests for non-array input. Do not redesign the alert-rules hub.

Why: resolveContinueLastAlertRule in archlucid-ui/src/lib/resolve-continue-last-alert-rule.ts calls rules.length then rules.slice() with no Array.isArray guard. Vitest operator-client-pages-render-gate.test.tsx throws TypeError: rules.slice is not a function while rendering AlertRulesContent when the query returns a non-array. The composite sibling archlucid-ui/src/lib/resolve-continue-last-composite-alert-rule.ts has the same pattern.

Read first:
- archlucid-ui/src/lib/resolve-continue-last-alert-rule.ts
- archlucid-ui/src/lib/resolve-continue-last-alert-rule.test.ts
- archlucid-ui/src/lib/resolve-continue-last-composite-alert-rule.ts
- archlucid-ui/src/components/alerts/AlertRulesContent.tsx (how it passes rules)
- archlucid-ui/src/app/(operator)/operator-client-pages-render-gate.test.tsx (AlertRulesContent case)

Work:
1. At the start of resolveContinueLastAlertRule, if rules is null/undefined or !Array.isArray(rules) or rules.length === 0, return null. TypeScript signature may stay readonly AlertRule[]; add a runtime guard that also accepts unknown if the call site passes query data. Prefer a narrow helper isAlertRuleArray(value: unknown): value is readonly AlertRule[].
2. Same guard in resolveContinueLastCompositeAlertRule.
3. Unit tests: null, undefined, {}, "nope", [] → null; existing newest-created test still passes.
4. Do not change localStorage key names.

Do not:
- Redesign AlertRulesContent or CompositeAlertRulesContent layout.
- Fix every continue-last helper in this prompt (that is WK-17).
- Full Vitest matrix.

Compile: none required if no C#. UI: cd archlucid-ui && npx vitest run src/lib/resolve-continue-last-alert-rule.test.ts src/lib/resolve-continue-last-composite-alert-rule.test.ts src/app/(operator)/operator-client-pages-render-gate.test.tsx

Done when: non-array rules does not throw; render-gate AlertRulesContent case is green. If the Scans tab assertion still fails, leave it for WK-02b.
```

---

# WK-02b — Advisory Scans render-gate heading

**Closes:** same Vitest file, Advisory hub Scans tab heading (empty-first UX TB-1567 vs test expecting h3 "Generate advisory scan" before a review is chosen).
**Depends on:** none (can land with WK-02)
**Branch suggestion:** `cursor/advisory-scans-render-gate-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: make operator-client-pages-render-gate.test.tsx "Advisory hub Scans tab content renders primary heading" pass without undoing empty-first UX (TB-1567). Prefer fixing the test to assert the empty-first heading that actually mounts, unless the product contract is that Generate advisory scan must show with no review selected — then mount a visible h3 with ADVISORY_SCANS_FORM_SECTION_TITLE in the empty state without showing a working generate form.

Why: AdvisoryScansContent empty-first opens on next-story CTAs / AdvisoryScansPickReviewBeforeScanningStrip. The generate form h3 ("Generate advisory scan" from ADVISORY_SCANS_FORM_SECTION_TITLE in archlucid-ui/src/lib/advisory-copy.ts) only mounts after Choose review. The render-gate still expects getByRole heading level 3 with that title immediately. Comment in the test already describes TB-1567.

Read first:
- archlucid-ui/src/app/(operator)/operator-client-pages-render-gate.test.tsx (Scans tab it)
- archlucid-ui/src/components/advisory/AdvisoryScansContent.tsx (empty-first branch around PickReviewBeforeScanningStrip)
- archlucid-ui/src/components/advisory/AdvisoryScansPickReviewBeforeScanningStrip.tsx
- archlucid-ui/src/components/advisory/AdvisoryScansContent.test.tsx (existing empty-first assertions)
- archlucid-ui/src/lib/advisory-copy.ts

Work:
1. Decide from TB-1567 comments and AdvisoryScansContent.test.tsx which heading is the empty-first contract.
2. If empty-first is the product: update the render-gate test to assert the pick-review heading (level that actually mounts) and keep a separate test that the generate h3 appears after a review is selected (reuse patterns from AdvisoryScansContent.test.tsx).
3. If generate h3 must always be in the document: render a disabled/hidden-until-pick section that still exposes the h3, without enabling scan submit with no runId.
4. Do not redesign the advisory hub.

Test: cd archlucid-ui && npx vitest run src/app/(operator)/operator-client-pages-render-gate.test.tsx src/components/advisory/AdvisoryScansContent.test.tsx
Done when: render-gate Scans case is green and empty-first UX is still documented in the test comment.
```

---

# WK-03 — CodeQL C# SARIF on master

**Closes:** §8 CodeQL red on `master`; §17 item clear SARIF gate. Last completed `master` runs have failed `scripts/ci/assert_codeql_sarif_clean.py`.
**Depends on:** none for C# (JS is WK-03b)
**Branch suggestion:** `cursor/codeql-csharp-sarif-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: make the CodeQL C# job's assert_codeql_sarif_clean.py exit 0 with zero unresolved findings. Prefer structural fixes. If a suppression is unavoidable, use a form that populates SARIF suppressions (codeql/csharp-queries AlertSuppression.ql is already packed in .github/workflows/codeql.yml). Document remaining suppressions in docs/library/CODEQL_TRIAGE.md. Do not disable the SARIF gate. Do not reopen TB-135 / TB-136.

Why: CodeQL is the workflow that actually runs on master push (ci.yml is PR + workflow_dispatch only). Unresolved findings reported in the 2026-08-26 assessment (verify on the latest failed run, then fix what is still open):

- cs/user-controlled-bypass — ArchLucid.Persistence/.../RunProvenanceQueryService.cs (~125) and ClosedLoopArchitectureReasoningOrchestrator.LiveReview.cs (~277)
- cs/log-forging — ArchitectureRunAsyncCreateAdmitter.cs (~158–159)
- cs/insecure-sql-connection — SqlConnectionStringCommandTimeout.cs (~15) and SqlConnectionStringMasterCatalog.cs (~14, 26)

Trailing // codeql[rule-id] comments have already failed to populate suppressions. Use AlertSuppression-recognized comments or the model pack in .github/codeql/.

Read first:
- .github/workflows/codeql.yml (csharp job, packs: AlertSuppression.ql, assert_codeql_sarif_clean.py)
- scripts/ci/assert_codeql_sarif_clean.py
- docs/library/CODEQL_TRIAGE.md
- docs/SECURITY.md (log injection / CWE-117)
- ArchLucid.Core.Diagnostics.LogSanitizer and SanitizedLoggerWarningExtensions
- The listed source files (confirm line numbers on current HEAD)

Work:
1. user-controlled-bypass: do not weaken authorization. If the query is a false positive on an already-authorized path, document why and use a suppression that binds into SARIF suppressions. If it is real, add an explicit allow-list / authenticated-principal check the query can see.
2. log-forging: pass user strings through LogSanitizer.Sanitize or LogWarningWithSanitizedUserArg before ILogger. Do not log raw [FromBody]/[FromQuery] strings.
3. insecure-sql-connection: local/dev-only builders must not look like production SQL auth. Prefer Azure AD / integrated patterns already used in production connection builders; if a test/dev helper must keep Sql Auth, isolate it behind an explicit Development-only path CodeQL models as non-production, or suppress with SARIF-visible justification in CODEQL_TRIAGE.md.
4. Add a CODEQL_TRIAGE.md row for every remaining suppression (rule id, file, why, date).

Do not:
- Delete the Fail on unresolved CodeQL C# SARIF findings step.
- Change tenant isolation or skip ScopeResolutionGuardMiddleware.
- Touch archlucid-ui in this prompt (WK-03b).

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath on the projects you edited (e.g. ArchLucid.Persistence / ArchLucid.Api).
Tests: existing unit tests for sanitizers and connection-string builders must stay green.

Done when: a reviewer can run CodeQL C# (or the gate script on produced SARIF) and see zero unresolved findings; CODEQL_TRIAGE.md lists any suppressions.
```

---

# WK-03b — CodeQL JavaScript SARIF

**Closes:** JS CodeQL job: `js/clear-text-storage-of-sensitive-data` and `js/incomplete-sanitization`. JS analysis also fails to start while UI `npm run build` is red (WK-01).
**Depends on:** WK-01 if `npm run build` is currently failing
**Branch suggestion:** `cursor/codeql-js-sarif-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: make the CodeQL JavaScript job's assert_codeql_sarif_clean.py exit 0. Prefer structural fixes. AlertSuppression.ql is already packed for javascript-queries. Document suppressions in docs/library/CODEQL_TRIAGE.md. Do not disable the gate.

Why: .github/workflows/codeql.yml javascript job runs npm ci && npm run build in archlucid-ui then analyze. Assessment-cited unresolved findings (verify line numbers on HEAD):

- js/clear-text-storage-of-sensitive-data — archlucid-ui/src/lib/resolve-continue-last-api-key-credential.ts (~43)
- js/incomplete-sanitization — archlucid-ui/e2e/run-architecture-lifecycle-batch.ts (~129)

Read first:
- those two files
- archlucid-ui/src/lib/resolve-continue-last-alert-rule.ts (localStorage of rule ids is OK; API key material is not)
- docs/library/CODEQL_TRIAGE.md
- scripts/ci/assert_codeql_sarif_clean.py

Work:
1. Do not store API keys, secrets, or tokens in localStorage/sessionStorage. Continue-last may store a non-secret credential *id* if the value is not the secret; rename/shape the stored payload so CodeQL can see it is an id. If the current code stores a secret, stop.
2. incomplete-sanitization: replace homemade sanitizers with an existing shared helper, or complete the sanitizer (all meta-characters the query requires). E2E batch scripts must not pretend a partial replace is HTML/SQL-safe.
3. If UI build is still failing because of help-topic-view-resolver-operate.tsx truncation, restore that catch-all first (same as WK-01) or rebase onto a branch that already did.

Do not:
- Disable javascript-sarif gate.
- Expand to the full Vitest matrix.
- Reopen TB-135/TB-136.

Done when: npm run build in archlucid-ui succeeds on this branch AND JS SARIF gate is clean or locally assertable.
```

---

# WK-04 — Seed FinOps pack with cost.requireBudgetCap

**Closes:** §8 bundled packs do not encode expectation extras; §17 seed one overlay. Mechanism exists (`PolicyPackExpectationFacetParser`); default FinOps JSON still has `priorityFloor` / `severityFloor` / `scanDepth` only.
**Depends on:** none (PP-03–PP-05 shipped)
**Branch suggestion:** `cursor/finops-require-budget-cap-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add documented cost.requireBudgetCap=true to the FinOps bundled pack advisoryDefaults (and keep the sample copy in sync). Add a test that parsing that file yields a non-empty facet with RequireBudgetCap true. Do not add PolicyPackContentDocument properties. Do not explode *-rules-v1.json. Do not make all 39 engines pack-aware.

Why: PolicyPackExpectationFacetParser keys are shipped. Assigning FinOps as-shipped does not stamp cost.requireBudgetCap because ArchLucid.Application/Governance/DefaultPolicyPacks/Bundled/cost-optimization.json advisoryDefaults only set severityFloor, priorityFloor, scanDepth. Buyers are told packs parameterize cost engines; default content does not.

Read first:
- docs/library/POLICY_PACK_EXPECTATION_FACET.md
- ArchLucid.Core/Governance/PolicyPacks/PolicyPackExpectationAdvisoryKeys.cs
- ArchLucid.Core/Governance/PolicyPacks/PolicyPackExpectationFacetParser.cs
- ArchLucid.Application/Governance/DefaultPolicyPacks/Bundled/cost-optimization.json
- docs/samples/policy-packs/cost-optimization.json (keep in sync if it is the curated twin)
- Existing parser tests (PolicyPackExpectationFacetParserTests or similar)

Work:
1. Add "cost.requireBudgetCap": "true" to advisoryDefaults on the bundled FinOps content file. Keep existing keys. Optionally add cost.breachSeverity only if a default is already justified in the facet note (Warning clamp); otherwise omit.
2. Mirror the same key on docs/samples/policy-packs/cost-optimization.json if that file is the human-edited source of truth.
3. Test: load the bundled JSON (or embed the same advisoryDefaults in a PolicyPackContentDocument) and assert parser RequireBudgetCap == true. A second test: a pack with only priorityFloor still parses empty extras / null requireBudgetCap.
4. One paragraph in docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md FinOps row or Advisory Defaults section: assigning this pack now requires a budget cap in cost-constraint when stamped. Do not claim all 39 engines are policy-aware.

Do not:
- Edit all 45 bundled packs.
- Change CostConstraintFindingEngine logic (PP-05 already honors the stamp).
- Regenerate OpenAPI.
- Gate open-commitment.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj' (or Decisioning.Tests if parser tests live there)
Test: filter FullyQualifiedName~PolicyPackExpectation

Done when: bundled FinOps JSON parses to requireBudgetCap true; packs without the key still parse empty extras.
```

---

# WK-05 — Seed CIS Azure identity topology extra

**Closes:** assigning CIS Azure as-shipped still does not stamp `expectation.topologyCategories.add=identity`.
**Depends on:** none
**Branch suggestion:** `cursor/cis-azure-identity-extra-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add expectation.topologyCategories.add=identity to CIS Azure bundled advisoryDefaults (one pack, not all CIS clouds unless the sample twins must stay identical). Parser test that this file yields Extra topology containing identity AND that additive floor still keeps heuristic pillars in resolver tests already shipped. No OpenAPI. No new engine.

Why: PolicyExpectationCoverageGoldenCorpusTests already prove a stamped identity extra changes topology-coverage missing categories. Bundled cis-azure-foundations.json advisoryDefaults are still severityFloor / priorityFloor / scanDepth only. Assigning CIS as-shipped therefore gates compliance + declaration, not coverage extras.

Read first:
- ArchLucid.Application/Governance/DefaultPolicyPacks/Bundled/cis-azure-foundations.json
- docs/samples/policy-packs/cis-azure-foundations.json
- docs/library/POLICY_PACK_EXPECTATION_FACET.md (additive floor; identity is a known GraphTopologyCategories token)
- docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md CIS Azure row

Work:
1. Add "expectation.topologyCategories.add": "identity" to advisoryDefaults on CIS Azure bundled JSON. Keep existing keys.
2. Sync the sample twin if it is the curated source.
3. Do not also flood cis-aws / cis-gcp in this prompt unless those files are generated from one template that would drift.
4. Test: parse that document → topology extras contain identity (ordinal ignore-case). Existing resolver tests that extras=["identity"] keep network/compute/storage/data must remain green (do not change resolver code).
5. DEFAULT_POLICY_PACKS_V1.md: one honest sentence that CIS Azure now adds Identity to expected topology when the stamp runs; it does not mean every engine is policy-aware.

Do not:
- Add OpenAPI fields.
- Change DeclarationSignalPolicyKeyMap.
- Expand *-rules-v1.json.

Compile/test: same PolicyPackExpectation filter as WK-04.
Done when: CIS Azure bundled JSON stamps identity extra; heuristic pillars remain documented as additive floor.
```

---

# WK-06 — Golden harness: add declaration engines

**Closes:** §8 golden corpus 6 of 39; §17 extend `GoldenCorpusHarness.CreateEngines()`.
**Depends on:** none
**Branch suggestion:** `cursor/golden-harness-declaration-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add DeclarationSecurityBaselineFindingEngine and DeclarationPremiseConflictFindingEngine to GoldenCorpusHarness.CreateEngines() with committed fixtures that assert at least one finding each. Keep existing six-engine snapshots stable (new cases, not silent rewrites of case-01..31). Do not switch the default compliance provider to the production filter (that is PolicyFilteredGoldenCorpusTests). Do not add all remaining engines. Do not add portfolio-recurrence I/O to the in-process harness.

Why: CreateEngines() still registers RequirementFindingEngine, TopologyCoverageFindingEngine, SecurityBaselineFindingEngine, SecurityCoverageFindingEngine, ComplianceFindingEngine(FileComplianceRulePackProvider), CostConstraintFindingEngine. Declaration engines have sibling policy-filter tests but are absent from the merge-blocking harness path. docs/library/DECISIONING_GOLDEN_CORPUS.md documents the six-engine contract.

Read first:
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusHarness.cs CreateEngines()
- docs/library/DECISIONING_GOLDEN_CORPUS.md
- GoldenCorpusGraphFactory / case-31 README
- PolicyFilteredDeclarationGoldenCorpusTests (how declaration engines are constructed in tests)
- DeclarationSecurityBaselineFindingEngine / DeclarationPremiseConflictFindingEngine constructors

Work:
1. Register the two declaration engines in CreateEngines() with the same construction pattern the sibling tests use (graph-pure; no IEffectiveGovernanceLoader on the engine).
2. Add new case indices only (next free case-NN). Graphs must include declaration property bags that those engines actually fire on (tf.* / ARM keys already extracted — reuse ID-08 keys; do not invent a new parser).
3. expected-findings.json must include at least one finding from each new engine. Add a test that CreateEngines() contains those engine types so removing them fails CI.
4. Do not regenerate case-01..31 unless a new engine would change them — if it would, prefer graphs that only appear in the new cases so old snapshots stay bit-stable.
5. Update DECISIONING_GOLDEN_CORPUS.md coverage map: harness engines are now 8, still not 39; FileComplianceRulePackProvider remains.

Do not:
- Inject IEffectiveGovernanceLoader into the harness orchestrator in this prompt (WK-22).
- Add open-commitment (needs governance history I/O).
- Expand compliance rule JSON.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test: dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~GoldenCorpus"

Done when: new cases fail if the two declaration engines are removed from CreateEngines(); old cases unchanged.
```

---

# WK-07 — First-review UX: Actor / intake requirement

**Closes:** §8 Actor-dependent engines stay silent on IaC-only reviews. Fastest path is documentation in first-review UX, not a new engine.
**Depends on:** none
**Branch suggestion:** `cursor/first-review-actor-intake-copy-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: tell operators that trust-boundary, privileged-access, and external-exposure findings need Actor nodes, which today come from guided intake (RequestActorMaterializer / ContextScopeMetadataKeys.Actors), not from Bicep/Helm dumps. Copy + empty-state hint only. Do not add a finding engine. Do not derive IAM actors in this prompt (WK-08).

Why: TrustBoundaryFindingEngine returns empty unless ≥2 Actor nodes with mixed internal/external origins. PrivilegedAccessFindingEngine needs internal human Actor nodes. ExternalExposureFindingEngine similarly depends on Actor/exposure shape. GraphMaterializationStages.RequestActorMaterializationStage reads SourceHashes[Actors] JSON only. IaC-only first reviews therefore look like those engines "do nothing."

Read first:
- ArchLucid.KnowledgeGraph/Materialization/RequestActorMaterializer.cs
- ArchLucid.KnowledgeGraph/Materialization/GraphMaterializationStages.cs (request-actors stage)
- ArchLucid.Decisioning/Services/TrustBoundaryFindingEngine.cs
- ArchLucid.Decisioning/Services/PrivilegedAccessFindingEngine.cs
- ArchLucid.Decisioning/Services/ExternalExposureFindingEngine.cs
- docs/library/CANONICAL_FIRST_RUN_PATH.md
- archlucid-ui guided intake actor editor: DraftIntakeActorEditor.tsx, draft-intake-actor-suggestions.ts
- in-app help topic for first-review / evidence-intake (page-help-topic-rows-operator.ts first-review-guide)

Work:
1. Add a short operator-facing note to CANONICAL_FIRST_RUN_PATH.md (first-architecture-review walkthrough): if you only upload IaC, trust-boundary and privileged-access engines stay silent until you add actors in guided intake.
2. Surface the same sentence in the guided-intake actor step UI (existing editor empty state or help strip) — reuse design-system Alert/InlineNotification; do not invent a new layout system.
3. Optional: one help-topic markdown paragraph on the first-review-guide / evidence-intake topic. Do not rewrite the whole help corpus.
4. Tests: a copy assertion or component test that the empty actor editor includes a substring like "trust-boundary" or "Actor" requirement — keep it stable.

Do not:
- Change RequestActorMaterializer.
- Claim IaC parsers emit actors (they do not).
- Touch OpenAPI.

Done when: a principal architect doing IaC-only upload can read, in-product, why those three engines were quiet.
```

---

# WK-08 — Derive Actor nodes from IAM / service-account declarations

**Closes:** optional half of §8 Actor weakness. New *information source* (declaration properties → Actor nodes), not a new coverage engine.
**Depends on:** WK-07 (docs landed so UX honesty exists even if this is deferred)
**Branch suggestion:** `cursor/iam-declaration-actors-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: when guided-intake Actors JSON is absent, materialize Actor nodes from already-parsed infrastructure declaration properties for IAM users/roles and Kubernetes service accounts — bounded, graph-pure, no new finding engine. Fail-open: unknown shapes emit nothing. Do not mute RequestActorMaterializer when intake JSON exists (HasCanonicalActors skip stays).

Why: Bicep/Helm dumps create topology nodes; Actor-dependent engines stay silent. CanonicalInfrastructurePropertyBag already holds tf.* / k8s.* keys from ID-08. A small materializer that maps known identity resource types onto GraphNodeTypes.Actor is a new information source. It is not a resilience/DR engine.

Read first:
- GraphMaterializationStages RequestActorMaterializationStage (HasCanonicalActors short-circuit)
- RequestActorMaterializer and ActorDescriptor
- GraphNodeTypes.Actor / TrustBoundary
- Declaration parsers / CanonicalInfrastructurePropertyBag
- TrustBoundaryFindingEngine / PrivilegedAccessFindingEngine predicates (trustOrigin Internal vs External)

Work:
1. New class in its own file, e.g. DeclarationIdentityActorMaterializer. From graph or from canonical objects, emit Actor nodes for a documented allow-list of types (azurerm_role_assignment / azuread_service_principal / kubernetes ServiceAccount / aws_iam_role — only types already parsed today). Set trustOrigin Internal for in-cluster SAs; External for public/anonymous principals if a property already says so. Never guess privileged=true without a property.
2. Wire as a materialization stage after request-actors, skipped when HasCanonicalActors or when intake JSON produced any Actor.
3. Tests: fixture with a ServiceAccount k8s node and no intake actors → at least one Actor node; fixture with intake actors → no duplicate overwrite; empty graph → empty.
4. Docs: one paragraph in POLICY_PACK_EXPECTATION_FACET.md is the wrong home — put it in CONTEXT_INGESTION.md or CANONICAL_FIRST_RUN_PATH.md: IaC identity resources may now seed actors; guided intake still wins.

Do not:
- Add PrivilegedAccessFindingEngine changes except to consume existing Actor properties.
- Add a 40th finding engine.
- Parse Pulumi/CDK/Helm templates (rendered manifests only, as today).
- Call live cloud IAM APIs.

Compile: KnowledgeGraph.Tests + Decisioning.Tests scoped to the new materializer / trust-boundary with declaration-seeded actors.
Done when: an IaC-only graph with a known identity resource produces Actor nodes and trust-boundary can fire without intake JSON.
```

---

# WK-09 — Dual-finding product-of-record design note

**Closes:** §8 dual finding model; §20 founder decision (a) sealed FindingsSnapshot vs AgentResult.Findings. Docs only.
**Depends on:** none
**Branch suggestion:** `cursor/dual-finding-record-note-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: write a short engineering design note that states which finding stream is the product of record for V1 buyer exports, sponsor ROI, and ITSM tickets — and how Simulator mode must label the other stream. Docs only.

Why: Sealed FindingsSnapshot (deterministic engines) and AgentResult.Findings (agent stream) both exist. Buyer-facing exports often lead with the agent stream. Default host mode is Simulator (ArchLucid.Api/appsettings.json) and EnableLlmJudge defaults false. A sponsor can be shown canned agent prose as if it were Real. Assessment §8.10 / §20 asks for a founder decision; this note records the decision as "sealed snapshot is the record; agent stream is advisory unless Real mode + emission gate" UNLESS you find existing docs that already contradict that — then surface the contradiction instead of inventing policy.

Read first:
- FindingsOrchestrator / FindingsSnapshot
- AgentArchitectureFindingEmissionGate
- archlucid-ui/src/lib/simulator-mode-chrome-copy.ts (SIMULATOR_MODE_*)
- docs/library/ARCHITECTURE_INVARIANTS_ONE_PAGE.md
- docs/library/AGENT_OUTPUT_EVALUATION.md
- Export formatters that choose which findings list to print

Write docs/library/FINDING_STREAM_PRODUCT_OF_RECORD.md covering:
1. Two streams, who writes them, who seals them.
2. V1 product of record for: finalize gate, sponsor ROI, ITSM FindingId, golden corpus, audit.
3. Agent stream: emission gate requirements (PolicyRuleId + EvidenceRefs); Simulator = rehearsal.
4. UI/export claim boundary: never imply Simulator agent findings are live-model output.
5. Open founder decision leftover: should density scoring ever demote typed engines (point at ID-11; do not decide).
Index from docs/architecture/README.md.

Do not change product code. Do not enable Real mode by default.

Done when: a reviewer can implement WK-19 (export labels) from this note without guessing.
```

---

# WK-10 — Simulator chrome honesty on first-review path

**Closes:** §8 Simulator default + canned impressive stream. Copy already exists for the top bar; first-review and export surfaces may still under-label.
**Depends on:** none (pairs with WK-09)
**Branch suggestion:** `cursor/simulator-first-review-honesty-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: reuse SIMULATOR_MODE_* copy from archlucid-ui/src/lib/simulator-mode-chrome-copy.ts on the first-review findings panel and any export/download confirmation that includes agent findings while AgentExecution:Mode is Simulator. Do not change default host mode. Do not invent new tone.

Why: Top-bar chip already says "Simulator mode — AI operations use rule-based analysis, not a live model." Principal-architect dismissal still fires when Simulator-labeled canned output is presented as Real on the findings body or in a downloaded pack.

Read first:
- simulator-mode-chrome-copy.ts and SimulatorModeTopBarChip.tsx
- First-review / run-detail findings list components
- Export confirmation dialogs
- How the UI knows simulator vs real (existing execution-mode API field)

Work:
1. If findings list / export confirmation do not already show SIMULATOR_MODE_AI_OPERATION_NOTICE_TITLE/BODY when mode is Simulator, add the existing strings (do not fork copy).
2. Tests: chip/notice present when mode=Simulator; absent when Real (mock the mode flag).
3. Do not default the API to Real. Do not enable EnableLlmJudge.

Done when: a Simulator tenant cannot export a pack without seeing the rehearsal notice on the path that includes agent findings.
```

---

# WK-11 — Thin master-push typecheck corset

**Closes:** §8 full CI does not run on `master` push. `ci.yml` `on:` is `pull_request` + `workflow_dispatch` only. `ui-typecheck` already blocks PRs; direct pushes skip it. Do **not** enable the full Suite=Core + Playwright matrix on every `master` push (CI cost).
**Depends on:** WK-01 (otherwise the new job is a permanent red)
**Branch suggestion:** `cursor/master-push-typecheck-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: make a truncated Operate help resolver fail on the next direct push to master, without running the entire ci.yml matrix on every push. Prefer a tiny workflow or a push trigger that only runs gitleaks + ui-typecheck (and optionally the existing CodeQL workflow, which already pushes). Document the tradeoff in docs/TEST_EXECUTION_MODEL.md.

Why: Gate 5 truncation reached master because ci.yml does not run on push. ui-typecheck (job name "Operator UI: typecheck (blocking)") already exists inside ci.yml and is blocking on pull_request. ui-static-quality is warn-only and if: github.event_name != 'pull_request' — which on current triggers means workflow_dispatch only.

Read first:
- .github/workflows/ci.yml on: block and ui-typecheck / ui-static-quality jobs
- .github/workflows/codeql.yml on.push
- docs/TEST_EXECUTION_MODEL.md
- .github/BRANCH_PROTECTION.md

Work:
1. Add on.push branches: [main, master] to ci.yml ONLY if you can job-level if: so that on push you run a thin set (gitleaks + ui-typecheck). All Suite=Core / Playwright / SQL jobs must remain skip or needs: a condition that is false on push. Alternatively create .github/workflows/ui-typecheck-on-push.yml that duplicates the ui-typecheck steps only.
2. Do not set continue-on-error on the thin typecheck job.
3. Document: PRs keep today's corset; master push gets UI typecheck; full matrix remains workflow_dispatch / PR as today.
4. Do not add required checks that GitHub org admins must click unless you update BRANCH_PROTECTION.md with the exact check name.

Do not:
- Enable Tier 2 SQL on every master push.
- Disable path-lane skips on PRs.

Done when: a push that truncates help-topic-view-resolver-operate.tsx would fail a blocking Actions job; a docs-only PR still does not run full SQL.
```

---

# WK-12 — Policy-toggle demo artifact (findings + overlay extras)

**Closes:** §10.7 / §17 one-screen policy-toggle demo. Existing [`POLICY_PACK_DELTA_DEMO_SCRIPT.md`](../go-to-market/POLICY_PACK_DELTA_DEMO_SCRIPT.md) proves *pre-finalize gate* flips on priority floor — not compliance finding deltas or coverage extras.
**Depends on:** WK-04 or WK-05 so an overlay extra exists in bundled/sample JSON
**Branch suggestion:** `cursor/policy-toggle-demo-extras-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: extend the policy-pack delta demo so a buyer sees (1) SOC 2 vs CIS Azure change which compliance/declaration findings fire, and (2) an overlay extra (FinOps requireBudgetCap and/or CIS identity topology extra) change coverage/cost findings — on one script/page. Reuse scripts/demo-policy-pack-delta.ps1 and PolicyFilteredGoldenCorpusTests / PolicyExpectationCoverageGoldenCorpusTests. Do not invent live staging. Do not claim all 39 engines are policy-aware.

Why: three influence kinds are shipped; the buyer-facing artifact still narrates P0 floor → gate block. Assessment §10.5: two tenants, identical architecture, different packs including an overlay extra.

Read first:
- docs/go-to-market/POLICY_PACK_DELTA_DEMO_SCRIPT.md
- scripts/demo-policy-pack-delta.ps1
- docs/quality/policy-filter-golden-delta.md
- PolicyFilteredGoldenCorpusTests, PolicyFilteredDeclarationGoldenCorpusTests, PolicyExpectationCoverageGoldenCorpusTests
- docs/library/POLICY_PACK_EXPECTATION_FACET.md claim boundary

Work:
1. Add a section "Finding-set toggle (compliance + declaration + extras)" to the demo script: talk track, which golden tests prove it, and a screenshot checklist (findings list, severity, pre-finalize verdict, audit entry). Optionally show identity appearing in missing topology categories when the CIS extra is assigned.
2. If the PowerShell demo can dry-run two pack documents against one runId, add a -ShowFindingDelta switch that prints rule id sets. If the API cannot do that without persist, document the golden-test path as the offline artifact and do not fake HTTP.
3. Honesty: bundled packs without expectation keys still will not add identity until WK-04/WK-05 land; the script must not say SOC 2 assignment alone stamps topology extras.

Do not:
- Start G-REAL-06.
- Add OpenAPI fields.
- Rewrite buyer "brain of the governance engine" into a lie (WK-21).

Done when: a sales engineer can run or cite one artifact that shows findings/severity/gate/audit change, including one overlay extra.
```

---

# WK-13 — G-REAL-06 agent-prep (not substitute for live runs)

**Closes:** §8 zero pilots; §17 item 1. Agent prepares scenarios, scripts, packet folders. Owner still supplies real architecture + judgment.
**Depends on:** none
**Branch suggestion:** `cursor/g-real-06-agent-prep-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: make G-REAL-06 executable for the owner without inventing pilot results. Tighten docs/runbooks/THREE_REAL_MODE_PROOF_RUNS.md so run 2 is two governance postures on the SAME architecture (and once with an expectation overlay). Add a checklist that capture scripts already exist. Do not run Azure OpenAI. Do not write fake PROOF_PACKET_RUN_LOG rows.

Why: commercial diagnostics in assessment §3 stay offline-derived until three real-mode committed runs exist. The runbook already has a three-run matrix, collect-first-pilot-proof.ps1, and Invoke-RealLlmEvidenceGate.ps1. It does not yet require the policy-toggle overlay the 2026-08-26 assessment asked for (§10.6).

Read first:
- docs/runbooks/THREE_REAL_MODE_PROOF_RUNS.md
- docs/runbooks/OWNER_REAL_MODE_EVIDENCE_CHECKLIST.md
- docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md
- docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md
- docs/go-to-market/GTM_BACKLOG.md G-REAL-06 / G-REAL-07 / M-39
- docs/go-to-market/CLAIM_READINESS_STATUS.md (proof-packet run log section)
- scripts/collect-first-pilot-proof.ps1

Work:
1. Update the run matrix: Run 1 default Core Pilot; Run 2 same architecture + second pack (SOC 2 vs CIS) and record finding/severity/gate delta; Run 3 compare path. Add an optional Run 2b overlay extra (identity or requireBudgetCap) when WK-04/WK-05 content exists.
2. Add a "Agent may prepare / owner must judge" table: scenario briefs, redaction, spend cap ($15 MTD golden cohort), stop conditions. Explicit: agents must not fill G4 rows with simulator output labeled Real.
3. Point at CLAIM_READINESS_STATUS.md for the log (PROOF_PACKET_RUN_LOG.md redirects there).
4. Do not enable AnonymousExecutionEnabled. Do not start SOC 2 CPA.

Done when: the owner can follow the runbook and produce three packets without inventing a fourth engine.
```

---

# WK-14 — G-REAL-07 proof-packet checklist alignment

**Closes:** G-REAL-07 / M-39 depend on WK-13 output. Docs: operating checklist vs actual script flags.
**Depends on:** WK-13
**Branch suggestion:** `cursor/g-real-07-packet-checklist-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: align G-REAL-07 docs so collect-first-pilot-proof.ps1 -SponsorHandoff -FailOnHold and the CLAIM_READINESS_STATUS.md G4 operating checklist name the same artifacts (findings snapshot id, execution mode=Real, pack ids, overlay extras if used, redaction). Docs only. Do not append fake G4 rows.

Read first:
- docs/go-to-market/GTM_BACKLOG.md G-REAL-07 / M-39
- docs/go-to-market/CLAIM_READINESS_STATUS.md proof-packet run log + operating checklist
- scripts/collect-first-pilot-proof.ps1 (parameters)
- docs/runbooks/THREE_REAL_MODE_PROOF_RUNS.md (after WK-13)

Work:
1. Make the checklist a 1:1 map of script outputs vs G4 row columns. If a column cannot be filled from the script, mark owner-manual.
2. Require execution-mode Real recorded; Simulator packets are HOLD.
3. Include the policy-toggle delta fields from WK-13.

Done when: M-39 "≥3 G4 rows" has a fill-in template that matches the collector script.
```

---

# WK-15 — Insight-density honesty (ID-11 + miss-clause note)

**Closes:** §8 insight density still subtractive; §17 items 9–11 (advisory labeling, no demotion sneak-in, no fake frontier transcripts).
**Depends on:** none
**Branch suggestion:** `cursor/insight-density-honesty-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: (1) run the existing ID-11 prompt from docs/architecture/INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md if those advisory labels are not already on every density surface; (2) write a short miss-clause note that a filter cannot raise density and that no new coverage engine should be added from this chat. Do not change DeterministicInsightDensityGate typed-engine-protected. Do not capture live frontier transcripts. Do not add a finding engine.

Why: Score is computed then discarded for all 39 engines (Promote + typed-engine-protected). tests/eval-corpus/insight-density-frontier-delta/README.md already says fixtures are not captured frontier transcripts. Adding engines that re-read GraphSnapshot grows the denominator.

Read first:
- docs/architecture/INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md ID-11 block — execute that work if not landed
- docs/quality/insight-density-engine-distribution.md
- ArchLucid.Core/Findings/DeterministicInsightDensityGate.cs
- docs/architecture/INSIGHT_DENSITY_COMPOSER_PROMPTS.md (miss clause table)

Work:
1. ID-11 as specified in the ID-08 file (claimBoundary on distribution report + related docs).
2. New docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md (or a section in the distribution doc): pillar clauses miss/dismiss/operationalize/package; current mechanisms only cover dismiss; G-REAL-06 must name the category before any deep engine; forbidden: 40th coverage engine from this prompt.
3. Index from docs/architecture/README.md or the existing density composer file "After running" section.

Do not:
- Apply DemotionThreshold to typed engines.
- Check in fake Claude/GPT transcripts.
- Start TB-885 / TB-2033–2037 / ADR 0057 Graph-RAG.

Done when: density surfaces say advisory-only; miss-clause note exists; gate behavior unchanged.
```

---

# WK-16 — M-07 operator screenshots (after typecheck)

**Closes:** §17 M-07; unblocks M-09 / M-16. Owner picks final frames; agent drives the capture harness.
**Depends on:** WK-01 (workspace must typecheck)
**Branch suggestion:** `cursor/m07-operator-screenshots-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: capture 6–8 polished operator-workflow screenshots per GTM M-07 using the existing brief in docs/go-to-market/DEMO_QUICKSTART.md #screenshot-capture-brief. Save under docs/go-to-market/screenshots/. Do not invent a new capture stack if e2e/capture-all-screenshots or demo-start already exists. Simulator chrome must remain visible (do not crop the Simulator chip). Do not claim Real-mode AI.

Why: M-07 blocks M-16 demo video and remaining M-09 landing deploy. Capture brief already lists screens (wizard, run detail, findings, decisions, report/export). Gate 5 truncation must be fixed first (WK-01).

Read first:
- docs/go-to-market/GTM_BACKLOG.md M-07
- docs/go-to-market/DEMO_QUICKSTART.md screenshot-capture-brief (screens 1–N; pick 6–8 that cover Capture, Evidence, Review, Findings, Decisions, Report, whitelabeled export)
- archlucid-ui/e2e/capture-all-screenshots.spec.ts and screenshot helpers
- scripts/demo-start (docker demo seed)

Work:
1. Verify npx tsc --noEmit -p tsconfig.build.json exit 0. If red, stop and do WK-01.
2. Capture 6–8 PNGs at 1440x900 or 1920x1080 light mode per the brief. Include Simulator chip where the shell shows it.
3. Commit only the screenshots + a one-row update to SCREENSHOT_GALLERY / DEMO_QUICKSTART if paths changed.
4. Do not mark M-07 Done in GTM_BACKLOG.md unless the owner asked — leave status to the owner.

Do not:
- Record M-16 video in this prompt.
- Enable production AnonymousExecutionEnabled.
- Use ignoreBuildErrors.

Done when: 6–8 PNGs exist on the branch matching the M-07 workflow list.
```

---

# WK-17 — Continue-last family array guards

**Closes:** same crash class as WK-02 across other Operate continue-last helpers that call `.slice()` on query collections.
**Depends on:** WK-02 (establish the pattern)
**Branch suggestion:** `cursor/continue-last-array-guards-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add the same runtime array guard used in WK-02 to other resolve-continue-last-* helpers that call collection.slice().sort(...) on API lists. Shared helper in its own file if more than three call sites. Do not change path-prefix .slice() on strings.

Why: grep shows the same unguarded pool.slice().sort pattern in resolve-continue-last-alert.ts, -webhook-subscription, -auth-domain, -risk-exception, -recycle-bin-project, -recurrence-schedule, -digest-*, -advisory-schedule, -api-key-credential, etc. WK-02 only fixed alert rules. A non-array query payload will throw on those hubs too.

Read first:
- WK-02's guard (Array.isArray / empty → null)
- archlucid-ui/src/lib/resolve-continue-last-*.ts (skip files that only slice strings)
- Existing unit tests beside each helper

Work:
1. Extract isReadonlyArrayOfLength or similar in its own module; use it at the start of each list-based continue-last resolver.
2. Unit test non-array → null for each helper you touch.
3. Do not change storage keys or routing.

Test: vitest run on the touched *.test.ts files only.
Done when: non-array input returns null instead of throwing for every list-based continue-last helper you listed in the PR.
```

---

# WK-18 — Findings empty-state when Actor engines silent

**Closes:** UX half of Actor silence after WK-07 copy. Show a findings-panel hint when the graph has zero Actor nodes.
**Depends on:** WK-07
**Branch suggestion:** `cursor/actor-engines-empty-state-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: on review findings UI, when the graph/snapshot has no Actor nodes, show a single honest empty-state line: trust-boundary / privileged-access engines did not run because no actors were modeled — add them in guided intake (link). Do not fake findings. Do not add an engine.

Why: quiet engines look like "ArchLucid found nothing." Principal-architect dismissal is recognizing every finding as already-known; silent security engines make the first IaC-only review look thinner than it is.

Read first:
- Findings list on run detail
- Graph snapshot API fields available to the UI (node types)
- WK-07 copy

Work:
1. If the UI already has node-type counts, branch on Actor count === 0. If not, a narrow API field is out of scope unless an existing DTO already exposes it — do not add OpenAPI fields without an existing property.
2. Reuse Carbon inline notification. Link to guided intake actor step.
3. Test: fixture with zero actors shows the hint; fixture with actors does not.

Done when: IaC-only reviews explain the missing actor-dependent engines in the findings panel.
```

---

# WK-19 — Dual-finding labels on buyer exports

**Closes:** export/sponsor pack leading with agent stream. Implement the WK-09 note.
**Depends on:** WK-09
**Branch suggestion:** `cursor/export-finding-stream-labels-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: buyer-facing Markdown/DOCX/ZIP export headings distinguish sealed engine findings (FindingsSnapshot) from agent findings (AgentResult.Findings). Simulator packs must include SIMULATOR_MODE rehearsal language. Follow docs/library/FINDING_STREAM_PRODUCT_OF_RECORD.md (WK-09). Do not change which stream the finalize gate uses unless the note says so.

Why: dual counts confuse sponsors. Default Simulator + judge-off means the prose stream is canned.

Read first:
- WK-09 note
- Export formatters (Application/Decisioning export)
- simulator-mode-chrome-copy.ts strings (reuse sense, not React)

Work:
1. Section titles: "Deterministic findings (sealed)" vs "Agent findings (advisory)" or the exact words from the note.
2. If execution mode is Simulator, prepend the rehearsal sentence to the agent section.
3. Tests: export fixture contains both headings; Simulator fixture contains rehearsal substring.

Do not:
- Drop engine findings from the pack.
- Enable Real mode by default.

Done when: a sponsor ZIP cannot be mistaken for a single undifferentiated finding list.
```

---

# WK-20 — Hold memo: no new coverage engines

**Closes:** assessment stop-doing list; §17 deep engine held for G-REAL-06. Docs only.
**Depends on:** none
**Branch suggestion:** `cursor/hold-coverage-engines-note-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add a short hold note that Cursor agents must not add resilience/DR, IAM-depth, secrets-lifecycle, segmentation-semantics, observability, or capacity finding engines until G-REAL-06 names the category. Point at INSIGHT_DENSITY_COMPOSER_PROMPTS.md miss clause. Docs only.

Write docs/quality/HOLD_NO_COVERAGE_ENGINES.md and index it from docs/architecture/INSIGHT_DENSITY_COMPOSER_PROMPTS.md "do not start" table (already lists this — strengthen with a dedicated note).

Do not add an engine in this prompt.

Done when: the hold is one click from the architecture index or the density composer archive.
```

---

# WK-21 — Bundled-pack GTM honesty

**Closes:** DEFAULT_POLICY_PACKS_V1.md still reads like packs are the "brain" while bundled JSON may only set priorityFloor until WK-04/WK-05. Claim boundary after extras are seeded.
**Depends on:** WK-04 or WK-05 (or write the honesty paragraph in the same PR if extras are not seeded yet)
**Branch suggestion:** `cursor/pack-gtm-honesty-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add one honest paragraph to docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md (The "Brain" of the Governance Model) listing the three policy-awareness kinds and stating that bundled packs drive rule-set + declaration gating via complianceRuleKeys/priorityFloor, and coverage/cost extras only when advisoryDefaults expectation.* / cost.requireBudgetCap keys are present. After WK-04/WK-05, name which packs actually have those keys. Do not claim all 39 engines are policy-aware. Do not rewrite buyer positioning into superior insight.

Read first:
- docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md
- docs/library/POLICY_PACK_EXPECTATION_FACET.md
- docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md gtm-do-not-promise

Work: one paragraph + optional footnote on the FinOps/CIS rows. Point at POLICY_PACK_EXPECTATION_FACET.md.

Done when: a seller cannot honestly say "assign SOC 2 and topology extras appear" unless that pack's JSON actually contains the keys.
```

---

# WK-22 — Do not switch golden harness to production governance loader

**Closes:** companion to WK-06. Prevents a well-meaning follow-up from injecting `IEffectiveGovernanceLoader` into `GoldenCorpusHarness` and making snapshots environment-dependent.
**Depends on:** WK-06 (or land as a comment in DECISIONING_GOLDEN_CORPUS.md even if WK-06 is not done)
**Branch suggestion:** `cursor/golden-harness-no-prod-filter-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: document in docs/library/DECISIONING_GOLDEN_CORPUS.md that GoldenCorpusHarness must keep FileComplianceRulePackProvider and must not take IEffectiveGovernanceLoader. Policy filter and expectation stamp stay in sibling tests (PolicyFilteredGoldenCorpusTests, PolicyFilteredDeclarationGoldenCorpusTests, PolicyExpectationCoverageGoldenCorpusTests). Docs only unless a comment on CreateEngines() is needed.

Why: merging production governance into the merge-blocking harness would make case-01..31 depend on tenant pack seeds and break bit-stability.

Done when: the corpus doc has an explicit non-goal box a Composer agent will see before "fixing" the harness.
```

---

## After running these

1. **WK-01 first** if `tsconfig.build.json` is red. Then WK-02 / WK-02b (known broken Operate surfaces). Then WK-03 / WK-03b.
2. **Do not** start a 40th coverage engine. **Do not** treat unused `advisoryDefaults` keys as if every bundled pack already parameterized coverage — seed WK-04/WK-05 then tell the truth in WK-21.
3. **G-REAL-06** remains owner-executed. WK-13/WK-14 only make the protocol runnable.
4. Re-score `(A)` only with a fresh assessment pass after Gate 5 is actually green and at least one real-mode packet exists — no score carry-forward.

## Related

- [`POLICY_PACK_EXPECTATION_COMPOSER_PROMPTS.md`](POLICY_PACK_EXPECTATION_COMPOSER_PROMPTS.md) — PP-02–PP-05 archive (shipped)
- [`INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md`](INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md) — ID-08–ID-10 shipped; ID-11 via WK-15
- [`INGESTION_FIT_GAP_COMPOSER_PROMPTS.md`](INGESTION_FIT_GAP_COMPOSER_PROMPTS.md) — FIT archive
- [`../assessments/LATEST_GPT55.md`](../assessments/LATEST_GPT55.md) — canonical scores
- [`../library/POLICY_PACK_EXPECTATION_FACET.md`](../library/POLICY_PACK_EXPECTATION_FACET.md) — additive floor contract
