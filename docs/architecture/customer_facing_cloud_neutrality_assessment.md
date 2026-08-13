> **Scope:** Product-design and architecture assessment — customer-facing cloud neutrality and implementation-language exposure.  
> **Assessment date:** 2026-07-12  
> **Method:** Repository-wide evidence review (UI routes, copy constants, help registry, customer-facing docs, integration backends, guard tests). No code or content was modified during this pass.  
> **Related prior work:** [`PRODUCT_UX_IMPLEMENTATION_LEAKAGE_AUDIT_2026_06_15.md`](../architecture/PRODUCT_UX_IMPLEMENTATION_LEAKAGE_AUDIT_2026_06_15.md) (implementation leakage); [`help_review_and_architecture_guidance_assessment.md`](help_review_and_architecture_guidance_assessment.md) (help parity).  
**P0 implementation:** shipped as **TB-767**–**TB-780** in [`TECH_BACKLOG.md`](../library/TECH_BACKLOG.md) (one-shot implementation prompts removed after closure).

# Customer-facing cloud neutrality and implementation-language assessment

## 1. Sponsor recommendation

ArchLucid has **invested deliberately** in multi-cloud connector parity for **read-only evidence collection** (Azure, AWS, Google Cloud hub pages, parallel help topics, `cloud-neutral-primary-copy.ts` with CI guards). That investment is **real and test-backed** for the cloud-connections workflow.

However, **Azure, AWS, and Google Cloud are not currently presented as first-class peers** across the full customer-visible product. Neutrality is **strongest where cloud is explicitly selected** (cloud connections, provider-scoped help) and **weakest where the product speaks generically** (integration credential UX, marketing exemplars, default provisioning, demo/sample content, deployment-operator surfaces).

**Recommended posture:**

1. **Do not** paper over genuine capability asymmetry. ArchLucid’s **hosted SaaS** runs on Azure (Azure OpenAI, Key Vault, Azure SQL, Service Bus). That is accurate procurement language — separate from **customer workload** neutrality.
2. **Do** fix copy and IA where Azure appears **without justification** (ServiceNow readiness sentence, marketing use-case cards, wizard inventory default when `cloudProvider` is `None`).
3. **Do** fix **implementation leakage** on workspace-admin routes (host configuration keys, tenant SQL, vendor probes, smoke checklists) — highest severity on `/integrations/servicenow` and `/integrations/jira`.
4. **Treat as capability work (not copy-only):** multi-tenant ITSM connector configuration on the former unified hub was **removed** (`/integrations/itsm` retired — no redirect; OAuth callback retained; product on Jira/ServiceNow + admin connectors); secret resolution is **Key Vault or environment variables only** — no AWS Secrets Manager or Google Secret Manager `ISecretProvider` backend.
5. **Sequence:** (A) immediate copy/IA fixes → (B) ServiceNow/Jira page redesign + restore connector configuration path → (C) secret-store abstraction wording + optional provider backends → (D) marketing/sample parity pass.

---

## 2. Customer-facing route inventory

**Legend:** Visibility follows `archlucid-ui/docs/NAV_CONFIG_CONTRACT.md` and route tier policy. “Customer-visible” means reachable by a paying workspace user without `showSystemAdministrationNav` unless noted.

### 2.1 Marketing and public (20 routes)

| Route | Source | Audience | Cloud notes |
|-------|--------|----------|-------------|
| `/welcome` | `(marketing)/welcome/page.tsx` | Public | Use-case cards **2/3 Azure-specific** (`welcome-marketing-copy.ts`) |
| `/pricing` | `(marketing)/pricing/page.tsx` | Public | Quote placeholder mentions “private Azure” |
| `/faq` | `(marketing)/faq/page.tsx` | Public | Multi-cloud FAQ (`marketing-faq.ts`) — **aligned** |
| `/try` | `(marketing)/try/page.tsx` | Public | “no Azure setup, no Entra ID” — negated but Entra-forward |
| `/quick-scan` | marketing clients | Public | Azure-heavy placeholders |
| `/quick-start` | retired legacy bookmark (canonical `/get-started`) | Public | Not a live marketing surface; metadata noindex only (TB-1818) |
| `/get-started` | `(marketing)/get-started/page.tsx` | Public | Entra-first auth copy |
| `/trust`, `/security-trust`, `/privacy`, `/compliance-journey` | marketing | Public | Trust/procurement — Azure hosting truth OK |
| `/see-it`, `/demo/preview`, `/live-demo`, `/showcase/[runId]` | marketing | Public | Demo entry |
| `/signup`, `/signup/verify` | marketing | Public | Neutral |

### 2.2 Operator shell — core workflow (~35 routes)

