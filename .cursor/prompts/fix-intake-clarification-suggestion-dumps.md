# Composer prompt — Stop intake clarification suggestions from pasting document dumps

Paste this entire file into a **Composer 2.5** (`composer-2.5`) agent chat. Implement the fix. Do **not** only analyze.

**Model:** `composer-2.5` (slow). Do not switch to a fast-tier or non-allowlisted model.

**Branch:** create `cursor/fix-intake-clarification-suggestion-dumps-ab4f` from current `master` (or continue on the branch the owner names). Do not commit to `master`.

---

## Problem (buyer-visible)

On **Start review** (`/architecture/reviews/new` quick start), **Suggest answers from evidence** filled Required clarification 1 of 8 with flattened handbook text instead of a human answer.

**Question (`l0.actor.additional-kinds`):**

> Are there other kinds of users (human or machine) that interact with this system besides those already identified?

**What the operator saw (must never be prefills again):**

```text
Actors Actor How they touch the system Operators / architects Browser — Architect workspace (Next.js) Sponsors / evaluators Same UI; sponsor-oriented views and packages CLI / CI automation HTTPS — API (API key or JWT), optionally via Front Door / APIM Diagram — system overview ArchLucid system overview Diagram —
```

**Source:** attached `ARCHITECTURE_HANDBOOK.*.docx` (actors table + figure captions). Architecture Context was empty. Tenant chrome showed **REAL**.

**What a human answer looks like (grounded in that table, no invented facts):**

```text
Yes. Operators and architects use the Architect workspace in the browser (Next.js). Sponsors and evaluators use the same UI for sponsor-oriented views and packages. CLI and CI automation call the API over HTTPS (API key or JWT), optionally via Front Door / APIM.
```

Empty is acceptable. A document dump is not.

---

## Root cause (already diagnosed — do not re-litigate)

This is **not** a model hallucination. It is extract → flatten → keyword-match → silent fallback.

1. `DocxDocumentTextExtractor` walks every Word paragraph, including table cells and caption paragraphs, and joins them with newlines (`ArchLucid.Application/Documents/DocxDocumentTextExtractor.cs`).
2. `normalizeClarificationInferenceCorpus` then **collapses all whitespace to single spaces** (`archlucid-ui/src/lib/inferred-clarification-answer-quality.ts`). Table structure dies.
3. `splitSentences` only splits on `.!?` (`archlucid-ui/src/lib/universal-intake-answer-inference.ts`). Em-dash captions and table cells have no periods, so the actors table **plus** `Diagram — …` become one “sentence.”
4. `inferAdditionalActorsAnswer` returns the **first 320-character** chunk matching `\boperators\b`. That is exactly the dump (word-boundary clip on `Diagram —`). The LLM rephrase cap is 480 characters — this clip is the extractor.
5. `isReadableInferredClarificationAnswer` only rejects empty, trailing `...`, mojibake, control chars, and low letter ratio. The dump passes.
6. Rephrase (`ClarificationAnswerRephraseService` + `POST /v1/architecture/request/draft/clarification-answers/rephrase`) is advisory. Empty JSON, parse failure, or any exception **returns the extracted snippet**. The UI `catch` does the same.
7. Simulator `FakeAgentCompletionResolver` has stubs for overview rewrite and draft intake reasoning. **Clarification rephrase has no routing marker.** Simulator (and Echo “Real”) `CompleteJsonAsync` returns topology `AgentResult` JSON, not `{ "answers": [...] }`. Rephrase treats that as a miss and keeps the dump.
8. Helper `UNIVERSAL_INTAKE_CLARIFICATION_SUGGESTIONS_REQUIRE_REAL_LLM_HELPER` is **defined and never rendered**. `UNIVERSAL_INTAKE_INFERRED_CLARIFICATION_HELPER` claims “rewritten in plain language” whenever a suggestion was applied, including fallback dumps.

`blocksLlmRephrase` is only the monthly budget gate (`useLlmMonthlyBudgetExecutionGate`), not Simulator mode. Simulator still calls rephrase and then falls back.

---

## Goal

When the operator clicks **Suggest answers from evidence** (or auto-inference runs after a PDF/DOCX attach):

- Prefill only answers a human would recognize as answering the question (1–3 sentences, yes/no first when the prompt is yes/no).
- Prefer a **deterministic synthesis** from structured document lines over pasting the first keyword hit.
- If synthesis and rephrase both fail the quality gate, **leave the field empty** and keep the existing “we could not suggest…” helper. Never paste table headers or figure captions.
- Simulator must return `{ answers: [...] }` shaped JSON for rephrase, same pattern as overview rewrite.

