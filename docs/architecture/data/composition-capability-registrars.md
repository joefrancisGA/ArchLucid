# Composition capability registrars (OP-05)

Four omit-able facades on `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions`. `AddArchLucidApplicationServices` still invokes all four on the current host.

| Capability | Facade | Registrar file | Notes |
|------------|--------|----------------|-------|
| **platform** | `AddPlatformCapability` | `PlatformCapabilityCompositionRegistrar.cs` | Tenancy, billing, feature management, storage, SCIM, ITSM outbound, integration events/outbox, alerts, hosted ops jobs, demo seed, persistence polyglot |
| **authority** | `AddAuthorityCapability` | `AuthorityCapabilityCompositionRegistrar.cs` | Pipeline, coordinator artifacts, agents, retrieval, run orchestration outboxes, architecture intelligence, draft intake |
| **infra-evidence** | `AddInfraEvidenceCapability` | `InfraEvidenceCapabilityCompositionRegistrar.cs` | `InfraEvidenceCompositionModule`, bulk evidence upload, cloud extractor auto-pull |
| **governance** | `AddGovernanceCapability` | `GovernanceCapabilityCompositionRegistrar.cs` | `RegisterGovernance`, decisioning engines, compliance drift escalation, waiver expiry, incremental re-review on evidence |

Registrar files live under `ArchLucid.Host.Composition/Startup/Capabilities/`.

## Ambiguous registrations (owner notes)

| Registration | Assigned capability | Rationale |
|--------------|---------------------|-----------|
| `AlertsCompositionModule` | platform | Cross-cutting operational alerting; not governance workflow |
| `IAgentExecutionReadinessGuard` / workspace AI probes | platform | Tenant integration and connectivity diagnostics |
| `DataArchivalOptions` + `RegisterDataArchivalHostedService` | platform | Catalog retention ops, not governance approval workflow |
| `FindingVerificationOptions` | governance | Finding verification policy tied to review/governance plane |
| `TimeProvider.System` | cross-cutting (root) | Shared clock; stays in `AddArchLucidApplicationServices` before facades |