| Route | Audience | Cloud / leakage notes |
|-------|----------|----------------------|
| `/` | Operator | Multi-cloud CTA (`buyer-polish-copy.ts`) — **aligned** |
| `/architectures`, `/architectures/new`, `/architectures/[id]` | Operator | Creation flow; wizard defaults `cloudProvider: "None"` — **aligned** |
| `/reviews/new` | Operator | Cloud-neutral lead copy + guard tests — **aligned** |
| `/reviews`, `/reviews/[runId]/*` | Operator | Sample `claims-intake-modernization` is Azure-heavy demo |
| `/architecture/first-review-guide` (canonical onboarding), legacy `/onboarding/start`, `/onboard`, `/getting-started` (redirect shims), retired `/onboarding` | Operator | Finish setup mentions Key Vault (`FinishSetupWizardPanel.tsx`) |
| `/dashboard`, `/graph`, `/ask`, `/search`, `/compare` | Operator | Empty states link Azure-skewed sample run |
| `/patterns`, `/patterns/[key]` | Operator | Catalog includes multi-cloud tags — **mostly aligned** |
| `/governance/*` | Operator | Policy packs; default provisioning Azure-biased (backend) |
| `/help`, `/help/[topic]` | Operator | 50+ topics; parallel cloud-connection topics — **aligned** |

### 2.3 Integrations (10 routes + redirects)

| Route | Audience | Notes |
|-------|----------|-------|
| `/integrations/cloud-connections` | Execute+ | **Cloud-neutral hub** — reference implementation |
| `/integrations/cloud-connections/azure\|aws\|gcp` | Execute+ | Provider-scoped — **correct** |
| `/integrations/jira`, `/integrations/servicenow` | Admin | **High leakage**; deployment-operator copy |
| `/integrations/teams` | Read+ | **Key Vault-only** credential UX |
| `/integrations/slack` | Read+ | Direct webhook — different model |
| `/integrations/webhooks` | Execute+ advanced | Generic |
| `/integrations/readiness` | Admin | Read-only dashboard |
| `/integrations/itsm` | — | **Removed** (no redirect; OAuth callback retained at `/integrations/itsm/oauth/callback`) |
| `/administration/settings/*` (tenant, users, IdP, billing, etc.) | Admin / mixed | Identity diagnostics use “probe” language |
| `/health` | Admin | “Key vault connectivity”, “Service probes” |

### 2.4 Internal operations (gated)

`/admin/*`, `/operate/*` — not buyer-primary; may retain engineering vocabulary. Included when copy **bleeds** into blocked-route explanations or mis-linked help.

**Total App Router pages:** 133 `page.tsx` files under `archlucid-ui/src/app` (per route inventory pass 2026-07-12).

---

## 3. Azure / AWS / Google Cloud parity matrix

| Dimension | Azure | AWS | Google Cloud | Verdict |
|-----------|-------|-----|--------------|---------|
| **1. Positioning parity** | Named in multi-cloud lists; also dominant in marketing use cases and try-page negation | Named in multi-cloud lists; thinner marketing exemplars | Named as “Google Cloud” / “GCP” (inconsistent styling) | **Partial** — lists are equal; **story** is Azure-heavy |
| **2. Navigation parity** | Cloud connections + dedicated nav/help | Same | Same | **Strong** for connectors |
| **3. Workflow parity** | Evidence-only default; Azure ZIP sets provider | Aws/Gcp enum supported | Same | **Partial** — wizard inventory UI **defaults to Azure commands** when provider is `None` |
| **4. Connector parity** | Tier-2 hosted extractor + WIF | Tier-2 hosted extractor + OIDC (TB-402 done) | Tier-2 hosted extractor + WIF (TB-403 done) | **Strong** for read-only evidence |
| **5. Policy-pack parity** | Default tenant baseline includes Azure WAF + CIS Azure | AWS/GCP packs exist in corpus; **not default baseline** | Same | **Asymmetric by design** but **under-explained** in marketing |
| **6. Sample parity** | `operator-static-demo`, showcase, templates | Sparse | Sparse | **Azure-skewed** |
| **7. Help parity** | `cloud-connections-azure`, `azure-permissions` | `cloud-connections-aws` | `cloud-connections-gcp` | **Strong** |
| **8. Runtime parity** | Hosted on Azure; Key Vault secrets; Azure OpenAI | Customer evidence via federation; **no** AWS SM for app secrets | Same | **Asymmetric** — honest for SaaS, not for integration secrets |
| **9. Error-message parity** | Key Vault errors on Teams validate | N/A | N/A | **Weak** on integrations |
| **10. Terminology parity** | “Microsoft Azure”, “Azure”, “Entra” mixed | “AWS”, “Amazon Web Services” | “GCP” vs “Google Cloud Platform” mixed | **Moderate** inconsistency |

---

## 4. Cloud-reference findings (ranked by severity)