---

## Constraints

- Do **not** change the eight L0 MUST question keys or prompts.
- Do **not** invent actors, systems, SLAs, or regulations that are not in the corpus.
- Do **not** rewrite the whole DOCX/PDF extractor. Optional table-cell separators are OK if cheap; the UI corpus + inference changes must be sufficient even if the extractor still emits one paragraph per cell.
- Do **not** add GTM / assessment items #2, #3, #5, #6, #23, #25.
- Do **not** add a `TECH_BACKLOG.md` row unless you find an existing open row that already tracks this.
- New C# types: **one class per file**. Blank line before `if` / `foreach` unless it is the first line of the method. Prefer LINQ. Prefer concrete types over `var`. Null-check arguments. Comment anything a two-year developer may not understand. No `ConfigureAwait(false)` in tests.
- UI: Carbon/Fluent enterprise tokens; no new toast for this client-known empty-suggestion case.
- Reuse existing helpers. Do not add libraries.

---

## Implement in this order

### 1. Keep document structure in the inference corpus

**File:** `archlucid-ui/src/lib/inferred-clarification-answer-quality.ts`

Change `normalizeClarificationInferenceCorpus` so it:

- repairs mojibake as today
- trims each line and collapses **horizontal** whitespace only
- **keeps newlines**
- drops empty lines

Do **not** `replace(/\s+/g, " ")` on the whole corpus.

Update any test that assumed a single-line corpus still passes for prose briefs (they should — prose without newlines is unchanged).

### 2. Split inference chunks on newlines, not only `.!?`

**File:** `archlucid-ui/src/lib/universal-intake-answer-inference.ts`

`splitSentences` (or a renamed `splitInferenceChunks`) must split on:

- `(?<=[.!?])\s+` as today
- newlines

Then `findSentenceMatching` will hit `Operators / architects` instead of a 320-character flattened table.

Apply the same newline-aware split if `architecture-intelligence-framing-suggest.ts` copies this helper and is used for the same buyer path. Do not drive-by refactor unused copies.

### 3. Synthesize the additional-actors answer

Replace `inferAdditionalActorsAnswer` so it does **not** return the first matching blob.

Algorithm (keep it small and modular — one-line helpers are fine):

1. Walk inference chunks / lines in order.
2. Skip header-only lines (case-insensitive exact or near-exact): `Actors`, `Actor`, `How they touch the system`, and lines that are only those words concatenated.
3. Skip figure/caption leftovers: chunks matching `/^Diagram\b/i` or containing `Diagram —` / `Diagram -`.
4. A **role chunk** matches the existing actor regex (`operators`, `API clients`, `service accounts`, `administrators`, `CLI`, `CI`, `sponsors`, `evaluators`, `machine users`, `partner teams`, `batch jobs`, `integrations`, etc.). Expand the regex only with terms that already appear in the handbook-style fixture — do not guess new actor types.
5. If the next chunk looks like a channel / touchpoint (`Browser`, `HTTPS`, `API`, `UI`, `workspace`, `JWT`, arrows), pair it with the role. Example pairing:
   - `Operators / architects` + `Browser — Architect workspace (Next.js)`
   - `Sponsors / evaluators` + `Same UI; sponsor-oriented views and packages`
   - `CLI / CI automation` + `HTTPS — API (API key or JWT), optionally via Front Door / APIM`
6. Build **one yes/no sentence first**, then up to two more sentences. Use only words from the paired chunks. Example shape:

   `Yes. {role} use {touch}. {role} use {touch}.`

   If the corpus clearly states there are no other actors, answer `No.` plus the supporting clause. If you cannot tell, return `null` (do not prefill).
7. Cap ~320–480 characters on a word boundary. Do not end on `—` or `→`.

If pairing fails but a **single prose sentence** already answers the question (today’s `SAMPLE_BRIEF`: “Partner integrations and service accounts also call the API.”), keep current behavior: return that sentence. Existing test `infers multiple L0 answers from a rich architecture brief` must stay green.

### 4. Harden the buyer-safe quality gate

**File:** `archlucid-ui/src/lib/inferred-clarification-answer-quality.ts`

Keep current rejects. Add rejects for answers that are extraction debris, not operator prose:

