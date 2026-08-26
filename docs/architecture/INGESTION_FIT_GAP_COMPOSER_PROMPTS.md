> **Scope:** Copy-paste Composer prompts that close the highest-leverage *product-fit* gaps from architecture-review ingestion (not buyer-facing runtime docs). Internal engineering only.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Ingestion contract:** [`../library/CONTEXT_INGESTION.md`](../library/CONTEXT_INGESTION.md) · **V1 boundary:** [`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.19 / §3.

# Ingestion fit-gap — Composer prompt set

These prompts mitigate findings from the question *“why would a cloud architecture project not be well-served by ArchLucid?”* They do **not** try to make ArchLucid a CMDB, an EAM repository, an air-gapped on-prem product, or a `terraform apply` engine. Those remain explicit non-goals in [`V1_SCOPE.md`](../library/V1_SCOPE.md) §3 and [`BUYER_PERSONAS.md`](../go-to-market/BUYER_PERSONAS.md)#when-archlucid-is-not-a-fit.

**Run one prompt per chat**, in the order below unless the prompt says it can run in parallel. Name a git branch in any commit/push request. Do not expand a prompt into Pulumi, CDK, diagram OCR, PDF/DOCX ingest, or FedRAMP ATO automation.

## Findings this set actually closes

| ID | Finding | Why it is Composer-sized |
|----|---------|--------------------------|
| **FIT-01** | `simple-terraform` keeps only `resource "type" "name"` — every HCL attribute is discarded, so reviews cannot see `public_network_access`, SKU, TLS, or NSG rules from pasted `.tf`. | Parser + tests; reuse `terraform-show-json` property bag rules. |
| **FIT-02** | Azure-native shops that author **Bicep / ARM** have no IaC ingest format (ironic given the Azure ICP). | New `IInfrastructureDeclarationParser` types + validator allowlist. |
| **FIT-03** | Kubernetes-only (or AKS/EKS/GKE-as-YAML) estates cannot ingest workload manifests. | `kubectl -o json` parser; optional YAML using existing `YamlDotNet` version. |
| **FIT-04** | GTM still **disqualifies AWS/GCP-only** buyers while `V1_SCOPE.md` §2.19 promoted those targets to V1 GA and the enum comments still say “V1.1”. | Docs + XML comments only; no product lie. |
| **FIT-05** | Even after FIT-01, no finding engine reads `tf.*` attributes, so captured config still does not become review findings. | Small graph-pure engine; reuse inventory security-baseline *ideas*, not ARM `resources.json` JSON. |

## Findings this set does **not** close (leave them)

Air-gapped / sovereign self-host (ADR 0020). LLM-prohibited environments (simulator ≠ sponsor-faithful). EAM/CMDB replacement. Diagram/image OCR. ArchiMate / Structurizr import. `terraform apply`. Multi-cloud merge in one review. Certification/ATO as an output. English-only docs. Sub-500-node visualization is already paginated — do not raise `FullGraphResponseMaxNodes` here.

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| FIT-01 | Yes with FIT-02, FIT-03, FIT-04 | None |
| FIT-02 | Yes with FIT-01 / 03 / 04 | None |
| FIT-03 | Yes with FIT-01 / 02 / 04 | None |
| FIT-04 | Yes with all parser prompts | None |
| FIT-05 | **After** FIT-01 (benefits from FIT-02/03 if those landed) | FIT-01 merged or in the same branch |

**Global constraints (every prompt):**

- Tenant isolation remains database-per-tenant catalogs (ADR 0037). Do not introduce SQL RLS as the paying-client boundary.
- Each class in its own file. Prefer LINQ. Prefer concrete types over `var`. Blank line before `if` / `foreach` unless first line of method. Check nulls. No `ConfigureAwait(false)` in tests.
- Reuse existing types (`CanonicalObject`, `IInfrastructureDeclarationParser`, `InfrastructureDeclarationRequestValidator.SupportedFormats`, `ContextIngestionCompositionRegistrar`). Do not invent a second IaC DTO family.
- Do not add NuGet packages that are not already in `Directory.Packages.props`. (`YamlDotNet` **16.3.0** is already there; `ArchLucid.ContextIngestion` does not reference it yet.)
- Before editing tracked files, run `.\scripts\agent\check-working-tree-path.ps1` on those paths (or the Linux equivalent check: do not overwrite session-dirty tracked files).
- Compile with `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj'` (FIT-01–03) or the matching test project for FIT-05. One scoped compile per prompt; one retry on exit code 1.
- Stage only files this prompt changes. No `git add -A`.
- If FluentValidation messages or OpenAPI examples change, follow [`OPENAPI_CONTRACT_DRIFT.md`](../library/OPENAPI_CONTRACT_DRIFT.md). Do **not** regenerate the OpenAPI snapshot when the HTTP schema is unchanged (runtime `Must()` format lists often are not in the snapshot).
- Advisory-only Terraform emit and “never apply” (`V1_SCOPE.md` §3) stay untouched.

---

## FIT-01 — `simple-terraform` keeps resource attributes

**Closes:** pasted `.tf` / `git-terraform` intake is existence-only today.  
**Depends on:** none  
**Branch suggestion:** `cursor/simple-terraform-attributes`

### Prompt (copy below)

```text
You are working in the ArchLucid repo. Goal: make SimpleTerraformDeclarationParser capture HCL resource attributes onto CanonicalObject.Properties using the same tf.* key convention as TerraformShowJsonInfrastructureDeclarationParser, without becoming a full HCL compiler.

Why: ArchLucid currently regex-matches only resource "type" "name" (see SimpleTerraformDeclarationParser.ResourceRegex). Reviews that ingest simple-terraform therefore cannot see public_network_access, https_only, sku, TLS, or security-group rules. terraform-show-json already copies values.* into tf.* (max 24 keys, 512 chars, sensitive redaction). Pasted HCL is the common Azure/AWS/GCP author path and must not be a silent downgrade.

Do not:
- Add HashiCorp HCL / hcl2json / terraform CLI as a dependency.
- Change terraform-show-json behaviour except to extract a shared property-bag helper if that is the smallest reuse.
- Change IInfrastructureDeclarationParser.
- Raise KnowledgeGraphLimitsOptions.
- Emit findings (that is FIT-05).
- Break existing tests: terraformType is lowercased; azurerm_key_vault / aws_security_group / google_compute_firewall still map to SecurityBaseline; policy* still maps to PolicyControl.

Work:
1. Read:
   - ArchLucid.ContextIngestion/Infrastructure/SimpleTerraformDeclarationParser.cs
   - ArchLucid.ContextIngestion/Infrastructure/TerraformShowJsonInfrastructureDeclarationParser.cs (SanitizePropertyKey, 24-key cap, 512-char truncation, [REDACTED] for sensitive_values)
   - ArchLucid.ContextIngestion.Tests/SimpleTerraformDeclarationParserTests.cs
   - docs/library/CONTEXT_INGESTION.md § simple-terraform
2. Extract a small shared helper in its own file under ArchLucid.ContextIngestion/Infrastructure/ (e.g. CanonicalInfrastructurePropertyBag) that:
   - Sanitizes property keys the same way as SanitizePropertyKey (letters, digits, _ and -; other chars → _).
   - Stores values under tf.{key}.
   - Caps at 24 tf.* keys (terraformType / providerName / mode / terraformDependsOn do not count toward the 24).
   - Truncates each value at 512 characters.
   - Redacts values whose unsanitized key contains password, secret, token, connection_string, access_key, private_key, client_secret, primary_key (case-insensitive) to [REDACTED].
3. Change SimpleTerraformDeclarationParser to split Content into resource blocks (from resource "type" "name" through the matching closing brace, or through the next resource line if braces are omitted — today’s fixtures have no braces; both shapes must work).
4. Inside each block, capture top-level scalar assignments of the form key = value (quoted strings, numbers, true/false). Strip surrounding quotes on strings. Skip comments (# and //). Skip interpolation-only lines if you cannot evaluate them; do not invent values.
5. For a first-level nested block (e.g. site_config { ... } or network_rules { ... }), store at most one tf.{blockName} entry with the inner text truncated to 512 chars. Do not recurse indefinitely.
6. Keep ResolveObjectType behaviour. Always set terraformType to the lowercased provider type.
7. Unit tests in SimpleTerraformDeclarationParserTests (Suite=Core):
   - Existing casing + AWS/GCP type tests still pass.
   - A storage account block with public_network_access = "Enabled" yields tf.public_network_access == Enabled (or the quoted value without quotes).
   - https_only = true yields tf.https_only == true.
   - A password = "supersecret" assignment is [REDACTED].
   - More than 24 scalar keys still parse; terraformType is present; extra keys beyond the cap are dropped deterministically (document the order: source order).
   - A 600-char string value is truncated to 512.
   - Malformed / brace-unbalanced input does not throw; it still returns objects for well-formed resource headers (fail soft, like terraform-show-json JsonException handling).
8. Update docs/library/CONTEXT_INGESTION.md § simple-terraform to state that top-level scalars land in tf.* with the same truncation/redaction rules as terraform-show-json. Do not claim full HCL support.

Tests: dotnet test ArchLucid.ContextIngestion.Tests --filter FullyQualifiedName~SimpleTerraformDeclarationParserTests
Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj'

Done when: pasted HCL with attributes produces tf.* properties; secrets are redacted; existing type-mapping tests pass; CONTEXT_INGESTION.md no longer describes simple-terraform as header-only.
```

---

## FIT-02 — Bicep and ARM JSON infrastructure declarations

**Closes:** Azure-primary teams whose source of truth is Bicep/ARM cannot use the IaC seam (only `json` / `simple-terraform` / `terraform-show-json`).  
**Depends on:** none (can run parallel with FIT-01)  
**Branch suggestion:** `cursor/bicep-arm-ingest`

### Prompt (copy below)

```text
You are working in the ArchLucid repo. Goal: accept infrastructureDeclarations format values bicep and arm-json, parse them into CanonicalObject rows (TopologyResource / SecurityBaseline / PolicyControl) with resource type and a bounded property bag, and document the seam.

Why: The ICP is Azure-primary, but InfrastructureDeclarationRequestValidator.SupportedFormats is only json, simple-terraform, terraform-show-json. Bicep-native landing-zone teams currently have to run the deployed-state extractor ZIP or retype hints. V1_SCOPE.md §2.16 extractor stays; this prompt adds *declaration* ingest, not a new ARM poller.

Do not:
- Implement a Bicep compiler, module resolution, .bicepparam files, or subscription/management-group deployments.
- Parse Pulumi, CDK, or CloudFormation (CloudFormation is a later prompt if needed).
- Call Azure APIs.
- Change the Azure extractor ZIP path.
- Add NuGet packages.

Work:
1. Read:
   - ArchLucid.Api/Validators/InfrastructureDeclarationRequestValidator.cs
   - ArchLucid.Api.Tests/InfrastructureDeclarationRequestValidatorTests.cs
   - ArchLucid.ContextIngestion/Infrastructure/JsonInfrastructureDeclarationParser.cs
   - ArchLucid.Host.Composition/Startup/Modules/ContextIngestionCompositionRegistrar.cs
   - ArchLucid.Application/Runs/Orchestration/TechnologyLedgerCanonicalObjectMapper.cs ResolveIacTargetTechnologyName
   - ArchLucid.Application/Planning/ConnectorIntakeParserService.cs (do not force new intake Source values unless a one-line mapping is already the pattern)
   - docs/library/CONTEXT_INGESTION.md, docs/library/API_CONTRACTS.md create-run table, ArchLucid.Api/Swagger/ArchitectureRequestExamplesOperationFilter.cs
   - templates/integrations/architecture-import/README.md format list
2. Add BicepInfrastructureDeclarationParser (own file) implementing IInfrastructureDeclarationParser, CanParse("bicep"):
   - Match resource symbolicName 'Microsoft.Xxx/yyy@version' (single quotes) and resource symbolicName "Microsoft.Xxx/yyy@version" if present.
   - Object Name = symbolicName. Properties: resourceType = Microsoft.Xxx/yyy (no version), apiVersion = the version suffix, bicepSymbolicName = symbolicName.
   - Map types containing KeyVault, networkSecurityGroups, firewall, webApplicationFirewall to SecurityBaseline; policyDefinitions / policyAssignments to PolicyControl; else TopologyResource.
   - Optional: copy a few top-level properties from the following { } block using the same CanonicalInfrastructurePropertyBag helper as FIT-01 if that type already exists in the branch; otherwise a local 24×512 cap is fine.
   - Fail soft on unparseable files: return the resources you can read; do not throw.
3. Add ArmJsonInfrastructureDeclarationParser (own file), CanParse("arm-json"):
   - Parse JSON with a resources array (ARM template). Skip resources whose type is Microsoft.Resources/deployments (nested templates) rather than expanding them.
   - Name from the name property (string literals only; skip [concat(...)] names or store the expression truncated — do not evaluate ARM expressions).
   - resourceType from type. Copy a bounded set of properties.* scalars into Properties (same 24×512 cap). Prefer keys publicNetworkAccess, minimumTlsVersion, allowBlobPublicAccess, httpsOnly when present.
4. Register both parsers in ContextIngestionCompositionRegistrar next to the existing three.
5. Add bicep and arm-json to InfrastructureDeclarationRequestValidator.SupportedFormats (case-insensitive). Extend InfrastructureDeclarationRequestValidatorTests InlineData.
6. TechnologyLedgerCanonicalObjectMapper.ResolveIacTargetTechnologyName: map bicep → Bicep, arm-json → ARM template. Keep default for unknown formats.
7. Tests (new files, Suite=Core) covering: one storage account + one Key Vault in Bicep; ARM JSON resources array; nested deployments skipped; invalid JSON returns empty or warning without throw; validator rejects neither new format.
8. Docs: CONTEXT_INGESTION.md new subsections; API_CONTRACTS.md format list (today it still omits terraform-show-json — include all supported formats); ArchitectureRequestExamplesOperationFilter; templates/integrations/architecture-import/README.md 400-row. Honest: “not a Bicep compiler; modules and parameter files are out of scope.”

Tests: ArchLucid.ContextIngestion.Tests + ArchLucid.Api.Tests filter ~InfrastructureDeclaration
Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj' then, if validator changed, ArchLucid.Api.Tests.

OpenAPI: only regenerate the contract snapshot if OpenApiContractSnapshotTests fail. Runtime format allowlists often do not appear in the schema.

Done when: POST architecture request can include format bicep or arm-json; Key Vault rows are SecurityBaseline; docs list the formats; no new NuGet packages.
```

---

## FIT-03 — Kubernetes JSON (and optional YAML) declarations

**Closes:** Kubernetes-only or Helm-exported-manifest projects have no ingest path (AKS/EKS/GKE *policy packs* exist; parsers do not).  
**Depends on:** none  
**Branch suggestion:** `cursor/k8s-declaration-ingest`

### Prompt (copy below)

```text
You are working in the ArchLucid repo. Goal: accept infrastructureDeclarations format kubernetes-json (required) and kubernetes-yaml (optional, only if you add the existing YamlDotNet 16.3.0 package reference to ArchLucid.ContextIngestion.csproj from Directory.Packages.props). Parse kubectl-style lists/objects into CanonicalObject topology/security rows.

Why: CloudProvider has no Kubernetes value; AKS/EKS/GKE policy packs cannot run against workload YAML because nothing lands on the graph. kubectl get … -o json is the zero-new-compiler path. Do not parse Helm charts, Kustomize overlays, or CRD schemas.

Do not:
- Add a CloudProvider.Kubernetes enum value (out of scope; would churn contracts).
- Execute kubectl or talk to a cluster.
- Introduce a YAML library other than the repo’s YamlDotNet 16.3.0.
- Treat image pull secrets’ .data as ingestible — redact/omit Secret data entirely.

Work:
1. KubernetesJsonInfrastructureDeclarationParser (own file):
   - CanParse("kubernetes-json").
   - Accept a single JSON object (one resource) or a List kind with items[].
   - Name = metadata.namespace/metadata.name when namespace present, else metadata.name.
   - Properties: k8s.kind, k8s.apiVersion, k8s.namespace, k8s.name. Optional k8s.labels truncated.
   - ObjectType: NetworkPolicy, Role, ClusterRole, RoleBinding, ClusterRoleBinding, ServiceAccount, Ingress → SecurityBaseline; Secret → SecurityBaseline with no data payload; everything else with a kind → TopologyResource.
   - Fail soft on non-JSON.
2. Optional KubernetesYamlInfrastructureDeclarationParser: split on --- documents; deserialize each to JSON-equivalent and reuse the JSON mapper (shared helper in its own file). If you skip YAML in this PR, document kubernetes-yaml as not implemented and do not add it to the validator.
3. Validator SupportedFormats + tests; DI registration; TechnologyLedgerCanonicalObjectMapper label (Kubernetes).
4. Unit tests: a Deployment + a NetworkPolicy + a Secret (assert Secret data keys are absent); List wrapper; empty items.
5. CONTEXT_INGESTION.md + API_CONTRACTS.md format lists. Honest non-goals: Helm, Kustomize, live cluster.

Tests: ArchLucid.ContextIngestion.Tests filter ~Kubernetes
Compile: scoped ContextIngestion.Tests compile check.

Done when: a kubectl get deploy,ns,netpol -o json dump produces topology + security canonical objects without secret material.
```

---

## FIT-04 — Tell the truth about AWS/GCP fit

**Closes:** three contradictory sources of “is AWS/GCP in V1?” that cause GTM to walk away from in-scope buyers *and* over-promise to others.  
**Depends on:** none  
**Branch suggestion:** `cursor/aws-gcp-fit-honesty`

### Prompt (copy below)

```text
You are working in the ArchLucid repo. Goal: make AWS/GCP product-fit copy match shipped code and V1_SCOPE.md §2.19, without claiming Azure-depth costing or a unified multi-cloud graph.

Why: CloudProvider.cs still says Aws/Gcp are “Phase 1 intent capture; deep cloud-aware analysis ships in V1.1.” BUYER_PERSONAS.md lists AWS-only or GCP-only as a hard V1 disqualifier and scores it 0 in the ICP matrix. COMPETITIVE_LANDSCAPE.md still lists AWS-primary under worst-fit and “cannot analyze AWS architectures in V1.” POSITIONING.md messaging table still says “Be honest about V1 limitations (Azure-only, no import connectors yet).” V1_SCOPE.md §2.19 (2026-07-05) promoted AWS/GCP-target analysis to V1 GA, with remaining work called out (classification/costing/agent context/Tier 1 ZIP). TB-402/TB-403 Tier 2 polling shipped. The enum comment and GTM disqualifier are stale in opposite directions.

Do not:
- Claim live AWS/GCP pricing beyond what the code does (EC2 on-demand and GCE machine types; other SKUs are heuristic; CLI pricingMode is illustrative).
- Remove the explicit non-goal “single review merging Azure + AWS + GCP graphs.”
- Remove Azure-primary as the *strongest* ICP (it can stay Strong fit). Change AWS/GCP-only from Disqualifier / score 0 to Weak or Moderate with an honest caveat.
- Rewrite the whole COMPETITIVE_LANDSCAPE.md. Patch the false “cannot analyze AWS in V1” and worst-fit bullets only.
- Touch policy packs, extractors, or pricing clients.

Work:
1. ArchLucid.Contracts/Common/CloudProvider.cs — update Aws and Gcp XML comments to: V1 GA target-cloud analysis (inventory ZIP / Tier 2 poll / Terraform ingest). Deepest costing and classification still Azure; live public pricing is EC2 on-demand / GCE machine types with heuristic fallback. Not a host platform (ADR 0020).
2. docs/go-to-market/BUYER_PERSONAS.md:
   - Firmographic “Cloud posture” row: Azure-primary remains ideal; AWS/GCP-target is in V1 with thinner cost/classification — do not say “poor fit until multi-cloud support ships.”
   - Disqualifiers table: remove or rewrite the AWS-only or GCP-only row. New reason if kept as caution (not disqualifier): heuristic costing and Azure-skewed object classification; require terraform-show-json or inventory ZIP for a useful review.
   - ICP scoring Cloud posture “0 (Disqualifier)” cell: do not disqualify AWS/GCP only. Move that score to “no cloud evidence and no IaC.”
   - Decision tree Q2: do not send AWS/GCP workloads to a “contact us about roadmap” dead end. Say V1 can review AWS/GCP-target architectures; Azure remains the deepest path; expect illustrative cost on non-compute SKUs.
3. docs/go-to-market/COMPETITIVE_LANDSCAPE.md — worst-fit and AWS WAT head-to-head: delete “cannot analyze AWS architectures in V1.” Replace with: AWS-native WAT remains lower friction inside AWS Console; ArchLucid AWS-target reviews need Terraform JSON or inventory ZIP and do not match Azure cost-catalog depth.
4. docs/go-to-market/POSITIONING.md §7 Don’t column: replace “Azure-only, no import connectors yet” with current truth (Azure-hosted product; AWS/GCP-target analysis in V1; IaC ingest is json / simple-terraform / terraform-show-json; Bicep/ARM/K8s only if those prompts have already shipped — do not document formats that are not in SupportedFormats yet).
5. If DIFFERENTIATION_PROOF_PACKET or QUOTE_TO_PROOF_PACKET still say “multi-cloud-first review with no Azure primary” as a hard not-a-fit, soften to “Azure-primary is still the strongest path; AWS/GCP-target works with inventory or Terraform evidence; unified multi-cloud graph in one review is not offered.”
6. Keep V1_SCOPE.md §2.19 remaining-work bullets. Do not mark Phases 1–2 complete in this prompt.

Done when: grep for “cannot analyze AWS” and “AWS-only or GCP-only” as a disqualifier returns only historical archive docs (docs/archive/) or a sentence that says the old row was retired. CloudProvider XML comments no longer mention V1.1 for Aws/Gcp.
```

---

## FIT-05 — Declaration-attribute security findings (after FIT-01)

**Closes:** captured `tf.*` / `resourceType` properties never become findings, so FIT-01 would only improve the graph, not the architecture package.  
**Depends on:** FIT-01 (merge or same branch). FIT-02/FIT-03 improve coverage if present.  
**Branch suggestion:** `cursor/declaration-security-findings`

### Prompt (copy below)

```text
You are working in the ArchLucid repo. Goal: add a graph-pure IFindingEngine that emits deterministic security findings from CanonicalObject / graph node properties produced by infrastructure declaration parsers (tf.public_network_access, tf.https_only, allowBlobPublicAccess, k8s.kind=NetworkPolicy absence is NOT in scope). Keep inventory ARM resources.json classifiers unchanged.

Why: AzureInventorySecurityBaselineClassifier already flags blob public access, open NSG admin ingress, and weak SQL TLS on extractor JSON. Declaration-ingested graphs never hit that classifier. After FIT-01, simple-terraform can carry tf.public_network_access and still produce zero findings. This engine closes that last mile for the IaC seam.

Do not:
- Duplicate AzureInventorySecurityBaselineClassifier JSON parsing.
- Call LLMs. No I/O.
- Put engine identity into ManifestHash.
- Treat missing attributes as a finding (explicit non-conclusion / skip). Only fire when the property is present and unsafe.
- Flag every public IP as critical. Start with a small documented check list.

Work:
1. Read AzureInventorySecurityBaselineClassifier (ideas only), SecurityBaselineFindingEngine, BuiltInFindingEngineTypeCatalog, ServiceCollectionExtensions.Decisioning registration, FINDING_ENGINE_OUTPUT_REFERENCE.md, EK-02 skip-set tests.
2. New types, each in its own file:
   - A pure function DeclarationSecurityBaselineClassifier that accepts IReadOnlyList of a small input record (objectType, name, terraformType or resourceType, IReadOnlyDictionary properties) and returns finding tuples (title, severity, evidence keys).
   - DeclarationSecurityBaselineFindingEngine : IFindingEngine with EngineType declaration-security-baseline.
3. Checks (v1 list — document in XML comments; do not silently grow):
   - Storage: tf.public_network_access or publicNetworkAccess or allowBlobPublicAccess is Enabled / true / Allow (case-insensitive) → High, data-protection.
   - App service / Function: tf.https_only or httpsOnly is false → Medium.
   - SQL / PostgreSQL: tf.public_network_access Enabled or tf.ssl_enforcement_enabled false → High.
   - NSG / aws_security_group / google_compute_firewall: if a tf.ingress or tf.network_rules blob contains 0.0.0.0/0 and 22 or 3389 → High, network-isolation. Heuristic string contains is acceptable; comment that it is heuristic.
4. Register the engine. Add EngineType to BuiltInFindingEngineTypeCatalog. ImplementationTypeNameToEngineType. Update any architecture test that asserts skip set == registered engines (EK-02).
5. Unit tests: unsafe storage attribute fires once; missing attribute does not fire; redacted secrets do not appear in finding titles; two resources yield two findings; empty graph yields empty list.
6. FINDING_ENGINE_OUTPUT_REFERENCE.md: new row, effectful=no, inputs=declaration properties.

Tests: Decisioning and/or Application finding-engine tests + Architecture.Tests skip-set if present.
Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath matching the new test project.

Done when: a simple-terraform storage account with public_network_access = "Enabled" produces a declaration-security-baseline finding in unit tests; inventory classifiers are untouched.
```

---

## How to use

1. Paste **one** fenced prompt into a new Composer chat.
2. If FIT-01 and FIT-05 will ship together, run FIT-01 first, merge, then FIT-05 — or keep both on one branch only if the first prompt is already green.
3. After each prompt: scoped tests + compile check; update this file’s sequencing table only if you split or drop a prompt.
4. Do not mark air-gap, apply, or EAM-replacement gaps as closed.
