> **Scope:** ADR 0093 — Working Career **hard infeasible** requires demonstrable law/citation; uncited hard is demoted or withheld. Extends ADR 0050 / R5. Structural provenance (0082) is not semantic truth (0085).

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0093: False-hard citation on Working Career

- **Status:** Accepted
- **Date:** 2026-09-11
- **Accepted:** 2026-09-12 (owner)
- **Owner decision:** A confident **impossible** without a law, theorem, or invariant contradiction is a career-killing error (R5). Working Career persist/export must fail-close uncited **hard** infeasible. Soft infeasible remains an envelope. No 40th engine. No G-REAL-06.

## Context

**ADR 0050** (feasibility classification) already gates **hard** at emission: `HardInfeasible` requires citations in `FeasibilityVerdictValidator`. **ADR 0078** (career artifact honesty) fail-closes finalize/export for trail, skipped MUST, simulator rehearsal, and decision-grade provenance — but did not add a dedicated Working Career **hard citation** gate on all export paths.

**ADR 0082** (decision-grade provenance) is structural Kind A/B at emission — not semantic truth that a hard infeasible claim is correct. **ADR 0085** (semantic support band) warns on Unchecked at finalize; it does not turn LLM judge default-on and is not a commit gate.

**Livelihood failure:** extraction noise, adversarial hypotheses, and corpus copy let an architect stake a program on a false theorem. UI display demotion exists in places; **Career export** must not persist uncited hard as hard on Working seats.

**Related (not rewritten):** ADR 0050, 0070, 0078, 0082, 0085, 0091 (Career gravity), LP-03/05/06, FC-03, LN-004 (validator wiring).

## Decision

1. **Working Career hard infeasible requires citation** — law, theorem, or invariant contradiction reference (0050 parity) before Career finalize/export presents or persists **hard**.
2. **Uncited hard is demoted or withheld** — display may show soft envelope; export blocks with an honesty reason; Simulator/Rehearsal stays labeled incomplete (CG/LP).
3. **Does not replace 0082** — decision-grade provenance gates remain separate; LN-005+ owns extraction source passage leftovers.
4. **No 40th coverage engine** — honesty is gate + copy + inventories, not a new typed engine.
5. **Host Mode default unchanged** — G-REAL-06 remains owner program; citation gate is product honesty, not live packet proof.

### Quoteable FAQ

| Question | Answer |
| --- | --- |
| **May Working Career export hard infeasible without citation?** | **No.** Demote to soft or withhold on export; LN-004 validator enforces on server paths. |
| **Does this rewrite ADR 0082?** | **No.** Structural provenance stays; 0093 adds feasibility hard citation for Career authority. |
| **Does this turn on LLM semantic judge default-on?** | **No.** ADR 0085 warn-only Unchecked remains; LN-025 records explicit skip. |
| **Does this add a 40th engine?** | **No.** |
| **Does this flip host `AgentExecution:Mode` to Real?** | **No.** G-REAL-06 remains deferred. |

## Trade-offs

**Gains:** Architects cannot seal or export a confident impossible as Career proof without citation. Aligns UI demotion with server export gates. PR review can cite one ADR for false-hard asymmetry on Working Career.

**Sacrifices:** More copy surfaces (hard vs soft, demoted hard) and inventory maintenance. Golden corpus case-65 fusion honesty may need re-record (LN-011). Compare and sponsor PDF must show citation deltas honestly.

**Rejected:** LLM judge default-on; rewriting 0070 demotion predicate; 40th engine; G-REAL-06; merging feasibility into 0082 only without citation check.

## Constraints

- **Do not** change `DeterministicInsightDensityGate` `typed-engine-protected` demotion predicate (LN-035 residual).
- **Do not** add a 40th coverage engine.
- **Do not** flip `AgentExecution:Mode` default from Simulator to Real. No **G-REAL-06**.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records (ADR 0039).
- **Do not** turn LLM semantic judge default-on (LN-025 residual).
- Desktop review workspace tabs stay a full strip (no **More** menu).
- No live presence / finding-comment chat.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- `MUTATION_UNDO_WINDOW_SECONDS = 300` unchanged.
- SQL stays in `ArchLucid.Persistence/Scripts/ArchLucid.sql` — this ADR adds no tables.

## Expected impact

**System:** Working Career export/finalize paths share a quoteable false-hard citation policy. TS `career-artifact-honesty` and C# `CareerArtifactCompletenessValidator` stay aligned via LN-004.

**Security:** False-hard is an authority-borrowing risk — a sealed record claiming impossible without law citation could block programs incorrectly. Fail-close export reduces career harm from adversarial or noisy extraction.

**Operations:** Support triage distinguishes uncited hard (defect) vs soft envelope (expected product path). Runbook LN-039.

**Cost:** No new Azure services; gate is validation logic only.

**Teams:** LN wave owns inventories and ratchets; DX density engines remain separate program (LN-027/035 residuals).