- ends with `...`, `—`, `-`, or `→` (after trim)
- contains `Diagram —` / `Diagram -` / a caption-like `Diagram` leftover
- contains concatenated table headers, e.g. `/Actors\s+Actor\s+How they touch/i`
- has no `.?!` **and** does not start with `Yes` / `No` (case-insensitive)
- looks like three or more Title-Case fragments jammed without a finite verb (the screenshot dump)

`isReadableInferredClarificationAnswer` remains the single gate used by:

- `inferUniversalIntakeAnswersFromCorpus` (already)
- `mergeInferredUniversalIntakeAnswers` / apply path (if a rephrase result is merged in, gate it again)
- framing suggest `acceptSuggestedAnswer` if it already calls this helper

The screenshot dump **must** return `false`. The human sample above **must** return `true`. `PCI-DSS scope for cardholder data.` and `Partner integrations and service accounts also call the API.` **must** still return `true`.

### 5. Never fall back to an unreadable extract

**UI:** `archlucid-ui/src/hooks/use-inferred-universal-intake-answers.ts`  
**API merge:** `archlucid-ui/src/lib/api/clarification-answer-rephrase-api.ts`  
**Backend:** `ArchLucid.Application/Planning/ClarificationAnswerRephraseService.cs`

Rules:

- After deterministic inference, drop keys that fail `isReadableInferredClarificationAnswer`.
- After rephrase merge, drop keys that fail the same gate. Do **not** substitute the raw extract when the rephrase is missing or unusable **if the extract also fails the gate**.
- Backend `BuildFallbackAnswers` / `IsUsableRephrase`: do not return fallback text that is a table dump or caption fragment. Mirror the new rejects in C# (small private helpers on the service, or a focused static helper in its own file if it grows). Prefer omitting the key over returning debris.
- UI `catch` on rephrase failure: keep only quality-gated inferred answers, not ungated extracts.

`mergeRephrasedClarificationAnswers` today does `rephrased || inferred`. That is correct only when inferred already passed the gate.

### 6. Wire Simulator / fake completions for rephrase

Mirror overview rewrite:

| Existing pattern | New work |
|---|---|
| `ArchLucid.AgentRuntime/Planning/ArchitectureOverviewRewriteLlmPrompts.cs` (`SimulatorRoutingMarker`) | Add `ClarificationAnswerRephraseLlmPrompts.cs` with a unique marker string |
| `FakeArchitectureOverviewRewriteCompletionJson.cs` | Add `FakeClarificationAnswerRephraseCompletionJson.cs` (own file) |
| `FakeAgentCompletionResolver` branch on marker | Add a branch **before** the topology `AgentResult` fallback |

**Rephrase system prompt** (`ClarificationAnswerRephraseService`): include the new marker (same way `DraftIntakeReasoningService` prepends `DraftIntakeReasoningLlmPrompts.SimulatorRoutingMarker`).

**Fake builder:** parse `questionKey` / `questionPrompt` / `extractedAnswer` from the user prompt (`ClarificationAnswerRephraseService.BuildUserPrompt` format). Return JSON:

```json
{
  "answers": [
    { "questionKey": "l0.actor.additional-kinds", "rephrasedAnswer": "Yes. …" }
  ]
}
```

One item per input question. Rephrased text must:

- use only facts in that item’s `extractedAnswer`
- start with Yes/No when the prompt is a yes/no question
- be 1–3 sentences
- pass `IsUsableRephrase`

If `extractedAnswer` is already a clean sentence, it is OK to return a lightly punctuated version. If `extractedAnswer` is dump-like, return a synthesized Yes/No from the words that are still in the extract **or** omit that key — never echo the dump.

Add unit tests next to `ClarificationAnswerRephraseServiceTests` and a Fake resolver test that the marker does **not** fall through to `"agentType":"Topology"`.

### 7. Honest helper copy

**Files:**

- `archlucid-ui/src/lib/universal-intake-answer-inference.ts`
- `archlucid-ui/src/components/architecture/QuickStartL0MustQuestionsPanel.tsx`
- `archlucid-ui/src/components/draft-intake/DraftIntakeRequiredClarificationField.tsx`
- `archlucid-ui/src/app/(operator)/architecture/reviews/new/use-first-pilot-intake-wizard.ts` (and any other caller of `useInferredUniversalIntakeAnswers`)

Behavior:

