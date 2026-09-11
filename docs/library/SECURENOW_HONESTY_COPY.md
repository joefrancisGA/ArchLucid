# SecureNow honesty copy (SA-21)

Deterministic architect desk copy for SecureNow path inspect and explanation APIs.

## Architect sentence template

API field: `explanationTemplate.architectSentence`

> This configuration creates a path from actor A through identity B and network path C to asset D. The path exists because controls E and F compose poorly. Change G will break the path with minimal operational risk. Verify using H.

Slots map to `explanationTemplate` fields:

| Slot | Field | Source |
|------|-------|--------|
| A | `actor` | First hop `fromNodeLabel` |
| B | `identity` | Identity hops (`UsesIdentity`, `CanAssume`, `HasRole`, `FederatesAs`) |
| C | `network` | First `RoutesTo` / `Exposes` hop (nullable) |
| D | `asset` | Last hop `toNodeLabel` |
| E/F | `weakControl` | `weakestHopReason` or weakest hop edge + band |
| G | `proposedChange` | Primary cut point pattern / edge removal, else weakest-hop reason |
| H | `verify` | Cut-point evidence reference, hop evidence, or snapshot recheck hint |

Missing slots are omitted rather than invented. When `network` is null the sentence reads **through identity B to asset D** (no dangling **and**).

## Capability-to-flow

`PathKind=CapabilityToFlow` uses **may allow … to access …** language and optional **may reach** network phrasing — never observed exfiltration.

## Deny list

Application guard: `SecureNowArchitectHonestyCopyGuard`

UI guard: `securenow-architect-honesty-copy.ts`

Rejected patterns include:

- `%` confidence (e.g. `82%`)
- `exfiltrat*` movement claims
- auditor **compliant** conclusions
- **apply to Azure** imperative copy

## Surfaces

- `GET /v1/operational-security/paths/{pathId}` → `explanationTemplate`
- Remediation factory **Path inspect** panel (`SecurityEvidencePathInspectPanel`)
- Optional help slug: `/help/security-evidence-paths` (Security shell)

Architecture `:3000` review finding copy is unchanged.

## Tests

- `SecurityEvidencePathExplanationTemplateBuilderTests`
- `securenow-architect-honesty-copy.test.ts`
- `SecurityEvidencePathInspectPanel.test.tsx`
