# PP-03 — Prompt-cache prefix ratchet

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement PP-01 or PP-02 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Performance residual (**PP**). **Depends on:** none. Shipped prefix ordering is **TB-681**. Shipped telemetry is **TB-2159**. Do not reorder prompts that already match the contract.

## Goal

A unit test fails if a user-prompt composer places a run id, tenant id, correlation id, or timestamp before its static prefix.

## Why

Azure OpenAI automatic prompt caching discounts a stable input prefix. `docs/library/AZURE_OPENAI_PROMPT_CACHE_PREFIX.md` forbids volatile values before the run header. `AgentUserPromptPrefixOrderingTests` locks the quad-agent composer. Ask has a prefix-index test. A later composer can regress the discount without failing CI.

## Read first

- `docs/library/AZURE_OPENAI_PROMPT_CACHE_PREFIX.md`
- `ArchLucid.AgentRuntime/Prompts/AgentUserPromptComposer.cs`
- `ArchLucid.AgentRuntime/Prompts/AgentUserPromptStaticPrefix.cs`
- `ArchLucid.AgentRuntime.Tests/AgentUserPromptPrefixOrderingTests.cs`
- `ArchLucid.Host.Core/Services/Ask/AskUserPromptComposer.cs`
- `ArchLucid.Host.Core/Services/Ask/AskUserPromptStaticPrefix.cs`
- `ArchLucid.Host.Core.Tests/Ask/AskUserPromptComposerCustomerContentTests.cs`

## What to build

1. Branch `pp/03-prompt-cache-prefix-ratchet` from current `master`.
2. Read the tests above. Search for other `*UserPromptComposer` types.
3. If every composer already has a test that the static prefix bytes are identical across two different run ids, and that a run id cannot appear before that prefix, **stop**. Report the test names. Do not add a duplicate.
4. Otherwise add the missing test only.
   - Build two prompts that differ only by run id (and, when the API allows, tenant id).
   - Assert the static prefix is a prefix of both strings and the two prefixes are equal byte for byte.
   - Assert the run id’s first index is greater than the prefix length.
   - Do not assert on evidence text, retrieval hits, or model output.
5. Do not change composer code unless a test you added fails because volatile data is already in front of the prefix. In that case, move only that volatile interpolation to after the static prefix. Do not change agent instructions, tool lists, or evidence delimiters.

## Acceptance criteria

- The new or existing test fails if a run id is inserted at index 0.
- No production prompt text changes when the current order already matches the contract.
- `archlucid_llm_prompt_cache_hit_ratio` is not given a new label. Do not add a buyer-facing cost claim.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not enable `StagedCriticOverlapEnabled`. Do not change `EscalateTierOnRetry`. Do not change 429 retry counts.
- Working-tree safety. Stage only this prompt’s paths. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj --filter FullyQualifiedName~AgentUserPromptPrefixOrderingTests
dotnet test ArchLucid.Host.Core.Tests/ArchLucid.Host.Core.Tests.csproj --filter FullyQualifiedName~AskUserPromptComposer
```

If you added a test in another project, run that filter too. One scoped compile via `.\scripts\ci\agent-compile-check.ps1 -ProjectPath` for the project you edited, plus one retry if it exits 1. Heartbeat every 8s on the compile.

## Done when

Tests pass, or you stopped because the lock already exists. Name the test that proves the prefix is stable. Wait for the owner before any commit.
