> **Scope:** Contributor-reference — composition-root follow-on cluster **TB-2333**–**TB-2342**. Merge into `TECH_BACKLOG.md` summary table + detail sections when that file is stable. Not a buyer or operator document.

# Composition-root follow-on — TB-2333–TB-2342

**Opened:** 2026-08-17. Owner ask: file composition-root follow-on after in-flight **AgentModelCatalog** + **AOAI** probe moves toward `ArchLucid.Host.Composition`.

**Thesis:** INV-006 and Done dependency-graph work established a single composition root, but Api still owns outbound probe adapters, IdP HTTP diagnostics, hosted extractor registration, Evolution/Learning read services, and a ~900-line `AdminDiagnosticsService` that reaches Persistence directly. This cluster finishes the strangler: guards first, then move probes and diagnostics into Host.Composition, consolidate shared outbound plumbing, relocate Application-layer bootstrappers, and split registrar partials — without reopening the closed NetArchTest matrix or layer leak documentation.

**Do not reopen (closed composition / layer loops):** **TB-027**–**TB-032** (Done dependency-graph / NetArchTest tiers); **TB-1005** / **TB-1006** (layer residual-boundary matrix + honesty CI). Do **not** rewrite `DependencyConstraintTests`, add silent allowlist entries, or publish buyer isolation claims from this cluster. Do **not** duplicate open strengthen-reviews engine work (**TB-2343**–**TB-2352**) or ease-of-use chrome (**TB-2353**–**TB-2362**).

**Ship order:** **TB-2335** (type-absence + DI guard) → **TB-2333** / **TB-2334** (remaining probes + IdP diagnostics) → **TB-2341** (shared outbound probe adapter) → **TB-2336** (`PlatformBundledPolicyPackRegistryBootstrapper` → Core) → **TB-2339** (stop ApiWebLayer extractor/HttpClient registration) → **TB-2337** / **TB-2338** (Evolution/Learning + AdminDiagnostics split) → **TB-2340** (Api→Persistence inventory + strangler slice) → **TB-2342** (registrar domain partials).

| ID | Title | Quality | Pri | Window | Size |
| --- | --- | --- | --- | --- | --- |
| ~~TB-2333~~ | ~~Remaining Api connection probes (Teams, webhook, marketplace) → Host.Composition~~ **Done** 2026-08-17 | Architectural integrity | P2 | V1 | M |
| TB-2334 | IdP HTTP diagnostics (OIDC/SAML/discovery) → Host.Composition | Architectural integrity | P2 | V1 | M |
| ~~TB-2335~~ | ~~Architecture type-absence + DI guard: no new probe adapters in Api~~ **Done** 2026-08-17 | Testability | P2 | V1 | S |
| TB-2336 | Move `PlatformBundledPolicyPackRegistryBootstrapper` Application → Core | Architectural integrity | P2 | V1 | S |
| TB-2337 | Move Evolution + Learning read services from Api to Application | Maintainability | P2 | V1.1 | M |
| TB-2338 | Extract `AdminDiagnosticsService` into Application + Persistence snapshot ports | Maintainability | P2 | V1.1 | L |
| TB-2339 | Stop `ApiWebLayerServiceCollectionExtensions` extractor/HttpClient registration | Architectural integrity | P2 | V1 | M |
| TB-2340 | Api→Persistence inventory + no-new-usings guard + strangler slice | Architectural integrity | P2 | V1.1 | L |
| TB-2341 | Shared outbound probe adapter (Key Vault + HttpClient + exception mapping) | Code hygiene | P2 | V1.1 | S |
| TB-2342 | Split SQL/in-memory storage registrars into domain partials | Maintainability | P3 | V1.1 | M |

---

## TB-2333 — Remaining Api connection probes → Host.Composition (P2) — **Done** 2026-08-17

**Window:** V1 — Architectural integrity (INV-006 composition root).

**Priority:** P2.

**Source:** Owner ask 2026-08-17. Follow-on after in-flight **TenantAzureOpenAiConnectionProbeService** move; residual probes still registered in `ApiWebLayerServiceCollectionExtensions`.

**Problem:** `TeamsIncomingWebhookConnectionProbeService`, `WebhookSubscriptionTestService` / `OutboundWebhookDryRunService`, and `MarketplaceWebhookConnectivityService` remain Api-layer implementations with outbound HttpClient wiring beside controllers. Each probe duplicates timeout, sockets-handler profile, and success/failure response shaping. Worker and test hosts inherit different registration paths than production composition.