| Rank | Route / doc | Source | Exact text (excerpt) | Classification | Severity | Why / evidence | Correction | Type |
|------|-------------|--------|------------------------|----------------|----------|----------------|------------|------|
| 1 | `/welcome` use cases | `welcome-marketing-copy.ts` L92–100 | “Azure Well-Architected Framework”, “Azure CAF / landing zone” | **Marketing bias** / **Sample-data bias** | **Critical** | Public homepage positions **2 of 3** hero use cases as Azure-only frameworks with no AWS/GCP counterparts | Add AWS WAF + GCP Architecture Framework cards or make first card cloud-neutral | Copy |
| 2 | `/integrations/servicenow`, `/integrations/jira` | `ItsmProductIntegrationPageClient.tsx` L171 | “…Teams, Slack, **Azure**, and webhooks” | **Unexplained Azure-only reference** | **Critical** | Azure is not an integration peer on this sentence; likely erroneous paste | “cloud connections” or enumerate all three providers only on cloud surfaces | Copy |
| 3 | Default tenant provisioning | `DefaultPolicyPackCatalog.cs` L107–109 | `StandardBaselineDisplayNames` resolves **Azure** baseline | **Runtime-behavior bias** | **High** | New tenants get Azure WAF + CIS Azure packs by default regardless of customer cloud | Document in onboarding; consider cloud-target prompt at provisioning | Capability + copy |
| 4 | Wizard optional inventory | `WizardStepAzureContext.tsx` L15–24 | `resolveInventoryPlatform` returns `"azure"` when `cloudProvider === "None"` | **Runtime-behavior bias** | **High** | Test explicitly asserts Azure command shown by default (`WizardStepAzureContext.test.tsx` L83) | Default to neutral prompt or last-selected provider; no command until provider chosen | Copy + UX |
| 5 | Marketing `/why` | `why-comparison.ts` L23 | `TenantDatabaseBindings`, “SQL RLS is not the production boundary” | **Customer-visible implementation leakage** | **High** | Public competitive table exposes internal types | Buyer-safe: “database-per-tenant isolation with application-layer enforcement” | Copy |
| 6 | Sample review / graph empty states | `operator-static-demo.ts`, `empty-state-presets.ts` | Azure OpenAI, APIM, Service Bus throughout | **Sample-data bias** | **High** | Primary “see the product” path is Azure-shaped | Add AWS/GCP sample packages or multi-cloud neutral sample | Content |
| 7 | Intake placeholders | `reviews-new-path-copy.ts`, `guided-intake-copy.ts`, `QuickStartClient.tsx` | “Customer-facing retail API **on Azure**…” | **Unexplained Azure-only reference** | **Medium** | Placeholders imply default target cloud | Rotate examples or use cloud-neutral brief | Copy |
| 8 | `/try` metadata | `try/page.tsx` L11 | “no Azure setup, no Entra ID sign-in” | **Marketing bias** (Entra as default IdP) | **Medium** | Frames Entra as expected enterprise IdP | “no cloud account or corporate sign-in required” | Copy |
| 9 | Cloud connections Azure detail | `AzureCloudConnectionDetailClient.tsx` L72 | “ArchLucid hosts the extractor service on Azure infrastructure…” | **Correct provider-specific reference** | **Low** | Honest hosting disclosure; AWS page clarifies cross-cloud trust | Keep | — |
| 10 | `CLOUD_CAPABILITY_PROVIDER_MAP` | `cloud-neutral-primary-copy.ts` | Equal Azure/AWS/GCP rows | **Correct cross-cloud comparison** | **N/A (positive)** | Reference pattern for neutral surfaces | Reuse pattern on integration pages | — |
| 11 | FAQ | `docs/library/customer-facing/FAQ.md` L38–39 | ITSM connectors are **V1.1** | **Stale limitation** | **High** | Contradicts `INTEGRATION_CATALOG.md` (V1 GA 2026-07-03) | Update FAQ to V1 GA + link catalog | Copy |
| 12 | Hosted AI disclosure | `DATA_HANDLING.md`, `FAQ.md` | “Azure OpenAI per deployment configuration” | **Correct provider-specific reference** | **Low** | Accurate for Azure-hosted SaaS | Keep; optional footnote that customer workload cloud is independent | — |

---

## 5. Internal-language exposure findings (ranked by severity)

