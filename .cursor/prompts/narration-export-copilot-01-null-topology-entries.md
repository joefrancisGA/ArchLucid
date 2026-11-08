# NEC-01 — Null topology list entries stay visible

**Do not implement from the index.** This file is the whole task.

## Goal

`AppendStoredManifestStringList` in `ArchLucid.ArtifactSynthesis/Generators/ReferenceArchitectureMarkdownGenerator.cs` must count a null list entry as written, and must say that entry was not stored. An all-null topology section must not fall through to `- No topology information recorded.`

## Why

Whitespace entries already emit `- {bulletLabel} was stored empty.` and increment `written`. Null entries `continue` without writing. `FormatStoredStringField` in `ArchitectureManifestNarrativeHonestyCopy.cs` already treats null as not stored and whitespace as stored empty. The markdown helper drops the null case.

`topologyLines == 0` then appends `- No topology information recorded.` That line is reached only when every non-null list returns `written == 0`. A topology whose patterns, resources, and gaps are non-empty lists of nulls hits that line even though the lists were stored.

A mixed list is also wrong: the real values render and the null entries disappear.

## Context

- Branch: `cursor/al-polish-narrative-wizard-ask-honesty-4156` (PR #5463), or `master` after that PR merges
- Helper: `AppendStoredManifestStringList` (private, same file)
- Callers: Selected patterns, Resources, Topology gaps under `## Topology`
- List-level copy stays as it is: null list → `notStoredCopy` (`Selected patterns were not stored.` and the resource/gap twins); empty list → `emptyListCopy`
- Tests: `ArchLucid.ArtifactSynthesis.Tests/ReferenceArchitectureMarkdownGeneratorHonestyTests.cs`
- Copilot thread `4407277730`

## What to build

1. In the foreach, when `value is null`, append `- {bulletLabel} was not stored.` and increment `written`. Do not `continue` past it.
2. Leave whitespace and empty-string entries on `- {bulletLabel} was stored empty.`
3. Leave a real value on `- {bulletLabel}: {trimmed}`.
4. Add a generator test with `Topology.SelectedPatterns`, `Resources`, and `Gaps` each set to a list whose only element is null. The artifact must contain `- Pattern was not stored.`, `- Resource was not stored.`, and `- Gap was not stored.`, and must not contain `- No topology information recorded.`
5. Add a generator test with one list that mixes a null entry, a whitespace entry, and a real value (for example `hub-spoke`). All three bullets appear. The other two topology lists can stay empty so their existing empty-list lines still appear.

## Acceptance criteria

- A stored null entry is a bullet, not a silent skip.
- Null and whitespace stay different sentences, matching `FormatStoredStringField`.
- Existing honesty tests in `ReferenceArchitectureMarkdownGeneratorHonestyTests` still pass.

## Constraints

- Do not change `FormatStoredStringField` or the narrative artifact generator.
- Do not retarget the cost-notes loop, security gaps, or compliance gaps in this prompt.
- Do not replace the list-level “were not stored” sentence with the per-entry sentence when the list reference itself is null.
- Do not escape the interpolated quotes Copilot flagged in `ArchitectureNarrativeArtifactGenerator.cs`. Those calls compile.
