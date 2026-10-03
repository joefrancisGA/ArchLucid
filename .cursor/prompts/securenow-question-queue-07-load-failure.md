# SN-QQ-07 — Show why the question queue failed to load

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement SN-QQ-04, SN-QQ-05, or SN-QQ-06 in this session. Do not rebuild the hero or the drawer.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_QUESTION_QUEUE_LUNA_PROMPTS.md`

**Depends on:** SN-QQ-03 is already mounted on the diagrams workbench.

## Goal

Selecting a snapshot on Diagrams loads the question queue, or the page shows the API's own reason. The page stops saying "Could not load SecureNow questions." together with "The governance change did not save."

## Why

On subscription `Hmd_HI_HAP_Non_Prod`, snapshot `Hmd_HI_HAP_Non_Prod · 9/29/2026, 13:33 UTC` (`54898635-cee6-4aa6-84de-db2bf10f1d37`), Diagram type is still "Select Type". The snapshot dropdown already listed that capture. Above the form, a pink banner says "Could not load SecureNow questions." Under it the page says the governance change did not save, that prior approvals and findings are unchanged, and that the reader should fix required fields and submit again.

Nobody submitted an answer. `DiagramsWorkbenchClient` mounts `SecureNowQuestionQueue` as soon as `selectedSnapshotId` is set. `loadQuestions` runs `Promise.all` of `listSecureNowQuestions` and `listOperatorInferredConnections`.

`proxyJsonGet` throws `ApiLoadFailureState`, a plain object, not an `Error`. The catch keeps `error.message` only when the thrown value is an `Error`. Every proxy failure is rewritten to "Could not load SecureNow questions." The API message, HTTP status, and correlation id are dropped. The banner then passes `recoveryScenario="governance-mutation"`, which is `GOVERNANCE_MUTATION_RECOVERY`.

A 200 with an empty list does not show this banner. `ListQuestionsAsync` returns an empty list when the snapshot has no subscription id. `ListBySnapshotAsync` on operator-inferred connections returns an empty list when the snapshot header is missing. This banner is a non-OK response or a failed fetch on one of those two GETs.

The questions list always queries `dbo.SecureNowQuestionDispositions` (migration `405_SecureNowQuestionDispositions.sql`) and does not catch a database error. The snapshot dropdown uses a different endpoint that already succeeded, with the same Standard tier and `ReadAuthority`. This page is past that gate.

## Read first

- `archlucid-ui/src/components/infra-evidence/SecureNowQuestionQueue.tsx` (`loadQuestions`, the catch, `OperatorMutationInlineError`)
- `archlucid-ui/src/components/infra-evidence/SecureNowQuestionQueue.test.tsx`
- `archlucid-ui/src/lib/infra-evidence/securenow-question-queue-api.ts`
- `archlucid-ui/src/lib/infra-evidence/operator-inferred-connection-api.ts` (`listOperatorInferredConnections`)
- `archlucid-ui/src/lib/infra-evidence/operator-inferred-connection-panel-error.ts`
- `archlucid-ui/src/lib/proxy-json-client.ts`
- `archlucid-ui/src/lib/api-load-failure.ts`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` (the queue mount)
- `ArchLucid.Api/Controllers/InfraEvidence/InfraEvidenceSecureNowQuestionsController.cs`
- `ArchLucid.Application/InfraEvidence/SecureNowQuestionDispositions/SecureNowQuestionDispositionService.cs` (`ListQuestionsAsync`)
- `ArchLucid.Persistence/InfraEvidence/SqlSecureNowQuestionDispositionRepository.cs`
- `ArchLucid.Persistence/Migrations/405_SecureNowQuestionDispositions.sql`

## What to build

Map both load rejections with `operatorInferredConnectionPanelErrorFromUnknown` and kind `load`. The pink line is that mapper's message. The recovery scenario is `operatorInferredConnectionPanelErrorRecoveryScenario("load")`, which is `api-problem`.

Answer, ignore, and reopen failures stay kind `mutation` and keep `governance-mutation`.

An empty open list still renders no hero and no banner.

Leave the disposition query in place. Do not catch a failed GET and replace it with an empty question list. Do not add a try/catch in `ListQuestionsAsync` or the SQL repository that returns `[]` when `dbo.SecureNowQuestionDispositions` is missing. This session does not apply migration 405 to a customer database.

If a test shows a code defect that turns a snapshot the diagrams page can already read into a 500 while migration 405 is applied, fix that defect. Keep the exception message on the API problem response. `SecureNowQuestionCompiler.Compile` does not throw today; do not wrap it in a swallow.

`listOperatorInferredConnections` must accept the list endpoint's JSON array. When a 200 body is not an array, map that to the load failure message. Do not let `raw.map is not a function` escape the banner.

## Tests

1. A rejected `listSecureNowQuestions` whose thrown value is an `ApiLoadFailureState` with message `Invalid object name 'dbo.SecureNowQuestionDispositions'.` renders that message. It does not render "Could not load SecureNow questions." It does not render "The governance change did not save."
2. A rejected answer call still uses the governance-mutation recovery.
3. Both calls resolving to empty arrays render no banner and no hero.
4. With the disposition table present, `ListQuestionsAsync` for a snapshot the repository can read returns a list and does not throw.

Use `SecureNowQuestionQueue.test.tsx` and the existing disposition service tests. Do not require the `ArchitectureDiagramViewer` zoom suite to pass. That suite fails for unrelated camera reasons in jsdom.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- From `archlucid-ui`, run the focused vitest file you changed, then `npx tsc --noEmit -p tsconfig.json` if you changed TypeScript.
- If you change the .NET service, compile once with `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'` and run the disposition tests only.
- Do not commit.
- Do not write to customer Azure.
- Do not hide a diagrams tab behind More.
- Do not re-run SN-QQ-01 through SN-QQ-06 as greenfield.

## Done when

With that snapshot selected and no diagram type chosen, Diagrams either shows the question hero or shows the API's own failure sentence under the `api-problem` recovery. It does not show "Could not load SecureNow questions." together with "The governance change did not save."