| Rank | Route | Source | Exact text (excerpt) | Classification | Severity | Correction | Type |
|------|-------|--------|------------------------|----------------|----------|------------|------|
| 1 | `/integrations/servicenow`, `/integrations/jira` | `ItsmProductIntegrationPageClient.tsx` L195, L218–230 | `Integrations:ItsmOutbound:ServiceNow`, “host configuration”, “Key Vault materialization”, “tenant SQL” | **Customer-visible implementation leakage** | **Critical** | Workspace-admin language for deployment operators; move to gated “Deployment prerequisites” help or system-admin | Copy + IA |
| 2 | `/why` (marketing) | `why-comparison.ts` L23 | `TenantDatabaseBindings` | **Customer-visible implementation leakage** | **Critical** | Generalize isolation claim | Copy |
| 3 | `/integrations/teams` | `teams-integration-page-copy.ts`, `teams-integration-secret-validation.ts` | “Key Vault secret name”, “Check the workspace’s Key Vault permissions” | **Customer-visible implementation leakage** | **High** | Use “approved secret store” + provider-specific detail on cloud settings | Copy (capability limits footnote) |
| 4 | `/integrations/itsm` (**removed** hub) | `ItsmConnectorConnectionSection.tsx` (retired with hub) | `credentialKeyVaultSecretName`, OAuth KV fields | **Customer-visible implementation leakage** | **High** | Hub removed — configure on Jira/ServiceNow + admin connectors; keep labels neutral | Capability + copy |
| 5 | `/health` | `health-readiness-presentation.ts` L56, L84 | “Key vault connectivity”, `keyvault` check id | **Customer-visible implementation leakage** | **Medium** | “Secrets store connectivity” with Azure detail in disclosure | Copy |
| 6 | Finish setup wizard | `FinishSetupWizardPanel.tsx` L85 | “without manual Key Vault edits” | **Customer-visible implementation leakage** | **Medium** | “without manual secret-store configuration” | Copy |
| 7 | Connection test cards | `ItsmProductIntegrationPageClient.tsx` L323 | “read-only vendor probes” | **Customer-visible implementation leakage** | **Medium** | “read-only connection check” | Copy |
| 8 | Smoke links | ITSM product pages | “ServiceNow connector smoke checklist” | **Customer-visible implementation leakage** | **Medium** | “connection verification checklist” (keep ops doc behind admin) | Copy |
| 9 | Help index | `help-index.generated.ts` | `Integrations:ItsmOutbound:` excerpts | **Internal-only implementation detail** (search bleed) | **Medium** | Scrub generated index excerpts | Build pipeline |
| 10 | API paths in customer docs | `WORKFLOW_RECIPES_BY_PERSONA.md` | `/v1/pilots/runs/...` | **Customer-visible implementation leakage** | **Low** | Prefer “review” vocabulary with API alias note | Copy |
| 11 | Nav group id `pilot` | `nav-config.ts` | Internal id “pilot” | **Internal-only** | **Low** | Cosmetic rename backlog | — |
| 12 | Email templates | `TrialWelcome.cshtml` | No cloud terms | **Clean** | — | No change | — |

---

## 6. ServiceNow page findings

**Route:** `/integrations/servicenow`  
**Source:** `archlucid-ui/src/app/(operator)/integrations/servicenow/page.tsx` → `ItsmProductIntegrationPageClient` (`product="servicenow"`)

| Question | Finding |
|----------|---------|
| **Intended audience** | Nav requires `AdminAuthority`; mutations require `ExecuteAuthority`. Copy targets **deployment operators** (host configuration, pilot fallback), not workspace admins configuring a SaaS tenant. |
| **Workspace-admin vs deployment-operator** | **Deployment-operator page** presented in **workspace-admin** nav. Misaligned with Teams/Slack (tenant self-service). |
| **Instance URL / credentials here?** | Copy said per-tenant connector references lived on a “unified ITSM page” — but **`/integrations/itsm` was redirected then removed**. Product pages expose Jira/ServiceNow surfaces + admin connectors; not a restored unified hub. |
| **Permits configuration?** | **Partially.** Saves `serviceNowAutoCreateCmdbCi` only. No ServiceNow instance URL, no secret names, no credential entry on this page. |
| **Exposes internal config keys?** | **Yes.** `Integrations:ItsmOutbound:ServiceNow credentials in host configuration` |
| **Why Azure in readiness sentence?** | Line 171 lists “Azure” alongside Teams, Slack, webhooks — **no code-backed reason**. Classified as **copy error** / stray cloud reference. |
| **Key Vault only?** | **Yes for runtime.** `SecretProviderKind`: `EnvironmentVariable`, `KeyVault` only (`ArchLucid.Core/Secrets/SecretProviderKind.cs`). AWS Secrets Manager / Google Secret Manager: **not implemented** as `ISecretProvider`. |
| **Secret-store on this page?** | Mentioned in deployment prerequisites (“Key Vault materialization”) — **belongs in operator runbook**, not workspace integration UI. |
| **Connection test gating** | **Not gated.** “Run connection test” always enabled; re-fetches health probes even when credentials missing. |
| **Deployment prerequisites in customer UI?** | **Yes — inappropriately.** “Native outbound create”, host config keys, pilot fallback language. |

**Backend evidence:** `ItsmTenantConnectorCredentialResolver` resolves tenant KV secret names or falls back to `Integrations:ItsmOutbound:ServiceNow` deployment options; `RequireTenantScopedCredentials` disables fallback for multi-tenant SaaS.

---

## 7. Integration-page consistency findings

