# SecureNow constrained AI path explanation (SA-17)

Optional LLM (or simulator template) that **summarizes a cited PathId** without minting topology, snapshot rows, ExactMatch, or ObservedFact.

## API

`POST /v1/operational-security/paths/{pathId}/explanations`

Request body:

| Field | Default | Behavior |
|-------|---------|----------|
| `useSimulator` | `false` | When `true`, deterministic template + `SIMULATOR` label (no live LLM) |
| `allowInsufficientEvidence` | `false` | When `false`, skip generation for `InsufficientEvidence` paths |

Response: `SecurityEvidencePathExplanationResultResponse` with executive summary, business-impact **hypotheses** (AiInference prose), proposed remediation (SA-14 field shape), cited evidence refs, provenance kind, simulator label.

## Persistence

`dbo.SecurityEvidencePathExplanations` (migration **386**):

- Executive summary + hypotheses JSON + proposed remediation JSON
- `CitedEvidenceRefsJson` — subset of hop `EvidenceReference` values plus `path:{pathId}`
- `ProvenanceKind` — `DeterministicInference` (simulator) or `AiInference` (LLM)
- Does **not** mutate hop rows or path headers

## Validation loop

1. Load path + hops + cut points from deterministic stores (SA-04).
2. Build allow-list of evidence refs and ARM ids present on hops.
3. Simulator: template only; LLM: `IPromptRedactor` then `IAgentCompletionClient`.
4. Reject LLM output that cites evidence outside the allow-list or introduces ARM ids not on the path.
5. Persist validated explanation as AiInference (or DeterministicInference for simulator).

## Real-mode defaults

There is **no** separate host JSON toggle for path explanations. Behavior matches IE-08 diff narratives and IE-22 Ask:

- Host `AgentExecution:Mode` defaults to **Simulator** (no live AOAI unless Real mode + registered live client).
- Live LLM requires `useSimulator: false` on the request **and** Real agent execution mode.

Structured path GET (`/paths/{pathId}`) remains authoritative; explanations are interpretive artifacts only.

## Modules

- `SecurityEvidencePathExplanationService`
- `SecurityEvidencePathExplanationBuilder`
- `SecurityEvidencePathExplanationValidator`
- `SqlSecurityEvidencePathExplanationRepository`

## Depends on

- **SA-04** path inspector load path
- **SA-10** cut points for proposed remediation seed
- **SA-14** remediation field shape (recommended change, verification queries)