**Approach:**

1. Move probe service implementations and their `AddHttpClient` registrations from `ArchLucid.Api` into `ArchLucid.Host.Composition` (or `Host.Core` outbound integration partials), leaving Api controllers as thin HTTP adapters.
2. Register probes through the same composition entry points as the AOAI probe after its move completes.
3. Preserve existing OpenAPI contracts and admin/operator routes; no buyer-surface copy changes.

**Acceptance:** No `*ProbeService` or `*ConnectivityService` implementation types remain under `ArchLucid.Api`; `SingleCompositionRootServiceCollectionExtensionsTests` and type-absence guards (**TB-2335**) stay green; existing probe integration tests pass without Api-only DI shortcuts.

**Out of scope:** Shared outbound adapter consolidation (**TB-2341** — ship immediately after this row). IdP HTTP diagnostics (**TB-2334**). Reopening **TB-027**–**TB-032**.

**Peers:** `TeamsIncomingWebhookConnectionsController`, `AdminAzureOpenAiConnectionController`, `ApiWebLayerServiceCollectionExtensions`, `OutboundHttpSocketsHandlerProfile.ExternalIntegration`.

**Size estimate:** M.

---

## TB-2334 — IdP HTTP diagnostics → Host.Composition (P2) — **V1**

**Window:** V1 — Architectural integrity (identity admin diagnostics).

**Priority:** P2.

**Source:** Owner ask 2026-08-17. Residual after composition-root hygiene for connection probes; IdP diagnostics still live in Api web layer.

**Problem:** `OidcWellKnownDiagnosticsService`, `SamlOperationalDiagnosticsService`, and `IdentityProviderDiscoveryService` are registered with outbound `HttpClient` factories inside `ApiWebLayerServiceCollectionExtensions`. OIDC discovery, SAML metadata fetch, and IdP discovery are infrastructure outbound calls — not HTTP-controller concerns — yet they sit beside Evolution/Learning registrations and extractor hosted services, violating INV-006 placement and duplicating outbound client policy.

**Approach:**

1. Relocate diagnostic service implementations and `AddHttpClient` registrations to `ArchLucid.Host.Composition` identity/auth partials (alongside `OidcAuthorityStartupProbeHostedService` patterns in `Host.Core`).
2. Keep admin diagnostics controllers and UI strips (`OidcDiagnosticsStrip`, SAML diagnostics) as consumers only.
3. Align timeout and sockets-handler profiles with other external-integration probes.

**Acceptance:** No IdP diagnostic service types under `ArchLucid.Api`; identity admin routes still return the same DTOs; `identity-provider-probe-status-presentation.ts` labels unchanged; architecture tests green.

**Out of scope:** SSO wizard UX (**TB-2326**). Role-mapping editor (**TB-1916**–**TB-1920**). Production IdP posture docs. Connection probes (**TB-2333**).

**Peers:** `OidcWellKnownDiagnosticsService`, `SamlOperationalDiagnosticsService`, `IdentityProviderDiscoveryService`, `OidcAuthorityStartupProbeHostedService`, `identity-provider-probe-status-presentation.ts`.

**Size estimate:** M.

---

## TB-2335 — Architecture type-absence + DI guard: no new probe adapters in Api (P2) — **Done** 2026-08-17

**Window:** V1 — Testability (architecture guardrail).

**Priority:** P2.

**Source:** Owner ask 2026-08-17. Ship **before** **TB-2333** / **TB-2334** so new probe moves do not re-leak into Api.

**Problem:** `ArchitectureTypeAbsenceConstraintManifest` does not yet ban new outbound probe/diagnostic adapter types in `ArchLucid.Api`. Without a guard, engineers can add another `*ProbeService` beside controllers while **TB-2333** / **TB-2334** are in flight, recreating the composition-root drift INV-006 targets.

**Approach:**

1. Add type-absence rules (or extend manifest rows) forbidding new `*ProbeService`, `*DiagnosticsService`, and `*ConnectivityService` implementations in `ArchLucid.Api`.
2. Add a `SingleCompositionRootServiceCollectionExtensionsTests` or architecture-test scan that fails when `ApiWebLayerServiceCollectionExtensions` registers new outbound `AddHttpClient` pairs beyond an explicit allow-list until **TB-2333** / **TB-2334** land.
3. Document the temporary allow-list in `ARCHITECTURE_CONSTRAINTS.md` (not **TB-1005** matrix — do not reopen).