| Aspect | Jira | ServiceNow | Teams | Slack | Cloud connections | Readiness |
|--------|------|------------|-------|-------|-------------------|-----------|
| **Layout** | Compact card (`max-w-3xl`) | Same | Wide two-column + aside | Same as Teams | Hub + wizard | Dashboard cards |
| **Credential model** | Host config readout | Same | KV secret **name** | Webhook URL in DB | Federation, no secrets stored | Status only |
| **Self-service config** | Tenant routing fields only | CMDB flag only | Full connect flow | Full connect flow | Full wizard | N/A |
| **Secret store UX** | KV (redirected page) | Same | Azure Key Vault explicit | Subscription metadata | Provider-neutral map in copy | Per-connector API text |
| **Pre-save validation** | None on product page | Same | Validate KV + test send | Dry-run webhook | Wizard validate | None |
| **Connection test** | Health probe re-fetch | Same | Validate + notification test | Per-destination test | Save & validate | Links out |
| **Ops language** | smoke checklist, vendor probes | Same | Key Vault permissions | Minimal | Technical details disclosure | smokeReadiness from API |
| **Nav authority** | Admin | Admin | Read | Read | Execute | Admin |

**Largest inconsistency:** ITSM product pages **describe** per-tenant Key Vault connector setup on a **unified ITSM page that redirects away**, while Teams/Slack allow full tenant configuration on their product routes.

---

## 8. Capability gaps versus copy gaps

| Item | Gap type | Evidence | Notes |
|------|----------|----------|-------|
| Multi-cloud **evidence connectors** | **Copy aligned; capability present** | `CloudConnectionsPageClient.tsx` lists all three; APIs for Azure/AWS/GCP Tier-2 | TB-402/TB-403 marked done in TECH_BACKLOG |
| **Secret store** for Teams/ITSM | **Capability gap** | Only `KeyVault` + `EnvironmentVariable` | Copy should not imply AWS SM / Google SM until implemented |
| **ITSM per-tenant connector UI** | **Capability present; IA gap closed for hub** | `ItsmIntegrationPageClient` + `ItsmConnectorConnectionSection` **removed** with hub; product on Jira/ServiceNow + `/internal/integrations/itsm` | Do not restore `/integrations/itsm` hub |
| **ServiceNow instance URL in UI** | **Capability present** on product/admin connectors (former hub **removed**) | Not on a restored `/integrations/itsm` hub | Keep on product surfaces |
| **Slack vs Teams credential storage** | **Real asymmetry** | Slack stores webhook in alert-routing metadata; Teams uses KV reference | Document honestly; do not force KV wording on Slack |
| **Default policy packs** | **Capability asymmetry** | `StandardBaselineDisplayNames` = Azure baseline | Not a copy bug — needs transparent limitation or cloud-targeted provisioning |
| **Hosted SaaS on Azure** | **Accurate asymmetry** | Trust center, DATA_HANDLING | Keep |
| **FAQ ITSM V1.1** | **Copy gap only** | FAQ vs INTEGRATION_CATALOG | Update doc |
| **Marketing Azure use cases** | **Copy gap** | No AWS/GCP framework cards | Copy or add packs |
| **Wizard inventory default platform** | **UX/copy gap** | Defaults to Azure when `None` | Copy/UX |

---

## 9. Stale documentation and stale capability claims

| Document | Claim | Current truth | Action |
|----------|-------|---------------|--------|
| `docs/library/customer-facing/FAQ.md` L38–39 | ITSM is V1.1 | V1 GA per `INTEGRATION_CATALOG.md` (2026-07-03) | Update FAQ |
| `docs/library/customer-facing/CI_CD_INTEGRATION_GUIDE.md` L5 | ITSM deferred to V1.1 | First-party connectors V1 GA | Update scope line |
| ITSM product page summary | “unified ITSM page” for connector refs | `/integrations/itsm` **removed** (was readiness redirect) | Fix copy to Jira/ServiceNow / connection status |
| `PRODUCT_UX_IMPLEMENTATION_LEAKAGE_AUDIT_2026_06_15.md` | Wizard defaults `cloudProvider` to Azure | **Fixed** — `buildDefaultWizardValues()` uses `"None"` (TB-340) | Do not regress |
| `WizardStepAzureContext.test.tsx` | Azure command by default when `None` | Still current — **stale neutrality claim** in comments elsewhere | Fix wizard default platform |

---

## 10. Approved provider-neutral terminology

Use on **generic** surfaces (before cloud selection, integration hub intros, error messages):

| Concept | Approved neutral term | Avoid on generic surfaces |
|---------|----------------------|---------------------------|
| Customer hyperscaler | “cloud provider”, “selected cloud platform” | “Azure” alone |
| Evidence import | “cloud inventory ZIP”, “read-only inventory script” | “Azure extractor ZIP” (OK on Azure page) |
| All three providers | “Azure, AWS, and Google Cloud” (equal order OK) | “Azure, AWS, and GCP” in customer prose (pick one GCP style) |
| Secrets | “approved secret store”, “secret reference” | “Key Vault secret name” |
| Deployment config | “deployment settings” (with link to operator guide) | `Integrations:*` keys, “host configuration” |
| Connection check | “connection test”, “connection check” | “vendor probe”, “smoke test” |
| Tenant data store | “tenant database” | “tenant SQL”, `TenantDatabaseBindings` |
| Review workflow | “architecture review”, “architecture package” | “pilot run”, `/v1/pilots/` in UI |
| Identity | “work identity”, “corporate sign-in” | “Entra ID” unless discussing Microsoft auth |
| Optional connectors | “cloud connections (optional)” | Implying any one cloud is required |