- Show `UNIVERSAL_INTAKE_INFERRED_CLARIFICATION_HELPER` (“rewritten in plain language”) **only** when at least one applied suggestion came from a successful rephrase (rephrased text differs from extract **or** extract was already sentence-form and rephrase returned 200 with that key). If only deterministic synthesis was applied, use a shorter honest line, e.g. suggested from your evidence — review before you continue. Do not claim a rewrite that did not happen.
- Render `UNIVERSAL_INTAKE_CLARIFICATION_SUGGESTIONS_REQUIRE_REAL_LLM_HELPER` when `useAgentExecutionMode().isSimulator === true` and the operator can still click suggest. Do not block deterministic synthesis in Simulator — synthesis is the Simulator-safe path. The helper tells them live rewrite needs Real + Azure.
- `clarificationSuggestionsUnavailable` stays for “corpus present, zero quality-gated suggestions.”

Pass `isSimulator` into the hook or the panel; do not invent a second execution-mode reader.

---

## Tests (required)

Add/extend — do not weaken existing assertions.

**Vitest**

- `inferred-clarification-answer-quality` / `universal-intake-answer-inference.test.ts`:
  - screenshot dump → `isReadableInferredClarificationAnswer` is `false`
  - human Yes/No sample → `true`
  - `SAMPLE_BRIEF` actor line still infers `l0.actor.additional-kinds`
  - newline-preserved actors table (headers + three role/touch rows + `Diagram — system overview`) infers a Yes/No answer that:
    - starts with `Yes`
    - mentions operators/architects, sponsors, and CLI/CI **or** API
    - does **not** contain `Actors Actor` or `Diagram —`
  - flattened single-line dump of the same table does **not** become the prefilled answer (either synthesized cleanly or omitted)
- `clarification-answer-rephrase-api.test.ts`: merge does not reinstate a dump when rephrase omits the key
- Panel/hook tests if you change helper visibility: Simulator shows the unused-until-now Real-LLM helper; “rewritten in plain language” is absent when rephrase did not run

**xUnit**

- `ClarificationAnswerRephraseServiceTests`: fallback omits dump-like extracts; usable Yes/No rephrase still accepted; digit-preservation theory stays
- Fake completion: marker returns `{ "answers": [...] }` for a dump extract without topology `AgentResult`
- Optional: `DocumentTextExtractionServiceTests` table fixture if you add cell separators — only if you change the extractor

**Do not** add Playwright unless you already have a stable live-API hook for this control. Unit coverage of the fixture dump is the acceptance bar.

---

## Acceptance

1. Feeding the exact screenshot string (or the equivalent newline-separated table) into `inferUniversalIntakeAnswersFromCorpus` does **not** put that string in `l0.actor.additional-kinds`.
2. The same handbook-shaped table produces a short Yes/No answer a reviewer would accept, or no prefill.
3. Rephrase failure / Simulator fake client cannot resurrect the dump via fallback.
4. Simulator rephrase completions are `{ answers: [...] }`, not topology `AgentResult`.
5. Helper copy does not claim a plain-language rewrite when none occurred.
6. Existing `SAMPLE_BRIEF` inference test and cloud-target enum behavior stay green.
7. New units: high coverage, no `ConfigureAwait(false)` in tests.

Verify:

```text
# UI (from archlucid-ui/)
npx vitest run src/lib/universal-intake-answer-inference.test.ts src/lib/inferred-clarification-answer-quality.ts src/lib/api/clarification-answer-rephrase-api.test.ts

# If you added a dedicated quality test file, include it.

# Backend (from repo root) — scoped, not full sln
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~ClarificationAnswerRephrase"
dotnet test ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj --filter "FullyQualifiedName~FakeAgentCompletion"
```

If those filter names do not match new test class names, filter on the names you created. Do **not** run full-solution `dotnet test` unless scoped tests pass and you still need a compile check. Prefer `.\scripts\ci\agent-compile-check.ps1` with a project path if you need one compile.

---

## Out of scope

- Changing question selection / MUST completeness rules
- PDF layout reconstruction beyond current text extraction
- New LLM providers or prompt-framework refactors
- Auto-saving suggestions without operator review
- GTM cohort / procurement / ITSM pilot work

---

## Implementation notes (Composer)

- Explain briefly before coding: what, why, alternatives (empty field vs synthesis vs LLM-only).
- Start with the quality gate + newline preservation + actor synthesis. That alone stops the screenshot bug. Then fallback + Simulator stub + copy.
- Check working-tree safety before editing tracked files (`scripts/agent/check-working-tree-path.ps1` on Windows).
- Stage only files you changed for this task.
- If you need a non-allowlisted model, stop and ask. Default is Composer 2.5 slow.