**Acceptance:** CI fails on a deliberate test probe adapter added to Api; shrinking allow-list as **TB-2333** / **TB-2334** ship; no change to NetArchTest tier definitions (**TB-027**–**TB-032**).

**Out of scope:** Full Api→Persistence usings guard (**TB-2340**). Rewriting `DependencyConstraintTests`. Layer leak matrix (**TB-1005**).

**Peers:** `ArchitectureTypeAbsenceConstraintManifest`, `SingleCompositionRootServiceCollectionExtensionsTests`, `INV-006`.

**Size estimate:** S.

**Done (2026-08-17):** `ApiWebLayerOutboundAdapterArchitectureTests` + `ApiWebLayerOutboundAdapterArchitectureConstants` — suffix guard for outbound probe/connectivity adapter class names (grandfathered allowlist for types pending **TB-2333**/**TB-2334**) and `AddHttpClient` registration scan on `ApiWebLayerServiceCollectionExtensions.cs`.

---

## TB-2336 — Move `PlatformBundledPolicyPackRegistryBootstrapper` Application → Core (P2) — **V1**

**Window:** V1 — Architectural integrity (bootstrapper placement).

**Priority:** P2.

**Source:** Owner ask 2026-08-17. Parallel to Done **AgentModelCatalog** catalog/bootstrap moves toward Core.

**Problem:** `PlatformBundledPolicyPackRegistryBootstrapper` lives in `ArchLucid.Application` and is registered from `ServiceCollectionExtensions.SchedulingAndAlerts` while `AdminPlatformBundledPolicyPacksController` injects it directly. Platform bundled policy pack seed data is platform metadata — not application workflow — and should follow the same Core placement pattern as `AgentModelCatalog` bootstrap types.

**Approach:**

1. Move `PlatformBundledPolicyPackRegistryBootstrapper` (and any sole-owned helper types) to `ArchLucid.Core` under governance/policy-pack bootstrap namespace.
2. Update composition registration and controller injection to use the Core type; keep `IPlatformBundledPolicyPackRegistryRepository` in Persistence.
3. No change to bundled pack contents or admin API contracts.

**Acceptance:** No `PlatformBundledPolicyPackRegistryBootstrapper` type in Application; admin platform policy-pack routes behave identically; architecture/type-absence tests green.

**Out of scope:** Policy pack markdown explain (**TB-2223** class engines). Buyer policy-pack surfaces. Bundled pack catalog expansion.

**Peers:** `DapperPlatformBundledPolicyPackRegistryRepository`, `AdminPlatformBundledPolicyPacksController`, `AgentModelCatalog` bootstrap pattern.

**Size estimate:** S.

---

## TB-2337 — Move Evolution + Learning read services from Api to Application (P2) — **V1.1**

**Window:** V1.1 — Maintainability (Api web-layer slimming).

**Priority:** P2.

**Source:** Owner ask 2026-08-17. `ApiWebLayerServiceCollectionExtensions` comment already marks these as API-model-dependent leftovers.

**Problem:** `EvolutionSimulationService`, `EvolutionSimulationReportBuilder`, and `LearningPlanningReadService` implementations sit under `ArchLucid.Api.Services` with models in `ArchLucid.Api.Models`. Worker intentionally skips them, but the split forces duplicate knowledge of evolution/learning read paths and blocks **TB-2339** from fully clearing Api web-layer registration.

**Approach:**

1. Move read service implementations to `ArchLucid.Application` (Evolution + Learning feature folders) with contracts/DTOs in `ArchLucid.Contracts` where needed.
2. Keep Api controllers as mappers only; preserve OpenAPI snapshot shapes.
3. Register services from Host.Composition Application partials, not `ApiWebLayerServiceCollectionExtensions`.

**Acceptance:** No `EvolutionSimulationService` or `LearningPlanningReadService` implementation types under `ArchLucid.Api`; evolution/learning controller tests and OpenAPI contract snapshot pass.

**Out of scope:** Evolution simulation engine behavior changes. Learning planning product features. Worker exposing evolution endpoints.

**Peers:** `EvolutionSimulationReportBuilder`, `EvolutionSimulationReportMarkdownFormatter`, `ApiWebLayerServiceCollectionExtensions`.

**Size estimate:** M.

---

## TB-2338 — Extract `AdminDiagnosticsService` into Application + Persistence snapshot ports (P2) — **V1.1**

**Window:** V1.1 — Maintainability (admin diagnostics layering).

**Priority:** P2.

**Source:** Owner ask 2026-08-17. `AdminDiagnosticsService` is ~900 lines in Api with direct Persistence repository and `IDbConnectionFactory` usage.

**Problem:** `ArchLucid.Api.Services.Admin.AdminDiagnosticsService` orchestrates cross-tenant rollups, orphan remediation, integration outbox actions, cache telemetry, and data-consistency repairs while holding Persistence types (`IRunRepository`, `IIntegrationEventOutboxRepository`, raw SQL). This is the largest Api-layer service violating Application/Persistence boundaries and duplicates audit/event patterns documented in `AUDIT_COVERAGE_MATRIX.md`.

**Approach:**

1. Split into Application orchestrators (remediation commands, rollup queries) backed by narrow Persistence snapshot/read ports (`IAdminOutboxSnapshotReader` pattern).
2. Move interfaces to Application or Contracts; keep Api controllers thin.
3. Preserve audit event types and admin route contracts documented in `AUDIT_COVERAGE_MATRIX.md`.

**Acceptance:** No `AdminDiagnosticsService` type under `ArchLucid.Api`; admin diagnostics integration tests pass; no new direct `IDbConnectionFactory` usage in Api layer.

**Out of scope:** New remediation types. Buyer admin surfaces. Cross-tenant rollup authorization changes (**TB-279**–**TB-282** Done).

**Peers:** `AdminCrossTenantUsageRollupController`, `IAdminOutboxSnapshotReader`, `AUDIT_COVERAGE_MATRIX.md` AdminDiagnostics rows.

**Size estimate:** L.

---

## TB-2339 — Stop `ApiWebLayerServiceCollectionExtensions` extractor/HttpClient registration (P2) — **V1**

**Window:** V1 — Architectural integrity (INV-006).

**Priority:** P2.

**Source:** Owner ask 2026-08-17. `ApiWebLayerServiceCollectionExtensions` still calls `AddHostedAzureExtractorIntegrationServices`, AWS/GCP equivalents, and multiple outbound HttpClients.

**Problem:** Hosted extractor integration services and tier-2 connection HttpClients are registered from the Api web-layer extension instead of `ArchLucid.Host.Composition`. This duplicates Worker vs Api registration graphs, violates INV-006, and keeps extractor ingest beside unrelated admin diagnostics.

**Approach:**

1. Move `AddHostedAzureExtractorIntegrationServices`, `AddHostedAwsExtractorIntegrationServices`, `AddHostedGcpExtractorIntegrationServices`, and `AddCloudInventoryExtractorIngestServices` to Host.Composition storage/integration partials.
2. Move tier-2 connection and webhook HttpClient registrations to composition outbound partials (pair with **TB-2341**).
3. Reduce `ApiWebLayerServiceCollectionExtensions` to Api-only middleware/models or delete it when empty.

**Acceptance:** `ApiWebLayerServiceCollectionExtensions` contains no `AddHttpClient` or `AddHosted*Extractor*` calls; extractor ingest E2E and integration tests pass; `SingleCompositionRootServiceCollectionExtensionsTests` green.

**Out of scope:** Extractor feature behavior. Multi-cloud inventory parity (**TB-2244**–**TB-2263**). Api→Persistence strangler (**TB-2340**).

**Peers:** `AddHostedAzureExtractorIntegrationServices`, `Tier2ConnectionService`, `INV-006`, `ApiWebLayerServiceCollectionExtensions`.

**Size estimate:** M.

---

## TB-2340 — Api→Persistence inventory + no-new-usings guard + strangler slice (P2) — **V1.1**

**Window:** V1.1 — Architectural integrity (layer strangler).

**Priority:** P2.

**Source:** Owner ask 2026-08-17. Residual after probe/diagnostics moves; Api still imports Persistence in controllers and services.

**Problem:** Multiple Api controllers and services still reference `ArchLucid.Persistence.*` directly (admin diagnostics, evolution reads, import paths). Without an inventory and CI guard, composition-root cleanup re-opens Persistence leaks faster than strangler slices land.

**Approach:**

1. Publish a contributor inventory of Api→Persistence usings (file + symbol) in this sidecar or `LAYER_BOUNDARY_IRREVERSIBLE_LEAK_MATRIX.md` cross-link — **do not** reopen **TB-1005** claims.
2. Add architecture-test guard: fail on *new* Api→Persistence usings beyond an explicit shrinking allow-list.
3. Land one strangler slice: move the highest-churn read path behind an Application port (candidate: a single admin snapshot reader or evolution repository facade).

**Acceptance:** CI fails when a new Api file imports Persistence; inventory row count decreases by at least one shipped slice; NetArchTest tiers unchanged.

**Out of scope:** Full Api Persistence zero (**TB-288** Done buyer DTO boundary). Rewriting **TB-1005** matrix. Fat DTO regression.

**Peers:** `LAYER_BOUNDARY_IRREVERSIBLE_LEAK_MATRIX.md`, `DependencyConstraintTests`, **TB-2338** ports.

**Size estimate:** L.

---

## TB-2341 — Shared outbound probe adapter (Key Vault + HttpClient + exception mapping) (P2) — **V1.1**

**Window:** V1.1 — Code hygiene (outbound probe consolidation).

**Priority:** P2.

**Source:** Owner ask 2026-08-17. Ship after **TB-2333** / **TB-2334** moves so consolidation targets final probe set.

**Problem:** Connection probes and IdP diagnostics each implement their own Key Vault secret resolution, `HttpClient` invocation, timeout handling, and `RequestFailedException` / HTTP status mapping. The AOAI, Teams webhook, outbound webhook, marketplace, OIDC, and SAML paths repeat the same outbound integration skeleton.

**Approach:**

1. Introduce a shared outbound probe adapter (Host.Core or Application integration helper) covering: named HttpClient execution, optional Key Vault secret fetch, normalized success/failure messages, and consistent logging.
2. Refactor moved probe services (**TB-2333**, **TB-2334**) to use the adapter without changing external API responses.
3. Document sockets-handler profile selection in one place.

**Acceptance:** Probe services do not duplicate raw `HttpClient` + exception mapping blocks; unit tests cover adapter failure modes; OpenAPI probe responses unchanged.

**Out of scope:** New probe types. Buyer trust-center copy. Webhook delivery semantics.

**Peers:** `TenantAzureOpenAiConnectionProbeService`, `TeamsIncomingWebhookConnectionProbeService`, `OutboundWebhookDryRunService`, `archlucid-secrets-keyvault-resolution.mmd`.

**Size estimate:** S.

---

## TB-2342 — Split SQL/in-memory storage registrars into domain partials (P3) — **V1.1**

**Window:** V1.1 — Maintainability (registrar readability).

**Priority:** P3.

**Source:** Owner ask 2026-08-17. `SqlStorageProviderRegistrar` and `InMemoryStorageProviderRegistrar` are large single files registering dozens of domain repositories.

**Problem:** Both registrar classes mix unrelated domains (governance, evolution, onboarding, retrieval, agents) in one `Register` method, making composition-root edits high-conflict and obscuring which domains are SQL-only vs in-memory parity gaps (`StorageProviderRegistrationParityTests`).

**Approach:**

1. Split each registrar into domain partials (e.g. `SqlStorageProviderRegistrar.Governance.cs`, `SqlStorageProviderRegistrar.Evolution.cs`) mirroring existing `ServiceCollectionExtensions.*` partial pattern.
2. Keep `IStorageProviderRegistrar` entry point and parity tests unchanged.
3. No registration order changes unless required for DI correctness.

**Acceptance:** Original registrar files split into partials; `StorageProviderRegistrationParityTests` and host startup tests pass; line ownership per domain is obvious in blame.

**Out of scope:** New repositories. Changing SQL vs in-memory provider selection. Read-replica routing (**BACKEND_PERFORMANCE_ASSESSMENT**).

**Peers:** `SqlStorageProviderRegistrar`, `InMemoryStorageProviderRegistrar`, `StorageProviderRegistrationParityTests`, `ArchLucidStorageServiceCollectionExtensions`.

**Size estimate:** M.