**GCP styling:** Prefer **“Google Cloud”** in customer prose; **“GCP”** acceptable in technical tables and CLI/script names.

---

## 11. Cases where provider-specific language should remain

| Surface | Provider | Reason |
|---------|----------|--------|
| `/integrations/cloud-connections/azure` | Azure | Provider-scoped setup (WIF, Entra app registration) |
| `/help/cloud-connections-azure`, `azure-permissions` | Azure | Correct scoped help |
| Azure policy packs (WAF, CAF, CIS Azure, AKS) | Azure | Framework fidelity |
| AWS/GCP policy packs and help topics | AWS / GCP | Same |
| Trust center / DATA_HANDLING | Azure | Hosted SaaS subprocessors (Azure OpenAI, Azure SQL) |
| `AzureCloudConnectionDetailClient` hosting note | Azure | Honest cross-cloud federation disclosure |
| `Entra` on SAML/OIDC enterprise onboarding | Microsoft | When configuring Microsoft IdP |
| Teams integration | Microsoft | Product is Microsoft Teams |
| Sample briefs **when labeled** “Azure migration template” | Azure | Explicit template choice |
| `cloud-neutral-primary-copy.ts` comparison table | All three | Explicit comparison context |

---

## 12. Routes requiring immediate correction (copy-only, high confidence)

1. **`/integrations/servicenow` and `/integrations/jira`** — Remove “Azure” from readiness cross-link sentence (L171). Replace deployment card leakage (config keys, tenant SQL, host configuration).
2. **`/welcome`** — Rebalance `WELCOME_USE_CASE_CARDS` (add AWS WAF + GCP Architecture Framework or one cloud-neutral card).
3. **`/why`** — Replace `TenantDatabaseBindings` row with buyer-safe isolation language.
4. **`/integrations/teams`** — Replace “Key Vault” with “approved secret store”; keep Azure-specific steps in collapsible “Azure Key Vault” subsection.
5. **`/health`** — Rename “Key vault connectivity” → “Secrets store connectivity”.
6. **`FinishSetupWizardPanel`** — Remove “Key Vault edits”.
7. **`docs/library/customer-facing/FAQ.md`** — ITSM V1 GA alignment.
8. **Intake placeholders** — `reviews-new-path-copy.ts`, `guided-intake-copy.ts`, `QuickStartClient.tsx` — cloud-neutral or rotating examples.

---

## 13. Routes requiring capability work before copy correction

1. **`/integrations/itsm` removed hub** — Do not restore the unified hub; keep connector configuration on Jira/ServiceNow product pages + admin connectors **before** promising “configure instance URL here” on a dead path.
2. **Secret provider abstraction** — Implement or explicitly defer AWS Secrets Manager / Google Secret Manager; until then, Teams/ITSM copy must state **“Azure Key Vault (hosted deployments)”** with limitation footnote — not fake neutrality.
3. **Default policy pack provisioning** — If marketing claims multi-cloud parity, either provision neutral-only defaults or capture cloud target at signup and call `ResolveStandardBaselineDisplayNames(cloudProvider)`.
4. **Multi-cloud sample packages** — Before claiming sample parity, ship at least one AWS- and one GCP-skewed showcase run (or label samples “Azure reference architecture”).

---

## 14. Suggested reusable customer-facing status and error patterns

**Connector status (readiness dashboard):**

- **Not configured** — “Not set up for this workspace.”
- **Configuration incomplete** — “More setup is required before this connector can send or receive data.”
- **Ready** — “Configured and last connection check succeeded.”
- **Needs attention** — “Configured, but the last connection check failed. Review settings and try again.”

**Connection test errors:**

- Missing credentials: “This connector is not fully configured. Complete the setup steps above, then run the connection check again.”
- Secret access failure: “ArchLucid could not read the configured secret. Confirm the secret exists and that this deployment can access your organization’s secret store.”
- Vendor unreachable: “Could not reach {vendor}. Check the instance URL and network access from your deployment.”

**Avoid:** raw HTTP paths, `Integrations:*` keys, “probe”, “smoke”, “materialization”, exception types.

---

## 15. Suggested secret-storage wording

**Generic (Teams, ITSM tenant setup):**

> Store credentials in your organization’s approved secret store. Enter the **secret name or reference** here — ArchLucid does not store the secret value in the workspace database.

**Azure-hosted SaaS footnote (when limitation applies):**

> On ArchLucid-hosted deployments, the supported secret store is **Azure Key Vault**. AWS Secrets Manager and Google Secret Manager support is on the roadmap for customer-operated deployments.

**Teams-specific:**

> Reference the secret that contains your Teams incoming webhook URL. The URL is read only when sending a notification.

**Slack-specific (honest asymmetry):**

> Paste your Slack incoming webhook URL. After saving, the URL is hidden and stored with this destination’s configuration.

---

## 16. Suggested connector-readiness wording

**Integration readiness hub intro:**

