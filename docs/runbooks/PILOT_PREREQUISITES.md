> **Scope:** Before-you-start checklist for first pilots — Azure resources, config keys, and cost order-of-magnitude by profile. Read this **before** Terraform apply or sponsor handoff planning.

# Pilot prerequisites

**Audience:** Operators, sales engineers, and platform engineers standing up a first ArchLucid pilot.

**Automated check:** from repo root:

```powershell
.\scripts\Test-ArchLucidPrerequisites.ps1 -Profile FirstPilotMinimum
.\scripts\Test-ArchLucidPrerequisites.ps1 -Profile StagingRealLlm
.\scripts\Test-ArchLucidPrerequisites.ps1 -Profile ProductionLike
```

Reports land under `artifacts/pilot/prerequisites-<profile>.md` (and `.json`). Exit code **2** = **BLOCK** (fix before continuing); **1** = **WARN** only; **0** = all checks **PASS**.

**Related:** [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) · [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md) pilot profiles · [`MINIMAL_AZURE_PILOT_DEPLOYMENT.md`](MINIMAL_AZURE_PILOT_DEPLOYMENT.md) · [`FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT.md`](FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT.md)

---

## Choose a profile

| Profile | When to use | Azure AI Search |
| --- | --- | --- |
| **FirstPilotMinimum** | Local or hosted pilot with SQL + simulator (or agreed real LLM without production-like retrieval) | **Not required** — `Retrieval:VectorIndex=InMemory` is acceptable when labeled non-production-like |
| **StagingRealLlm** | Hosted staging that calls Azure OpenAI for agent completion | **Not required** for internal dry runs — disclose `InMemory` retrieval in proof artifacts |
| **ProductionLike** | Buyer/security-reviewable hosted pilot, sponsor handoff, `archlucid config lint --profile production-like-hosted-pilot` | **Required — blocking** — `Retrieval:VectorIndex=AzureSearch` **and** `Retrieval:AzureSearch:Endpoint` must be set (owner 2026-05-29). **Do not** proceed to production-like proof with `InMemory` or a missing Search endpoint |

---

## Azure AI Search — blocking callout (production-like)

Production-like profiles **fail** config lint and sponsor handoff when Azure AI Search is not wired:

| Symptom | Root cause | Fix |
| --- | --- | --- |
| Mid-pilot surprise: retrieval/grounding errors after Real LLM works | Search was never provisioned; host still on `InMemory` | Provision or **consume** a pre-existing Search service (see [`AZURE_AI_SEARCH_CONSUMED.md`](../library/AZURE_AI_SEARCH_CONSUMED.md)); set `Retrieval:VectorIndex=AzureSearch` and endpoint keys |
| `azure_ai_search_vector_index_required_production_like` lint **BLOCK** | `Retrieval:VectorIndex` ≠ `AzureSearch` | Set vector index to `AzureSearch` before `-ProductionLikeHostedPilot` proof |
| `azure_ai_search_endpoint_required_production_like` lint **BLOCK** | Endpoint empty | Set `Retrieval:AzureSearch:Endpoint` (Key Vault ref or env) |
| Terraform gap | OpenAI/Search not in hosted root yet (**TB-212**) | Consume existing resource IDs per **TB-096** / owner decision — do not assume Search is created by `terraform apply` today |

**Preflight commands (after config is staged):**

```powershell
archlucid config lint --profile production-like-hosted-pilot --markdown-out config-lint-production-like-hosted-pilot.md
.\scripts\Test-ArchLucidPrerequisites.ps1 -Profile ProductionLike
```

---

## Per-profile Azure resource checklist

Preferred region when unconstrained: **East US** (`eastus`). See [`MINIMAL_AZURE_PILOT_DEPLOYMENT.md`](MINIMAL_AZURE_PILOT_DEPLOYMENT.md).

### FirstPilotMinimum

