# SN-CE-03 — Grounded ranked-path answer

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-CE prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_CUTTING_EDGE_COMPOSER_PROMPTS.md`

## Goal

A `RankedPath` completion may quote the stored bundle. It may not invent a citation, a new composite sort, or a numeric likelihood. The simulator stays the existing deterministic template.

## Why

SN-CE-02 puts the stored rows in the bundle. `TryParseLlmResponse` currently drops citation ids that are missing from the bundle and still returns true. For this topic, an off-list citation has to fail the completion. The other eight topics keep the current drop-unknown behavior.

## Read first

- `ArchLucid.Application/InfraEvidence/Ask/InfraEvidenceAskPromptBuilder.cs` (`SystemPrompt`, `BuildUserPrompt`, `BuildSimulatorAnswer`, `TryParseLlmResponse`)
- `ArchLucid.Application/InfraEvidence/InfraEvidenceAskGroundingService.cs` (simulator branch and the parse-failure result)
- `ArchLucid.Application.Tests/InfraEvidence/InfraEvidenceAskPromptBuilderTests.cs`
- `ArchLucid.Application.Tests/InfraEvidence/InfraEvidenceAskGroundingServiceTests.cs`
- `ArchLucid.Application/InfraEvidence/Ask/InfraEvidenceAskEvidenceBundle.cs` (`TopicKind` is already on the bundle)

## What to build

1. Branch `sn-ce/03-grounded-answer` from current `master` after SN-CE-01 and SN-CE-02 are present.
2. Add a `RankedPath` clause. Append it from `BuildUserPrompt` when `topicKind` is `RankedPath`, and from the system prompt the grounding service sends for that topic. Keep `BuildSystemPrompt()` unchanged for the other topics. Add an overload `BuildSystemPrompt(string topicKind)` and call it from `InfraEvidenceAskGroundingService`.
3. The clause contains these sentences, character for character, each ending with a period:
   - `Do not return a new composite sort.`
   - `Do not return a numeric likelihood or probability.`
4. The clause also tells the model to use only the provided evidence lines and to choose `citationIds` from `allowedCitationIds`. Those two rules already exist in `SystemPrompt`. Repeat them in the clause so a `RankedPath` user prompt carries them even when the system prompt overload is missed.
5. Leave the JSON object as `answer`, `citationIds`, and optional `viewPlan`. Do not add `probability`, `likelihood`, or `sortScore` fields.
6. In `TryParseLlmResponse`, when `bundle.TopicKind` is `RankedPath`:
   - Return false when `CitationIds` is null or empty.
   - Return false when any citation id is absent from the bundle allow-list.
   - When a `viewPlan` is present, set `viewPlan` to null and still accept the answer if the citations pass.
7. For every other topic, keep skipping unknown citation ids.
8. Do not add a second simulator method. `BuildSimulatorAnswer` is the `RankedPath` simulator. The grounding service already sets `SimulatorLabel` from `InfraEvidenceAskPromptBuilder.SimulatorLabel`.

## Tests

- Prompt builder: a `RankedPath` user prompt contains both refusal sentences. A `ResourceOverview` user prompt does not contain `Do not return a numeric likelihood or probability.`
- `TryParseLlmResponse` on a `RankedPath` bundle returns false for `{"answer":"because","citationIds":["SecurityEvidencePathId:not-in-bundle"]}`.
- The same unknown id on a `ResourceOverview` bundle still returns true and drops that id, matching current behavior.
- `TryParseLlmResponse` on a `RankedPath` bundle returns false for an answer with `"citationIds":[]`.
- Grounding with `UseSimulator` true and a one-citation `RankedPath` bundle returns `TopicKind` `RankedPath`, `SimulatorLabel` equal to `InfraEvidenceAskPromptBuilder.SimulatorLabel`, and an answer that contains that citation key.
- Grounding with a `RankedPath` bundle that has no citations returns `InsufficientEvidence` true and the existing insufficient-evidence sentence. The answer contains no invented ARM id.

`dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter FullyQualifiedName~InfraEvidenceAsk`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not recompute `CompositeSortScore`. The evidence line from SN-CE-02 may quote the stored value.
- Do not change `IPromptRedactor` or add a second redaction pass.
- Do not change `PathRankingEngine`.
- Do not commit.

## Done when

A recorded `RankedPath` completion that cites an id outside the bundle is rejected, and the simulator answer cites only bundle rows.