> See which notifications, ticketing, publishing, and delivery integrations are ready for this workspace — and what to configure first.

**ITSM product page lead (replacement):**

> Configure ServiceNow outbound incident creation from architecture findings. Set instance connection details and routing preferences for this workspace.

**Cross-link (replacement for L163–172):**

> See [Integration readiness](/integrations/readiness) for status across ServiceNow, Jira, Teams, Slack, cloud connections, and webhooks.

**Deployment-only block (move behind “For platform operators” disclosure or remove from workspace UI):**

> Native ticket creation requires deployment-level credentials configured by your platform team. Contact your administrator if connection checks fail.

---

## 17. Recommended implementation sequence

| Phase | Scope | Effort | Risk if skipped |
|-------|-------|--------|-----------------|
| **P0** | ServiceNow/Jira copy purge + Azure sentence fix + FAQ stale ITSM | S | Continued buyer confusion; procurement objections |
| **P0** | `/why` tenant isolation row | S | Public implementation leakage |
| **P1** | Restore ITSM connector configuration route (un-redirect or embed) | M | Multi-tenant ITSM blocked except via API |
| **P1** | Shared integration page template (Teams layout + ITSM semantics) | M | Persistent IA inconsistency |
| **P1** | Secret-store wording pass (Teams, ITSM, health, finish setup) | S | Azure implied as only enterprise path |
| **P2** | Marketing use-case parity + placeholder rotation | M | Homepage Azure bias |
| **P2** | Wizard inventory: no default Azure command when `cloudProvider` is `None` | S | False parity in creation flow |
| **P2** | Help index scrub `Integrations:*` excerpts | S | Search leakage |
| **P3** | Optional `ISecretProvider` backends (AWS SM, Google SM) | L | Cannot honestly claim secret-store neutrality |
| **P3** | Cloud-targeted default policy pack provisioning | M | Runtime Azure default vs marketing |
| **P3** | AWS/GCP sample architecture packages | L | Demo parity |

---

## 18. Tests required to prevent regression

| Test | Purpose |
|------|---------|
| Extend `cloud-neutral-primary-copy-guard.test.ts` | Ban “host configuration”, `Integrations:`, “tenant SQL” in integration copy constants |
| `ItsmProductIntegrationPageClient.test.tsx` (new) | Assert readiness sentence includes “cloud connections”, not bare “Azure” |
| `integrations-servicenow` / `integrations-jira` snapshot or RTL | No `Integrations:ItsmOutbound` in rendered output |
| `teams-integration-page-copy.test.ts` | Secret labels use neutral primary term; Azure in disclosure only |
| `why-comparison.test.ts` | No `TenantDatabaseBindings` in public row labels |
| `welcome-marketing-copy.test.ts` | At least one non-Azure use case card OR explicit multi-cloud card |
| `WizardStepAzureContext.test.tsx` | **Change expectation:** when `cloudProvider` is `None`, no platform command until user selects provider |
| `product-documentation-registry.test.ts` | Keep AWS/GCP help free of Azure-only leakage (existing) |
| `connector-operations-present.test.ts` | User-visible Confluence disabled message must not expose raw config key |
| CI grep / `scripts/ci/` corpus lint | Block new customer-visible `Integrations:` strings in `archlucid-ui/src` |

---

## 19. Explicit items that should not be changed

1. **Provider-scoped cloud connection pages and help** (`/integrations/cloud-connections/azure|aws|gcp`, matching `/help/*` topics).
2. **`CLOUD_CAPABILITY_PROVIDER_MAP` and `cloud-neutral-primary-copy-guard.test.ts`** banned-phrase list — extend, do not weaken.
3. **Trust center Azure subprocessors** (Azure OpenAI, Azure SQL, Blob, Key Vault as *ArchLucid hosting*).
4. **Azure-named policy packs** when selected or displayed as Azure framework packs.
5. **Teams as Microsoft product name** and Slack as Slack — vendor names are correct.
6. **Backend `SecretProviderKind.KeyVault` for hosted SaaS** — implementation stays; customer wording abstracts it.
7. **Evidence-only default** (`cloudProvider: "None"` in `buildDefaultWizardValues`) — do not revert.
8. **Slack direct webhook model** — do not force Key Vault parity where product intentionally differs.
9. **Internal `/admin/*` routes** — engineering vocabulary acceptable behind `showSystemAdministrationNav`.
10. **Honest statements that ArchLucid hosted infrastructure is Azure-native** (`docs/go-to-market/POSITIONING.md`) — distinct from customer workload neutrality.

---

## 20. Final verdict

### Question 1: Are Azure, AWS, and Google Cloud first-class peers in customer-visible behavior and content?

**No — partially, with intentional and unintentional asymmetry.**

- **First-class for read-only cloud evidence connectors:** Yes — navigation, workflows, help, and Tier-2 APIs are structurally parallel.
- **Not first-class overall:** Marketing story, default policy provisioning, demo/sample content, integration secret UX, and ITSM admin surfaces skew **Azure** or **deployment-operator Azure idioms** (Key Vault, host configuration). Some of this reflects **real hosted-SaaS constraints**; much is **copy and IA debt**.

