<!-- Narration export Copilot follow-ups.
     Origin: GitHub Copilot review on PR #5463
     (cursor/al-polish-narrative-wizard-ask-honesty-4156),
     "Polish: narrative export and wizard recap honesty (first-review)".
     Owner asked for prompts only. Do not implement from this index. -->

# Narration export Copilot prompts (NEC-01–NEC-03)

**Do not implement from this index.** Paste **one** numbered file per session.

These prompts cover Copilot review threads on [PR #5463](https://github.com/joefrancisGA/ArchLucid/pull/5463) that are still open on head `b22cfe41458ba78ac73ce5f410b5f0a7a8e59fed` and that are real defects. Implement on that branch (or on `master` after it merges). Do not reopen the polish batch.

## Agreed — implement

| Prompt | Copilot threads | Defect |
|--------|-----------------|--------|
| [NEC-01](narration-export-copilot-01-null-topology-entries.md) | `4407277730` | A stored topology list of null strings is skipped. An all-null topology section is then labeled as if nothing was recorded. |
| [NEC-02](narration-export-copilot-02-pixel-filename-sentinel.md) | `4407277820`, `4407277849`, `4407277865` | Missing diagram file name is the sentence `"Diagram file name was not stored."`. A file with that exact name is treated as missing. |
| [NEC-03](narration-export-copilot-03-unused-legend-flag.md) | `4407277917` | `allSourcesMissing` is written and never read. The two legend returns already cover the cases. |

NEC-01, NEC-02, and NEC-03 do not share files. They can run in parallel.

## Already fixed on the PR — do not prompt again

| Thread | What Copilot asked | Already on the branch |
|--------|--------------------|------------------------|
| `4407277756` | Stop branching the recap on `systemDisplay.startsWith("System name")` | `3b978c8b6d` uses `formState.touchedFields.systemName === true` |
| `4407277788` | Keep non-empty constraint text when one entry is blank | `4a4678677f` shows the preview and appends “(one constraint entry was stored empty)” |
| `4407277891` | Treat a `boolean[]` dirty field as dirty only when some entry is true | `b22cfe4145` uses `dirty.some(Boolean)`. `constraints` and `requiredCapabilities` are `z.array(z.string())`, so a nested object dirty shape is not in play |

## Rejected — do not “fix”

| Thread | Copilot claim | Why it is wrong |
|--------|---------------|-----------------|
| `4407277700` | Interpolated `FormatStoredStringField(..., "…")` calls in `ArchitectureNarrativeArtifactGenerator.cs` will not compile | Inside a C# interpolation hole, `"…"` is a normal string literal. The same pattern is already on the Security Gap, Compliance Gap, and topology Gap lines. Do not escape those quotes, and do not pull the arguments out only to satisfy this comment. |
