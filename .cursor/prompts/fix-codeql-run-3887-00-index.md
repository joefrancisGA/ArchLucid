# CodeQL run #3887 — index (assess + fix prompts)

> **Workflow run:** [`29590827329`](https://github.com/joefrancisGA/ArchLucid/actions/runs/29590827329)
> (`run_number` **3887**), workflow **CodeQL**, branch `master`,
> commit `312731f10e9bbd931bd99e75414eec8aaf3f27fd`
> (push title: *TB-697: mark backlog closed with deferred-import closure detail.*).
>
> **Conclusion:** failure — both jobs red.
>
> | Job | Job id | Failed step | What blocked |
> |-----|--------|-------------|--------------|
> | **CodeQL (javascript)** | `87919277932` | Install and build UI | Next.js typecheck (analysis never ran) |
> | **CodeQL (csharp)** | `87919277967` | Fail on unresolved CodeQL C# SARIF findings | **2** unresolved SARIF results |

## Verdict

Two **merge-blocking C# CodeQL findings** plus a **UI build break** that prevents the JavaScript analysis/SARIF gate from running. Once the UI build is green, expect three additional **open JS code-scanning alerts** to hit `assert_codeql_sarif_clean.py` (they are already open on `master`).

Do **not** dismiss alerts in the GitHub UI alone — this repo’s gate reads SARIF via
[`scripts/ci/assert_codeql_sarif_clean.py`](../../scripts/ci/assert_codeql_sarif_clean.py)
and fails on any non-suppressed result that is not `note`/`none`. Prefer real mitigations
aligned with [`docs/library/CODEQL_TRIAGE.md`](../../docs/library/CODEQL_TRIAGE.md).

## Fix prompts (run in this order)

| # | Prompt | Blocks run 3887? | Alert / rule |
|---|--------|------------------|--------------|
| 1 | [`fix-codeql-run-3887-01-user-controlled-bypass-terms.md`](fix-codeql-run-3887-01-user-controlled-bypass-terms.md) | **Yes (C# SARIF)** | [#766](https://github.com/joefrancisGA/ArchLucid/security/code-scanning/766) `cs/user-controlled-bypass` |
| 2 | [`fix-codeql-run-3887-02-support-problem-report-email-domain-log.md`](fix-codeql-run-3887-02-support-problem-report-email-domain-log.md) | **Yes (C# SARIF)** | [#767](https://github.com/joefrancisGA/ArchLucid/security/code-scanning/767) `cs/exposure-of-sensitive-information` |
| 3 | [`fix-codeql-run-3887-03-ui-build-structural-execution-mode.md`](fix-codeql-run-3887-03-ui-build-structural-execution-mode.md) | **Yes (JS job build)** | TypeScript — not a CodeQL rule |
| 4 | [`fix-codeql-run-3887-04-sign-in-authority-host-checks.md`](fix-codeql-run-3887-04-sign-in-authority-host-checks.md) | **Likely after #3** | [#763](https://github.com/joefrancisGA/ArchLucid/security/code-scanning/763) / [#764](https://github.com/joefrancisGA/ArchLucid/security/code-scanning/764) `js/incomplete-url-substring-sanitization` |
| 5 | [`fix-codeql-run-3887-05-report-problem-surfaces-toctou.md`](fix-codeql-run-3887-05-report-problem-surfaces-toctou.md) | **Likely after #3** | [#765](https://github.com/joefrancisGA/ArchLucid/security/code-scanning/765) `js/file-system-race` |

## Out of scope for this run (open but not in 3887 SARIF gate)

These remain open in code scanning but were **not** listed by the C# SARIF assert on run 3887.
Do not expand scope unless a later CodeQL run fails on them:

| Alert | Rule | Path |
|-------|------|------|
| [#744](https://github.com/joefrancisGA/ArchLucid/security/code-scanning/744) | `cs/cleartext-storage-of-sensitive-information` | `ArchLucid.Core/Costing/AwsPublicPricingClient.cs:117` |
| [#572](https://github.com/joefrancisGA/ArchLucid/security/code-scanning/572) | `cs/exposure-of-sensitive-information` | `ArchLucid.Host.Core/Integration/AzureServiceBusIntegrationEventPublisher.cs:121` |

## Acceptance for the whole batch

1. Re-run workflow **CodeQL** on the fix branch (or wait for push to `master`).
2. **CodeQL (csharp)** — SARIF assert exits 0 (zero unresolved findings).
3. **CodeQL (javascript)** — `npm run build` succeeds, analysis runs, SARIF assert exits 0.
4. Alerts **#766**, **#767**, **#763**, **#764**, **#765** closed or absent from the new SARIF.