**Honest summary:** ArchLucid is a **multi-cloud architecture review product** running on an **Azure-hosted control plane**, with **Azure-flavored integration credential patterns** that are not yet abstracted for AWS/GCP secret stores.

### Question 2: Does ArchLucid expose internal implementation language to customers?

**Yes — materially on integration and procurement-adjacent routes.**

Highest concentration: **`/integrations/servicenow`**, **`/integrations/jira`**, **`/integrations/teams`**, **`/why`**, **`/health`**, and **stale FAQ**. Email templates are clean. Cloud connections area is the **positive control**.

---

## Appendix A — Bounded implementation prompts (do not execute from this assessment)

### A1. Immediate high-confidence copy corrections

```
Scope: Copy-only. Files: ItsmProductIntegrationPageClient.tsx (readiness sentence + deployment card),
why-comparison.ts (tenant isolation row), teams-integration-page-copy.ts,
teams-integration-secret-validation.ts, health-readiness-presentation.ts,
FinishSetupWizardPanel.tsx, docs/library/customer-facing/FAQ.md (ITSM V1 GA),
reviews-new-path-copy.ts, guided-intake-copy.ts, QuickStartClient.tsx placeholder,
welcome-marketing-copy.ts (use case cards).

Rules: Use approved neutral terminology (§10). No Integrations:* keys in customer-visible strings.
Add/extend tests per §18. Do not change routes or backend.
```

### A2. ServiceNow page

```
Scope: Redesign /integrations/servicenow (and shared ItsmProductIntegrationPageClient) for
workspace-admin audience. Remove deployment-operator prerequisites from default view;
gate behind "Platform operator notes" disclosure or link to operator runbook.

Embed or link reachable per-tenant connector configuration (instance URL, secret references).
Fix readiness cross-link (cloud connections, not Azure). Gate connection test when credentials incomplete.
Align copy with §14–16 patterns.
```

### A3. Shared integration-page design

```
Scope: Unify Teams/Slack two-column layout with ITSM product pages. Single integration template:
header, security aside, configure panel, connection check, readiness link.

Resolve removed /integrations/itsm hub: do not restore ItsmIntegrationPageClient; keep OAuth callback and product surfaces on jira/servicenow + admin connectors.

Document credential model differences (KV reference vs webhook URL) without implying parity that does not exist.
```

### A4. Navigation and help corrections

```
Scope: FAQ ITSM V1 GA; CI_CD_INTEGRATION_GUIDE scope line; scrub help-index.generated.ts Integrations: excerpts;
ensure enterprise onboarding links remain provider-balanced (existing tests in HelpTopicEnterpriseOnboarding.test.tsx).

Add help topic or section "Secret store requirements (hosted deployments)" with honest Azure Key Vault limitation.
```

### A5. Genuine cross-cloud capability gaps

```
Scope: (1) ISecretProvider implementations for AWS Secrets Manager and Google Secret Manager OR
explicit product decision to document Azure-only for hosted SaaS. (2) ResolveStandardBaselineDisplayNames
at tenant provisioning based on declared cloud target. (3) AWS/GCP showcase sample runs.
(4) WizardStepAzureContext: require cloud provider selection before showing inventory script command.

Each item needs ADR/backlog ID before implementation; do not fake neutral copy ahead of capability.
```

---

## Appendix B — Evidence index (primary sources)

| Area | Path |
|------|------|
| ServiceNow UI | `archlucid-ui/src/app/(operator)/integrations/_sections/itsm/ItsmProductIntegrationPageClient.tsx` |
| ITSM connector form | ~~`archlucid-ui/src/app/(operator)/integrations/itsm/_sections/ItsmConnectorConnectionSection.tsx`~~ **removed** with hub |
| ITSM hub | **Removed** `/integrations/itsm` (no next.config redirect; OAuth callback retained) |
| Cloud-neutral copy | `archlucid-ui/src/lib/cloud-neutral-primary-copy.ts` |
| Cloud connections copy | `archlucid-ui/src/lib/cloud-connections-copy.ts` |
| Secret provider | `ArchLucid.Core/Secrets/SecretProviderKind.cs` |
| Default policy packs | `ArchLucid.Application/Governance/DefaultPolicyPacks/DefaultPolicyPackCatalog.cs` |
| Wizard defaults | `archlucid-ui/src/lib/wizard-schema.ts` (`cloudProvider: "None"`) |
| Wizard inventory bias | `archlucid-ui/src/components/wizard/steps/WizardStepAzureContext.tsx` |
| Marketing use cases | `archlucid-ui/src/components/marketing/welcome-marketing-copy.ts` |
| Public leakage | `archlucid-ui/src/lib/why-comparison.ts` |
| Integration catalog truth | `docs/go-to-market/INTEGRATION_CATALOG.md` |
| Stale FAQ | `docs/library/customer-facing/FAQ.md` |

---

*End of assessment.*
