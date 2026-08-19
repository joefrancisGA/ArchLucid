> **Scope:** Contributor-only field taxonomy for authoritative record types. Not customer-facing glossary content.
>
> **Status:** current
>
> **Audience:** engineers, technical writers, and authorized administrators maintaining buyer-facing labels and API shapes.

# Record-type field taxonomy

These tables define the canonical fields on each authoritative record type. They govern buyer-facing labels, API response shapes, and internal doc descriptions. A field not listed here is implementation-internal until promoted into this table.

**Implementation alignment.** Persisted **`Finding`** payloads are engine-specific (`ArchLucid.Decisioning.Findings.Payloads`). Built-in engines emit **`Category`** values such as Security, Topology, Requirements, Policy, Compliance, and Cost — see **[`FINDING_ENGINE_OUTPUT_REFERENCE.md`](../FINDING_ENGINE_OUTPUT_REFERENCE.md)**. The **Risk area** column below is the normalized buyer/GRC vocabulary; map engine **Category** to **Risk area** in UX and exports where they differ. **Severity** strings may vary by engine until fully normalized; treat the enumerations here as the target buyer-facing set.

## Finding

| Field | Values / type | Notes |
|-------|---------------|-------|
| **Severity** | `Critical` · `High` · `Medium` · `Low` · `Informational` | Set by the decisioning engine; may be overridden by a reviewer with rationale. |
| **Confidence** | `High` · `Medium` · `Low` | Model confidence in the finding. Low confidence findings require explicit reviewer disposition before blocking. |
| **Risk area** | `Security` · `Reliability` · `Cost` · `Compliance` · `Performance` · `Operational` | Primary category; a finding may carry secondary risk areas as tags. |
| **Evidence basis** | Citation references, artifact links, trace IDs | Links the finding to the evidence trail. A finding without evidence basis is advisory only. |
| **Disposition** | `Open` · `Accepted` · `Waived` · `Remediated` · `Deferred` | Owner-set. Waived and deferred dispositions require a rationale field. |
| **Blocking status** | `Blocking` · `Non-blocking` | Determines whether the finding gates governance approval. Set by policy pack; overridable with reviewer authority. |
| **Owner** | Role or team identifier | Accountable party for remediation or monitoring. |
| **Recommended action** | Free text | Specific suggested change. Should reference evidence. |
| **Monitoring cadence** | `One-time` · `Recurring` · `On-change` | When `Recurring` or `On-change`, the finding re-opens on the next review unless remediated or waived. |

## Decision

| Field | Values / type | Notes |
|-------|---------------|-------|
| **Title** | Short label | Summarises the choice made. |
| **Context** | Free text | What constraint, finding, or review prompted this decision. |
| **Chosen option** | Free text | The option selected and why it was preferred. |
| **Alternatives considered** | Free text | Must name at least one alternative to distinguish a decision from a default. |
| **Rationale** | Free text | Evidence-grounded reasoning. Rationale referencing only opinion ("we prefer X") is weaker posture. |
| **Evidence links** | Artifact, finding, or trace references | Links decision to the evidence trail. |
| **Consequences** | Free text | Accepted trade-offs and downstream effects. |
| **Owner** | Role or team identifier | Accountable for monitoring and revisiting. |
| **Review status** | `Open` · `Committed` · `Superseded` | `Superseded` decisions must link to their replacement. |

## Risk

| Field | Values / type | Notes |
|-------|---------------|-------|
| **Risk area** | `Security` · `Reliability` · `Cost` · `Compliance` · `Performance` · `Operational` | Aligns with finding risk areas for cross-reference. |
| **Severity** | `Critical` · `High` · `Medium` · `Low` | Inherent severity before mitigations. |
| **Likelihood** | `High` · `Medium` · `Low` | Estimated probability of the adverse outcome. |
| **Impact** | Free text | Concrete description of what the adverse outcome means for the tenant or platform. |
| **Mitigation** | Free text | Controls or actions that reduce severity or likelihood. |
| **Disposition** | `Open` · `Mitigated` · `Accepted` · `Deferred` | Accepted risks require owner sign-off and a review cadence. |
| **Monitoring cadence** | `Continuous` · `Quarterly` · `On-change` · `None` | Required when disposition is `Accepted`. |
| **Evidence links** | Finding, control, or artifact references | Risks without evidence links are informational only. |

## Control

| Field | Values / type | Notes |
|-------|---------------|-------|
| **Control objective** | Free text | The specific adverse outcome the control prevents or detects. |
| **Control owner** | `Platform` · `Customer` · `Shared` | Platform controls are ArchLucid-operated. Customer controls are operator-obligations. Shared controls have split responsibilities documented in the control body. |
| **Evidence source** | Artifact, audit event, or external attestation | What demonstrates the control is operating. A control without an evidence source is asserted but unverified. |
| **Validation method** | `Automated test` · `Audit log review` · `Manual inspection` · `Third-party attestation` | How the evidence source is checked. |
| **Control status** | `Active` · `Planned` · `Deferred` · `Not applicable` | Planned and deferred controls must carry a target date or milestone. |
| **Related risks** | Risk identifiers | Controls not linked to a risk are orphaned — they consume cost without traceable justification. |

## Related canonical reads

- **UI term mapping:** [`../CONCEPT_VOCABULARY.md#ui-glossary-v1`](../CONCEPT_VOCABULARY.md#ui-glossary-v1) — label-level alignment for public shell copy.
- **Authority and traces:** [`../architecture/README.md`](../../architecture/README.md) · ADR **`0012`**, **`0010`**.
- **Audit event model:** [`AUDIT_EVENT_MODEL.md`](../AUDIT_EVENT_MODEL.md) — canonical audit event fields and immutability rules.
- **Customer glossary:** in-app `/help/glossary` (`archlucid-ui/src/lib/customer-glossary-manifest.ts`).
