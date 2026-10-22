# Verify: CI run #2165 — fixes for #2164 failures

> Branch: `ci/fix-idempotency-concurrency-hang-guard`. Run #2164 (`27464501457`) failed **7** jobs.
> This prompt documents the fixes landed after that run. **Do not re-diagnose** — verify green on the
> next CI push and triage any remaining flakes only.

## Fixes applied (post-#2164)

| #2164 failure | Root cause | Fix |
|---------------|------------|-----|
| Api.Tests integration shard 3/6 (75-min blame-hang) | Unbounded `AlertLifecycleWebAppFactory` **host start** on Ask tests (`factory.Services` / `CreateClient()` before bounded start) | `AlertLifecycleIntegrationHost.EnsureStartedAsync` shared helper; migrated `AskThreadIntegrationTests`, `ArchitectureFindingAskControllerIntegrationTests`, and `RetrievalQuerySmokeIntegrationTests` |
| Operator UI: lint / build / Vitest / Playwright / axe / Docker smoke | Missing import: `AuditBuyerHeaderMetrics` used in `AuditPageView.tsx` without import | Added `import { AuditBuyerHeaderMetrics } from "./AuditBuyerHeaderMetrics"` |
| Operator UI: unit (Vitest) — `GlobalSearchBar.test.tsx` | Stale placeholder assertion after UX copy change | Updated test to `"Search or jump to…"` (matches `GlobalSearchBar.tsx`) |
| CI: guards pre-corset (text) — `check_doc_links` | Broken relative link in `V1_AUTOMATION_HANDOFF_PACK.md` | Fixed path to quote-to-proof ROI SEND section (now `QUOTE_TO_PROOF_PACKET.md#roi-baseline-send-policy`) |
| (local compile) `FinalizedEvidenceImmutabilityIntegrationTests` | `AgentResult.ResultJson` removed from contract | Use `Claims = [...]` on forged result |

## Acceptance criteria

1. **All 7 jobs that failed on #2164 are green** on the next CI run (or any new failure has a new,
   unrelated root cause documented in a follow-up prompt).
2. Api.Tests integration shards **3/6 and 4/6** finish inside the 75-min blame budget; no hang on
   `AskThreadIntegrationTests` or `ArchitectureFindingAskControllerIntegrationTests`.
3. Operator UI lint, Vitest, Playwright mock, axe, and Docker build smoke pass (Audit page compiles).
4. `python scripts/ci/check_doc_links.py` exits 0.
5. `ArchLucid.Backend.slnf` compile check passes.

## If shard 3/6 still hangs

Download the blame artifact and inspect the mini dump:

```powershell
gh run download <run-id> -n dotnet-trx-full-core-api-integration-shard-2 -D ./_ci-dump
dotnet-dump analyze ./_ci-dump/**/dotnet_*_hangdump.dmp
# clrstack -all  →  find blocking IHostedService in StartAsync
```

If dump shows a specific hosted service blocking **StartAsync** under InMemory (not already disabled
in `BaseIntegrationTestFixture`), fix token propagation or disable for integration hosts per
`.cursor/prompts/fix-ci-run-2164-api-tests-shard3-ask-host-start-hang.md` Step 3.

## Local verification (scoped)

```powershell
# InMemory Ask tests — no SQL
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj -c Release `
    --filter 'FullyQualifiedName~AskThreadIntegrationTests|FullyQualifiedName~ArchitectureFindingAskControllerIntegrationTests'

# UI
cd archlucid-ui
npm run lint
npm run test -- src/components/GlobalSearchBar.test.tsx

# Doc links
python scripts/ci/check_doc_links.py
```

## Reference

- Prior diagnosis: `.cursor/prompts/fix-ci-run-2164-api-tests-shard3-ask-host-start-hang.md`
- Failed run: `27464501457` (#2164)
