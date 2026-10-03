# SN-QQ-05 — Pack questions join the same queue, including questions with no node

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement SN-QQ-06 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_QUESTION_QUEUE_LUNA_PROMPTS.md`

**Depends on:** SN-QQ-02. The list compiler and the disposition identity already exist. The drawer from SN-QQ-03 should display a row with no resource id. If that drawer is not on the branch yet, still return the rows from the API.

## Goal

A question required by an assigned policy pack appears in the same subscription queue. It does not need a diagram node. The UHG session-host rule stays pack content.

## Why

NR-16 paints a yellow card when an assigned pack marks a resource questionable, and the click panel explains it. That panel does not collect an answer. Other pack questions are `elicitationQuestions` on the pack and may be about the subscription or a resource group, so an outline column cannot reach them.

## Read first

- `templates/policy-packs/uhg/uhg-unregistered-avd-session-host.pack.json`
- `ArchLucid.ArtifactSynthesis/Compilers/InventoryDiagramQuestionableAttentionResolver.cs`
- `ElicitationQuestion` in the OpenAPI contracts (`questionKey`, `prompt`, `tier`, `answerKind`)
- `.cursor/prompts/node-relationship-16-questionable-card.md`
- The SN-QQ-02 compiler

## What to build

Extend the SN-QQ-02 compiler. Do not add a second list endpoint.

1. **Questionable card.** When a diagram node has questionable attention from an assigned pack rule, emit one question for that resource. Question key is the pack rule key plus `@v1` when the rule key has no version. The UHG rule key is `uhg-avd-vm-not-in-host-pool`. Prompt: `Is this virtual machine still a session host that should be registered?` Answer codes: `Register`, `Retire`, `NotASessionHost`. Source line: `Policy pack`. The yellow card and `infra-diagrams-questionable-panel` stay. This session does not clear the yellow fill.
2. **Elicitation.** For each assigned pack, emit each `elicitationQuestions` entry whose tier is `Must`. Scope is `Subscription` unless the question names a resource group, in which case scope is `ResourceGroup` and the resource id field stays empty. Question key is the pack question key plus `@v1` when needed. Source line: `Policy pack`. A `Should` question is not emitted.
3. Dedupe with the existing identity. A pack question and a broken-link question on the same resource remain two rows when the question keys differ.
4. Order pack questions ahead of inferred proposals and broken-link intent.

Do not add a name-prefix rule to `InventoryDiagramAvdScopeResolver`. Do not copy the UHG predicate into shared diagram code. If the pack is not assigned, these rows are absent.

The hero count from SN-QQ-03 includes these rows once that hero exists. A pack question with no node has no outline button.

## Tests

1. The UHG pack assigned, and one virtual machine with questionable attention for `uhg-avd-vm-not-in-host-pool`, produces one queue row and the card is still questionable.
2. The same virtual machine with the pack unassigned produces no pack question.
3. A `Must` elicitation question with no resource id is in the list. Scope kind is `Subscription`.
4. A `Should` elicitation question is absent.
5. The same pack question on Full subscription and Network is one row.
6. A general diagram compile with no pack assigned does not contain `uhg-avd-vm-not-in-host-pool`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run the questionable-attention tests and the question-compiler tests.
- Do not commit.
- Do not write to customer Azure.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

Assigned-pack questions, with or without a node, are rows in the existing queue, and the UHG name rule remains inside the UHG pack.
