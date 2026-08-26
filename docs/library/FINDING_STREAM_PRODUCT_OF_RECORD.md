> **Scope:** Engineering design note — which finding stream is authoritative for V1 buyer surfaces. Not buyer-facing copy.

# Finding stream product of record (V1)

**Audience:** Engineers changing exports, finalize gates, ITSM handoff, sponsor ROI, or agent emission.

**Status:** Active — implements assessment §8.10 / §20 founder routing for WK-09.

---

## Two streams

| Stream | Written by | Sealed when |
|--------|------------|-------------|
| **Typed / deterministic** (`FindingsSnapshot`) | `FindingsOrchestrator` + built-in `IFindingEngine` implementations | Authority pipeline seals snapshot (`FindingsSnapshotSealed` audit); finalize gate reads this stream |
| **Agent** (`AgentResult.Findings` on coordinator results) | Agent runtime / simulator path | Emission gated by `AgentArchitectureFindingEmissionGate` (requires `PolicyRuleId` + evidence refs when enabled); **not** the finalize gate's primary input |

Both can appear on run detail. They are **not** interchangeable.

---

## V1 product of record

Use **sealed `FindingsSnapshot`** as the record for:

- Pre-finalize checklist and blocking violations
- Sponsor ROI / savings attribution tied to sealed findings
- ITSM `FindingId` references that must match audit
- Golden corpus regression (`GoldenCorpusHarness` / `expected-findings.json`)
- Governance queue rows sourced from sealed snapshots

Treat **agent findings** as **advisory rehearsal prose** unless:

- Host `AgentExecution:Mode` is **Real**, and
- `EnableLlmJudge` / emission gate policy allows the finding on the wire, and
- UI/export labels the section as agent-sourced (see WK-10 / WK-19).

**Default host posture:** `Simulator` in `ArchLucid.Api/appsettings.json`. Simulator output is rule-based / canned — never imply live-model inference on buyer exports.

---

## UI and export claim boundary

- Never present agent-stream findings as the sole "what ArchLucid found" list without also showing sealed deterministic findings.
- Simulator tenants must see `SIMULATOR_MODE_*` rehearsal language on paths that include agent findings (top bar chip + operation notices + export headings).
- Dual counts in sponsor packs must label sections per WK-19 (`Deterministic findings (sealed)` vs `Agent findings (advisory)`).

---

## Open founder decision (not decided here)

Whether **insight-density scores** should ever demote typed-engine findings — see **ID-11** / `typed-engine-protected` in `DeterministicInsightDensityGate`. This note does **not** change gate behavior.

---

## Related

- [`AGENT_OUTPUT_EVALUATION.md`](AGENT_OUTPUT_EVALUATION.md)
- [`ARCHITECTURE_INVARIANTS_ONE_PAGE.md`](ARCHITECTURE_INVARIANTS_ONE_PAGE.md)
- [`WEAKNESS_REMEDIATION_COMPOSER_PROMPTS.md`](../architecture/WEAKNESS_REMEDIATION_COMPOSER_PROMPTS.md) WK-10, WK-19
