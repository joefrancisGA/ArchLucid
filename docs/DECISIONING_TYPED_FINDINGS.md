## Typed findings in ArchiForge.Decisioning

ArchiForge.Decisioning uses a **Finding envelope** with **category-specific typed payloads**. This preserves a stable persisted shape while allowing engines and the decision engine to evolve with strongly typed data.

---

### Finding envelope

`ArchiForge.Decisioning.Models.Finding` includes:

- `FindingType` – rule matching key (e.g. `RequirementFinding`, `TopologyGap`)  
- `Category` – high-level domain grouping (e.g. `Requirement`, `Topology`, `Security`, `Cost`)  
- `Payload` – category/finding-type specific payload object (stored as `object`)  
- `PayloadType` – discriminator (e.g. `RequirementFindingPayload`)  

The rest of the envelope is durable metadata: severity, title/rationale, recommended actions, related graph nodes, and explainability trace.

---

### Typed payloads

Payload models live under:

`ArchiForge.Decisioning/Findings/Payloads/`

Currently included:

- `RequirementFindingPayload`
- `TopologyGapFindingPayload`
- `SecurityControlFindingPayload`
- `CostConstraintFindingPayload`

Engines should set:

- `finding.Category`
- `finding.PayloadType = nameof(ThePayloadType)`
- `finding.Payload = new ThePayloadType { ... }`

---

### Creating findings (recommended)

Use `ArchiForge.Decisioning.Findings.Factories.FindingFactory` for consistent creation:

- `CreateRequirementFinding(...)`
- `CreateTopologyGapFinding(...)`

This ensures the correct `FindingType`, `Category`, `PayloadType`, and payload shape are always emitted.

---

### Rehydrating payloads

Because `Finding.Payload` is stored as `object`, persisted/reloaded findings may deserialize payloads as `JsonElement`.

Use:

`ArchiForge.Decisioning.Findings.Factories.FindingPayloadConverter`

Examples:

- `FindingPayloadConverter.ToRequirementPayload(finding)`
- `FindingPayloadConverter.ToTopologyGapPayload(finding)`
- `FindingPayloadConverter.ToSecurityControlPayload(finding)`
- `FindingPayloadConverter.ToCostConstraintPayload(finding)`

---

### Category-aware finding engines

`IFindingEngine` now declares:

- `EngineType`
- `Category`

The orchestrator enforces:

- If an engine returns a finding with an empty `Category`, it is auto-filled from `engine.Category`.
- If a finding’s category does not match `engine.Category`, the orchestrator throws.

This prevents accidental cross-category emissions and keeps filtering consistent.

---

### Payload validation (optional hardening, enabled)

`IFindingPayloadValidator` validates findings before persistence.

Default implementation:

`FindingPayloadValidator`

Validations include:

- Required fields: `FindingType`, `Category`, `EngineType`
- Consistency: `PayloadType` must not be set when `Payload` is null
- Typed payload checks for known finding types

---

### Decision engine typed extraction

`RuleBasedDecisionEngine` uses typed payload extraction for stronger manifest output:

- `RequirementFinding` (require): builds a `ResolvedArchitectureDecision` using payload `RequirementName` / `RequirementText` when present.
- `TopologyGap` (allow): emits warnings using payload `Description` when present.
- `SecurityControlFinding` (allow): treats `Status=missing` as warning; otherwise records an assumption.
- `CostConstraintFinding` (allow): emits a formatted warning including budget/risk/max cost when present.

---

### Persistence note (dev / in-memory)

`InMemoryFindingsSnapshotRepository` stores snapshots as JSON strings and rehydrates them on read. This simulates durable storage and ensures payloads round-trip through JSON (including `JsonElement` cases), so the converter paths are exercised early.