| Resource | Required | Notes |
| --- | ---: | --- |
| Azure SQL (or local SQL Server for dev) | Yes | `ConnectionStrings:ArchLucid`; DbUp migrations on startup |
| API host (Container Apps, App Service, or local `dotnet run`) | Yes | `Hosting:Role` = Api / Combined |
| Worker (or Combined host) | Yes | Background agent execution when not inline |
| Entra/OIDC, SAML, or dev auth as agreed | Yes | `ArchLucidAuth:Mode` explicit; no accidental bypass on shared hosts |
| Azure Blob Storage | Recommended | Artifacts and extractor staging |
| Azure OpenAI | No | Use `AgentExecution:Mode=Simulator` unless Real is explicitly in scope |
| Azure AI Search | No | `InMemory` retrieval OK when labeled non-production-like |
| Key Vault | Optional | Recommended before shared staging |
| Application Insights / OTLP | Optional | Required later for production-like handoff |

**Minimum config keys:** `ConnectionStrings:ArchLucid`, `ArchLucidAuth:Mode`, `Hosting:Role`, `AgentExecution:Mode`.

### StagingRealLlm

Everything in **FirstPilotMinimum**, plus:

| Resource | Required | Notes |
| --- | ---: | --- |
| Azure OpenAI | Yes | Endpoint, deployment, API key or managed identity |
| Azure Content Safety | Recommended | Real/sponsor flows per security baseline |
| Azure Blob Storage | Yes | Large evidence uploads |
| Azure AI Search | No* | *Still optional for internal staging — label proof `InMemory` retrieval |

**Additional keys:** `AzureOpenAI:Endpoint`, `AzureOpenAI:DeploymentName`, credential path (`AzureOpenAI:ApiKey` or `AzureOpenAI:AuthenticationMode=ManagedIdentity`).

### ProductionLike

Everything in **StagingRealLlm**, plus:

| Resource | Required | Notes |
| --- | ---: | --- |
| Azure AI Search | **Yes (blocking)** | Tenant-filtered retrieval; consumed resource ID pattern (**TB-096**) |
| Azure Key Vault | Yes | Secrets via references — no raw keys in appsettings committed to git |
| Application Insights or OTLP export | Yes | When `ProductionValidation:RequireTelemetryExport=true` |
| Private endpoints / Front Door | Recommended | Enterprise buyer expectation; not a first-pilot minimum |

**Additional keys:** `Retrieval:VectorIndex=AzureSearch`, `Retrieval:AzureSearch:Endpoint`, OIDC/SAML keys as used, billing safety posture when billing is live.

---

## Illustrative cost estimate (USD/month, order-of-magnitude)

**Not a quote.** Actual spend depends on region, SKU, token volume, and retention. Reconcile with Azure Cost Management before budget approval.

| Line item | FirstPilotMinimum | StagingRealLlm | ProductionLike |
| --- | ---: | ---: | ---: |
| Azure SQL | $5 – $30 | $30 – $80 | $80 – $200 |
| Container Apps / App Service (API + worker) | $20 – $50 | $50 – $120 | $120 – $300 |
| Azure OpenAI (agent runs) | $0 (simulator) | $50 – $250 | $100 – $500 |
| Azure AI Search | — | — (optional) | **$75 – $250** |
| Blob Storage | $5 – $15 | $10 – $30 | $15 – $40 |
| Key Vault | $0 – $5 | $5 | $5 – $10 |
| Application Insights / Monitor | $0 – $10 | $10 – $40 | $30 – $80 |
| **Typical pilot subtotal** | **$30 – $110** | **$155 – $520** | **$425 – $1,380** |

LLM run cost within OpenAI is usage-driven; see [`PER_TENANT_COST_MODEL.md`](../library/PER_TENANT_COST_MODEL.md) for estimation methodology (not invoice-grade).

---

## Command sequence (after prerequisites pass)

1. `.\scripts\Test-ArchLucidPrerequisites.ps1 -Profile <profile>`
2. Deploy or start hosts per [`MINIMAL_AZURE_PILOT_DEPLOYMENT.md`](MINIMAL_AZURE_PILOT_DEPLOYMENT.md)
3. `archlucid config check` · `archlucid config lint` (add `--profile production-like-hosted-pilot` when applicable)
4. `archlucid pilot preflight --api-base-url <url>`
5. Follow [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md)

---

## Explicit non-requirements (first pilot)

SOC 2 CPA attestation, third-party pen-test publication, live Stripe/Marketplace checkout, MCP, and V1.1 connectors are **not** first-pilot blockers. Record buyer questions as deferred scope — see [`FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT.md`](FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT.md).
