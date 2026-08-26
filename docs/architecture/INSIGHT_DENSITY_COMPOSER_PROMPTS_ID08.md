> **Scope:** Copy-paste Composer prompts that raise **Decision-Changing Insight Density** (assessment pillar 1, weight 13) *after* ID-01–07. Internal engineering only — not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Predecessor (SHIPPED):** [`INSIGHT_DENSITY_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_COMPOSER_PROMPTS.md) · **Fresh scores:** [`../assessments/LATEST_GPT55.md`](../assessments/LATEST_GPT55.md) §7.1 / §17 items 2–3, 9

# Insight density — Composer prompt set ID-08 through ID-11

**Created:** 2026-08-26 · **Status:** ID-08, ID-09, and ID-10 **SHIPPED on `master`.** Do **not** re-run them. Remaining policy-pack work (buyer packs other than `cis-az-*` still fail-open on declaration engines) is [`POLICY_PACK_MOAT_COMPOSER_PROMPTS.md`](POLICY_PACK_MOAT_COMPOSER_PROMPTS.md) **PP-01**. ID-11 (advisory density labeling) may still be open via [`WEAKNESS_REMEDIATION_COMPOSER_PROMPTS.md`](WEAKNESS_REMEDIATION_COMPOSER_PROMPTS.md) (WK-15 wraps ID-11; do not add coverage engines).

**Do not re-run ID-01 through ID-07.** They shipped on `master` (frontier-delta harness, per-engine distribution, multi-cloud generic patterns, judge coverage + cap, open-commitment / portfolio-recurrence / premise-conflict engines, tenant admin card). Treat [`INSIGHT_DENSITY_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_COMPOSER_PROMPTS.md) as an archive.

## Master does **not** need to be green first

These prompts target `ArchLucid.ContextIngestion`, `ArchLucid.Core`, `ArchLucid.Decisioning`, and their test projects. Decisioning is already green (808 tests). They do **not** touch `archlucid-ui`, OpenAPI, SQL DDL, or the 12 currently-failing backend tests.

**Land every prompt on a feature branch. Do not push to `master`.** Concurrent trunk checkins are cleaning the UI build and those 12 tests; merging this work later is the point. Suggested Cloud Agent branch shape: `cursor/<short-name>-9750`. Name the branch in any commit/push request (repo rule: `Git-Commit-Requires-Branch`).

A filter still raises **precision**, never **density**. Do **not** add a finding engine that only re-reads `GraphSnapshot`. Do **not** start a resilience/DR/IAM/observability/capacity engine — that waits on **G-REAL-06**. Do **not** capture live frontier transcripts. Do **not** remove `typed-engine-protected` (owner decision, assessment §17 item 9).

## The remaining hole these prompts close

ID-05/06/07 generate from non-graph sources. The 2026-08-26 assessment still scores the pillar at **62** because:

| Hole | Evidence | Prompt | Status |
|------|----------|--------|--------|
| Bicep and Kubernetes ingest topology but not the properties declaration engines read | (historical) | **ID-08** | **SHIPPED** |
| Policy-pack filtering (the real moat) has no system-level regression | `GoldenCorpusHarness.CreateEngines()` still constructs `FileComplianceRulePackProvider`; sibling test now exists | **ID-09** | **SHIPPED** (`PolicyFilteredGoldenCorpusTests`) |
| Only CIS Azure keys gated declaration engines | `DeclarationSignalPolicyKeyMap` maps `cis-az-*` / `sec-base-028`; other prefixes fail-open | **ID-10** then **PP-01** | ID-10 **SHIPPED**; remaining fail-open is [`POLICY_PACK_MOAT_COMPOSER_PROMPTS.md`](POLICY_PACK_MOAT_COMPOSER_PROMPTS.md) |
| Density scores for typed engines are computed then discarded | `typed-engine-protected` still bypasses demotion | **ID-11** | honesty / labeling |

**ID-08 is the only prompt in this set that raises density.** ID-09 guards the compliance moat. ID-10 packaged CIS Azure declaration findings. **PP-01** (separate file) is the remaining pack work. ID-11 stops us from mistaking advisory scores for control.

---

## Sequencing

| Prompt | Title | Parallel? | Depends on | Density effect |
|--------|-------|-----------|------------|----------------|
| **ID-08** | Bicep/K8s property extraction + classifier key aliases | Yes with ID-09/11 | none | **Generative** — same engines, new information source |
| **ID-09** | Policy-filtered golden-corpus case | Yes with ID-08/11 | none | None (guards the moat) |
| **ID-10** | Declaration/security-baseline policy vocabulary | No | ID-08 merged (needs the new keys to be worth filtering) | Packaging — tenant pack changes which declaration findings fire |
| **ID-11** | Advisory-only labeling of density distribution | Yes with ID-08/09 | none | None (honesty) |

**Run one prompt per chat.** Feature branch per prompt. Do not batch ID-08 and ID-10 in one PR — ID-10's filter tests need ID-08's keys to exist.

---

## Global constraints (paste into every prompt if Composer drops context)

- **Repo conventions:** each class in its own file; prefer LINQ over `foreach` unless it degrades performance; prefer concrete types over `var`; one blank line before `if` / `foreach` unless it is the first line of a method; always check nulls; comment anything a developer with two years' experience would not follow; **no `ConfigureAwait(false)` in tests**.
- **Tenant isolation** stays database-per-tenant catalogs (ADR 0037). Do not introduce SQL RLS as the paying-client boundary.
- **Branch:** create/use a feature branch. **Do not commit or push to `master`.** Stage only the files the prompt changed. **No `git add -A`.**
- Before editing tracked files, run `.\scripts\agent\check-working-tree-path.ps1 -Path '…'` (or confirm those paths were clean at session start).
- **No new finding engine** unless the prompt explicitly requires one. ID-08/09/11 add none. ID-10 reuses `declaration-security-baseline` and `declaration-premise-conflict`.
- **No new NuGet packages** unless already in `Directory.Packages.props`.
- **Do not regenerate the OpenAPI snapshot** when the HTTP wire schema is unchanged. If ID-10 is tempted to add a field on `PolicyPackContentDocument`, **stop** — reuse `complianceRuleKeys` instead.
- **Do not add persisted columns or `FindingsSnapshot` contract fields.**
- **Do not touch `archlucid-ui`.** Trunk UI is independently broken; mixing UI fixes into these PRs hides insight-density review.
- One scoped compile per prompt; one retry on exit code 1. Use `.\scripts\ci\agent-compile-check.ps1 -ProjectPath '…'`.
- Do not start **TB-885**, **TB-2033**–**TB-2037**, **TB-883**, **G-REAL-06**, SOC 2 CPA, or third-party pen test from this document.

---

# ID-08 — Bicep / Kubernetes properties into declaration classifiers

**Closes:** Azure-native and Kubernetes-first intake produces topology nodes and near-zero declaration-security findings. The gap is silent (parse gaps log a warning and return an empty list). This is simultaneously the top insight-density fix and the top first-review time-to-value fix remaining after ID-01–07.
**Depends on:** none
**Branch suggestion:** `cursor/bicep-k8s-declaration-properties-9750`

### Design intent (read before prompting)

Three bugs compose into one silent miss. Fix all three in this prompt or Bicep extraction is a no-op:

1. **Bicep does not read the resource body.** `BicepInfrastructureDeclarationParser` regex-matches `resource name 'type@version'` and stores only `resourceType`, `bicepSymbolicName`, `apiVersion`.
2. **Kubernetes stores metadata only.** `KubernetesManifestCanonicalObjectMapper` writes `k8s.kind` / `k8s.apiVersion` / `k8s.name` / `k8s.namespace`. Spec fields never land. YAML and JSON parsers share this mapper.
3. **Classifier keys do not match the bag.** `CanonicalInfrastructurePropertyBag.TryAddTfProperty("publicNetworkAccess", "Enabled")` writes `tf.publicnetworkaccess` (sanitize keeps letters, then `ToLowerInvariant` — camelCase loses word boundaries). Classifiers look up `tf.public_network_access` and unprefixed `publicNetworkAccess`. ARM JSON already hits this miss: `ArmJsonInfrastructureDeclarationParser.CopyBoundedProperties` only calls `TryAddTfProperty` / `TryAddTfJsonProperty`, so ARM `publicNetworkAccess` becomes `tf.publicnetworkaccess` and is invisible to `DeclarationSecurityBaselineClassifier` and `DeclarationPremiseConflictClassifier`. Hunt-ready row in `docs/library/AL_BUG_HUNT_LEDGER.md` (~1644) already names this.

Do **not** add a Bicep compiler, Helm, Kustomize, or a new finding engine. Reuse `declaration-security-baseline` and `declaration-premise-conflict`.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: make Bicep and Kubernetes declarations populate the property keys that DeclarationSecurityBaselineClassifier and DeclarationPremiseConflictClassifier already consume, and make those classifiers actually resolve the keys CanonicalInfrastructurePropertyBag writes.

Why: BicepInfrastructureDeclarationParser extracts only the declaration line (resourceType / bicepSymbolicName / apiVersion). KubernetesManifestCanonicalObjectMapper stores only k8s.* metadata. DeclarationSecurityBaselineClassifier looks up tf.public_network_access and ARM publicNetworkAccess. CanonicalInfrastructurePropertyBag.TryAddTfProperty lowercases sanitized keys, so publicNetworkAccess becomes tf.publicnetworkaccess — which neither classifier reads. ARM JSON already has this silent miss. Azure-native and Kubernetes-first first reviews therefore look complete (topology nodes exist) and find almost nothing.

This is a new information source for existing engines, not a new engine. Do not add an IFindingEngine.

Read first:
- ArchLucid.ContextIngestion/Infrastructure/BicepInfrastructureDeclarationParser.cs
- ArchLucid.ContextIngestion/Infrastructure/KubernetesManifestCanonicalObjectMapper.cs
- ArchLucid.ContextIngestion/Infrastructure/CanonicalInfrastructurePropertyBag.cs (TryAddTfProperty, TryAddTfBlockProperty, MaxTfPropertyCount=24, MaxPropertyValueLength=512, ShouldRedactKey)
- ArchLucid.ContextIngestion/Infrastructure/ArmJsonInfrastructureDeclarationParser.cs (CopyBoundedProperties — the ARM path that already writes tf.publicnetworkaccess)
- ArchLucid.ContextIngestion/Infrastructure/SimpleTerraformResourceBlockParser.cs (brace-depth body scan to reuse, not a Bicep compiler)
- ArchLucid.ContextIngestion.Tests/BicepInfrastructureDeclarationParserTests.cs
- ArchLucid.ContextIngestion.Tests/KubernetesJsonInfrastructureDeclarationParserTests.cs
- ArchLucid.ContextIngestion.Tests/KubernetesYamlInfrastructureDeclarationParserTests.cs
- ArchLucid.Decisioning/Analysis/DeclarationSecurityBaselineClassifier.cs
- ArchLucid.Decisioning/Analysis/DeclarationPremiseConflictClassifier.cs (TryGetDeclarationProperty)
- ArchLucid.Core — put the shared alias resolver here; both ContextIngestion and Decisioning already reference Core.

Work:

1. Create ArchLucid.Core/Findings/DeclarationSecurityPropertyKeyResolver.cs — public static class, each helper type in its own file if you add records.

   Purpose: one lookup that returns (canonicalKey, value) from a node property bag trying, in order:
   - exact requested key
   - tf.{snake_case}
   - tf.{compact lowercase with no underscores}  // what TryAddTfProperty writes for camelCase
   - unprefixed ARM camelCase (publicNetworkAccess, allowBlobPublicAccess, httpsOnly, minimumTlsVersion)

   Known aliases to encode (comment why each exists — bag compaction vs Terraform snake vs ARM camelCase):
   - public network: tf.public_network_access, tf.publicnetworkaccess, publicNetworkAccess
   - blob public: tf.allow_blob_public_access, tf.allowblobpublicaccess, allowBlobPublicAccess
   - https only: tf.https_only, tf.httpsonly, httpsOnly, tf.supports_https_traffic_only, tf.supportshttpstrafficonly, supportsHttpsTrafficOnly
   - TLS: tf.minimum_tls_version, tf.minimumtlsversion, minimumTlsVersion, tf.min_tls_version, minTlsVersion
   - SQL SSL: tf.ssl_enforcement_enabled, tf.sslenforcementenabled
   - ingress blobs: tf.ingress, tf.network_rules, tf.networkrules

   Add a public method TryGet(IReadOnlyDictionary<string,string> properties, string logicalName, out string? canonicalKey, out string? value) and a small enum or const string set for logical names (PublicNetworkAccess, AllowBlobPublicAccess, HttpsOnly, MinimumTlsVersion, SslEnforcementEnabled, IngressBlob).

   Unit-test this in ArchLucid.Core.Tests BEFORE changing the classifiers, with cases for each alias form. Null/blank properties => false. Prefer concrete types, check nulls, no ConfigureAwait(false).

2. Rewrite DeclarationSecurityBaselineClassifier property reads to go through the resolver. Keep the four existing signal families and their titles/severities/themes. Do NOT change title strings for the existing Terraform snake_case path — golden and unit tests that assert those titles must still pass.

   Same for DeclarationPremiseConflictClassifier.TryGetDeclarationProperty and HasPublicNetworkProperty.

3. Create ArchLucid.ContextIngestion/Infrastructure/BicepResourceBodyParser.cs (own file). Line/body scanner, not a compiler:
   - From a resource match, take the substring starting at the first `{` after `=` and extract the matching brace-depth body. Reuse the depth-counting idea in SimpleTerraformResourceBlockParser.ExtractNestedBlockBody; do not copy-paste a second ad-hoc counter if you can share a small brace extractor in its own file under Infrastructure/.
   - Parse `key: value` scalars (Bicep, not HCL `=`). Unquote strings. Skip `//` comments, empty lines, and any value containing `${` (interpolation — too easy to misread).
   - Flatten one `properties: { ... }` block into the bag (that is where ARM resource properties live in Bicep). Also flatten `siteConfig: { ... }` / `site_config` scalars when present (minTlsVersion).
   - Nested blocks that are not properties/siteConfig: store via CanonicalInfrastructurePropertyBag.TryAddTfBlockProperty so network rules / sku blobs can hit the ingress heuristic.
   - Honor MaxTfPropertyCount and MaxPropertyValueLength and ShouldRedactKey by calling the existing bag helpers. Do not reimplement caps.
   - Dual-write: after a successful TryAddTfProperty for a key the resolver knows, also set the unprefixed ARM camelCase alias on the same dictionary when the logical name matches (publicNetworkAccess, allowBlobPublicAccess, httpsOnly, minimumTlsVersion). Comment that this is so classifiers and ARM-shaped graph nodes share one key space. Skip dual-write for redacted keys.

4. Wire BicepInfrastructureDeclarationParser to parse the body for each resource match. Existing tests (empty `= { }` bodies, quoted-symbolic-name ignore, stable ObjectId) must stay green. ObjectId identity must NOT include property values — identity stays resourceType|symbolicName.

5. Fix ARM CopyBoundedProperties the same way: after TryAddTfProperty for a known security key, dual-write the ARM camelCase alias. Split the tests — `ArchLucid.ContextIngestion.Tests` does **not** reference Decisioning, so do not call the classifier from the ARM parser test:
   - ArmJson parser test: `publicNetworkAccess: "Enabled"` is visible both as `tf.publicnetworkaccess` AND `publicNetworkAccess`.
   - Decisioning classifier test: a bag containing only `tf.publicnetworkaccess=enabled` (no snake_case key) emits the public-access signal. This closes hunt-ready `AL_BUG_HUNT_LEDGER.md` ~1644, not only the Bicep path.

6. KubernetesManifestCanonicalObjectMapper — project security-relevant spec fields as k8s.* keys (do NOT force them through tf.*):
   - Pod/Deployment/StatefulSet/DaemonSet/Job/CronJob: walk spec.template.spec (or spec for Pod) for hostNetwork, and for each container/initContainer: securityContext.privileged, runAsNonRoot, readOnlyRootFilesystem, allowPrivilegeEscalation. If any container is privileged=true, set k8s.privileged=true. If any container has allowPrivilegeEscalation=true, set k8s.allowPrivilegeEscalation=true. If hostNetwork is true, set k8s.hostNetwork=true. If EVERY container that has the field sets runAsNonRoot=true, set k8s.runAsNonRoot=true; if any explicitly false, set k8s.runAsNonRoot=false.
   - NetworkPolicy: set k8s.networkPolicyIngress=true when spec.ingress is a non-empty array; k8s.networkPolicyEgress=true analogously. Presence, not a full policy compiler.
   - Service: set k8s.serviceType from spec.type (lowercase).
   - Secret: keep the existing early-return that omits data. Add a regression assertion that spec-projection does not start copying Secret.data. Do not ingest stringData either.
   - Still honor a small cap: at most 24 k8s.* keys beyond the existing metadata four, values truncated to 512 chars. Reuse CanonicalInfrastructurePropertyBag.MaxPropertyValueLength; put the k8s count helper next to the mapper or on the bag as CountK8sProperties if that is the smaller reuse.

   YAML and JSON parsers must both pick this up because they share the mapper. Add tests in BOTH KubernetesJsonInfrastructureDeclarationParserTests and KubernetesYamlInfrastructureDeclarationParserTests.

7. Extend DeclarationSecurityBaselineClassifier with new signal families (new themes, new titles) so K8s keys produce findings. Keep Terraform/ARM signals unchanged:
   - k8s.privileged=true → Error, theme "workload-isolation", title names the resource and "privileged container"
   - k8s.hostNetwork=true → Warning, theme "network-isolation"
   - k8s.allowPrivilegeEscalation=true → Warning, theme "workload-isolation"
   - k8s.serviceType=loadbalancer → Warning, theme "data-protection" (public exposure). Do not fire on ClusterIP/NodePort.
   - Privileged is enough; do not also demand a NetworkPolicy absence check in this prompt (absence is a coverage finding and we are not adding engines).

   Extend DeclarationPremiseConflictClassifier intent matching for the new themes using the existing conservative lexical phrases plus:
   - privileged / hostNetwork / allow privilege escalation → "restricted workload" / "no privileged" / "pod security" / "restricted pss" / "restricted pod security"
   - LoadBalancer → the existing private-network phrases
   Bias to false negatives. Do not match negated intent ("do not disable public") — if you touch IntentMatchesConflictKind, add a test that a requirement containing "do not disable public" does NOT fire PrivateNetworkConflictKind (hunt-ready ~1645). If that is larger than this prompt, leave the phrase matcher untouched and note it.

8. Tests (no ConfigureAwait(false)):
   - ArchLucid.Core.Tests: resolver alias matrix.
   - ArchLucid.ContextIngestion.Tests: Bicep body with publicNetworkAccess: 'Enabled' and allowBlobPublicAccess: true yields both tf.* compacted keys and ARM aliases; interpolation skipped; redacted keys not dual-written; empty body still parses the resource. ObjectId must stay independent of property values (identity is already resourceType|symbolicName). Assert two Bicep files that differ only in publicNetworkAccess keep the same ObjectId. Do not reference ArchLucid.Decisioning from this test project.
   - ArchLucid.ContextIngestion.Tests: K8s Deployment privileged:true; Service type LoadBalancer; Secret still has no data/stringData keys; YAML and JSON agree on keys.
   - ArchLucid.Decisioning.Tests: classifier emits existing Terraform snake_case signals unchanged; emits on tf.publicnetworkaccess; emits on publicNetworkAccess; emits on Bicep-shaped combined bag; emits new K8s signals; no signal on ClusterIP; premise-conflict still quotes both sides for a private-only SecurityBaseline vs publicNetworkAccess.
   - Do not add a new engine to Decisioning `GoldenCorpusHarness.CreateEngines()` (declaration-security-baseline is not one of the six, so a decisioning case-NN would not see these properties).
   - DO add ingestion golden cases. `tests/golden-corpus/ingestion/` currently has case-01..07, all Terraform-show-json except case-03 (document). `IngestionGoldenCorpusRegressionTests` hard-codes the Terraform parser. Extend `IngestionInfrastructureDeclarationInput` with an optional `content` string (Bicep/K8s source text; `terraformDocument` stays for show-json). Add `case-08` (Bicep storage account with `publicNetworkAccess: 'Enabled'` in the properties block) and `case-09` (K8s Deployment `privileged: true` + Service `type: LoadBalancer`). Dispatch in the regression test by `format` (`bicep` → `BicepInfrastructureDeclarationParser`, `kubernetes-json` or `kubernetes-yaml` → the matching K8s parser). Next index only; do not rewrite case-01..07 expected files. Each new case needs `input.json`, `expected-output.json`, and `README.md`.

9. Docs:
   - docs/library/CONTEXT_INGESTION.md: Bicep bodies and K8s spec fields now feed declaration-security-baseline / declaration-premise-conflict. State the alias compaction. State Secret.data is still omitted.
   - docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md: mention k8s.* in the declaration-security-baseline row.
   - Close or annotate the hunt-ready classifier-key row in docs/library/AL_BUG_HUNT_LEDGER.md as proven/fixed if you actually made ARM tf.publicnetworkaccess visible.

Do not:
- Add a Bicep compiler, ARM template expansion, Helm, Kustomize, Pulumi, or CDK.
- Add a new IFindingEngine or IEffectfulFindingEngine.
- Raise KnowledgeGraphLimitsOptions.
- Ingest Kubernetes Secret.data / stringData.
- Change Terraform simple-terraform or terraform-show-json behaviour except dual-write of known ARM aliases if those parsers already emit compacted keys that classifiers miss — if simple-terraform already writes tf.public_network_access (snake), leave it.
- Touch archlucid-ui, OpenAPI, SQL, FindingsSnapshot, or master.
- Demote typed-engine-protected findings.

Compile check: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj'
(and a second scoped compile only if you must: ArchLucid.Decisioning.Tests / ArchLucid.Core.Tests — do not full-solution build)

Test:
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~DeclarationSecurityPropertyKey"
dotnet test ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj --filter "FullyQualifiedName~BicepInfrastructure|FullyQualifiedName~KubernetesJson|FullyQualifiedName~KubernetesYaml|FullyQualifiedName~ArmJson"
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~DeclarationSecurityBaseline|FullyQualifiedName~DeclarationPremiseConflict"

Done when: a Bicep fixture with publicNetworkAccess: 'Enabled' yields a declaration-security finding; a K8s fixture with privileged: true yields a privileged-container finding; an ARM JSON fixture with publicNetworkAccess Enabled now yields a finding (the pre-existing silent miss); existing Terraform snake_case tests still pass; no new engine was registered.
```

---

# ID-09 — Policy-filtered golden-corpus case

**Closes:** the policy-pack moat (`PolicyFilteredComplianceRulePackProvider` → `ComplianceRulePackGovernanceFilter`) has unit tests but no system-level regression. `GoldenCorpusHarness` constructs `FileComplianceRulePackProvider` directly, so a refactor that turns `Filter` into identity would not fail CI. This does not raise density; it stops the one engine that *is* tenant-specific from silently going generic.
**Depends on:** none (parallel with ID-08)
**Branch suggestion:** `cursor/policy-filter-golden-corpus-9750`

### Design intent (read before prompting)

Do **not** replace the six-engine harness path. Add a sibling test that runs **one fixed graph twice** through `ComplianceFindingEngine` with two `PolicyPackContentDocument` values, asserting a committed delta.

You do not need Persistence or `IEffectiveGovernanceLoader`. `ComplianceRulePackGovernanceFilter` already lives in `ArchLucid.Core` (Decisioning wrapper delegates to it). Load the file pack, filter in-memory, inject via a test-only `IComplianceRulePackProvider`.

Empty `complianceRuleIds` AND empty `complianceRuleKeys` means "do not narrow by key" (see `ArchLucid.Core/Governance/PolicyPacks/ComplianceRulePackGovernanceFilter.cs`). The two postures must both be **non-empty key sets** that differ, otherwise both path through the identity branch and the test cannot fail when Filter is stubbed.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add a golden-corpus-style regression that proves ComplianceRulePackGovernanceFilter changes FindingsSnapshot output, without changing production filter behavior and without replacing GoldenCorpusHarness.CreateEngines().

Why: PolicyFilteredComplianceRulePackProvider is the rubric's "Excellent" differentiability path — tenant-enabled rules change which of 791+ rules evaluate. GoldenCorpusHarness currently does `new FileComplianceRulePackProvider(loader)` and never calls Filter. Unit tests on the filter exist; a system-level regression does not. If Filter is stubbed to return its input unchanged, CI today still passes.

Read first:
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusHarness.cs (CreateEngines — do not change the six-engine default list)
- ArchLucid.Core/Governance/PolicyPacks/ComplianceRulePackGovernanceFilter.cs (empty ids+keys = no key narrowing; then priority floor)
- ArchLucid.Decisioning/Governance/PolicyPacks/ComplianceRulePackGovernanceFilter.cs (wrapper)
- ArchLucid.Decisioning/Services/ComplianceFindingEngine.cs
- ArchLucid.Decisioning/Compliance/Loaders/FileComplianceRulePackProvider.cs
- ArchLucid.Decisioning/Compliance/Loaders/FileComplianceRulePackLoader.cs
- ArchLucid.Persistence.Tests/PersistencePackageCoverageBatchRc24Tests.cs (existing filter unit coverage — do not duplicate; this prompt is end-to-end findings)
- docs/library/DECISIONING_GOLDEN_CORPUS.md (case-NN rules, no-deletion, record workflow)
- tests/golden-corpus/decisioning/case-31/ (hand-authored precedent)

Work:

1. Add a test-only IComplianceRulePackProvider in ArchLucid.Decisioning.Tests (own file), e.g. FixedComplianceRulePackProvider, that returns a precomputed ComplianceRulePack. Do not add this type to the product assemblies.

2. Add ArchLucid.Decisioning.Tests/GoldenCorpus/PolicyFilteredGoldenCorpusTests.cs:
   - Load the same file pack the harness uses (default-compliance.rules.json copied to output).
   - Build one GraphSnapshot that is known to violate at least two distinct file-pack rules (reuse GoldenCorpusGraphFactory archetype 4 / case-31 shape, or construct a minimal topology+security graph in the test). The graph must be identical across both postures.
   - Posture A: PolicyPackContentDocument with ComplianceRuleKeys containing ONLY one of those violated rule ids.
   - Posture B: PolicyPackContentDocument with ComplianceRuleKeys containing a DIFFERENT violated rule id (or a strictly larger set that includes A's key plus another).
   Both key lists must be non-empty so you do not hit the identity branch of Filter.
   - Filter the loaded pack with Core ComplianceRulePackGovernanceFilter.Filter for each posture.
   - Run ComplianceFindingEngine (plus the existing pack validator + GraphComplianceEvaluator) against the same graph for each filtered pack.
   - Assert: the two FindingsSnapshot finding sets differ by PolicyRuleId / Trace.RulesApplied / payload RuleId in a committed way. Assert severity counts differ OR the exact rule ids present differ — pick the stronger assertion that is stable.
   - Poison test (the acceptance criterion): also assert that Filter actually removed rules. Compare Filter(full, postureA).Rules.Count against full.Rules.Count and require it is strictly smaller. If someone stubs Filter to return source unchanged, THIS assertion fails even if you accidentally picked two postures that evaluate the same remaining rules.

3. Do not change GoldenCorpusHarness.CreateEngines() and do not require the six-engine snapshots to change. Keep this as an additional test, Suite=Core, not trait-excluded.

4. Write docs/quality/policy-filter-golden-delta.md (and optionally .json) describing the two postures, the rule keys, and the finding-id / severity delta. Add a claimBoundary sentence: this is a regression instrument for Filter, not evidence that 39 engines are policy-aware. Generate from the test when ARCHLUCID_RECORD_POLICY_FILTER_DELTA=1, and when the env var is unset still assert the delta (no file write required in CI). Follow the env-gated record convention in InsightDensityEngineDistributionReportTests.

5. Add a subsection to docs/library/DECISIONING_GOLDEN_CORPUS.md: the six-engine harness still bypasses Filter; this sibling test is the Filter contract. Do not claim the golden corpus now covers PolicyFilteredComplianceRulePackProvider's governance loader / tenant-curated merger — it does not. Persistence merger tests remain the coverage for TenantCuratedComplianceRulePackMerger.

Do not:
- Change ComplianceRulePackGovernanceFilter behaviour.
- Expand CreateEngines() to the other 33 engines (assessment item 4 is a different prompt; not this one).
- Pull in Persistence, SQL, IEffectiveGovernanceLoader, or IScopeContextProvider.
- Add OpenAPI, UI, or a new finding engine.
- Push to master.

Compile check: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test: dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~PolicyFilteredGoldenCorpus"

Done when: two postures of one graph produce a committed findings delta, the test fails if Filter is identity, and the six-engine golden snapshots are untouched.
```

---

# ID-10 — Policy vocabulary for declaration and security-baseline engines

**Closes:** exactly one of 39 engines (`compliance`) is policy-filtered. Declaration-security and declaration-premise-conflict findings fire for every tenant even when the tenant's enabled rule set does not care about public network access. That is the *package into governance* clause of the pillar, and it is how a buyer probe "does my standard change what this finds" stops being a compliance-only answer.
**Depends on:** ID-08 merged (otherwise you are filtering keys the Bicep/K8s path still never emits)
**Branch suggestion:** `cursor/declaration-policy-vocabulary-9750`

### Design intent (read before prompting)

Do **not** add a field to `PolicyPackContentDocument` (that is an OpenAPI + persistence change). Reuse `complianceRuleKeys`.

Publish a static map from declaration signal **theme** → existing bundled rule ids that already describe that control. When the effective pack has been key-narrowed, emit a declaration finding only if at least one mapped key survived `ComplianceRulePackGovernanceFilter`. When the pack was **not** key-narrowed (empty ids and empty keys), emit all signals — same semantics as Filter.

`IFindingEngine` XML docs say AnalyzeAsync must not do I/O beyond GraphSnapshot. `ComplianceFindingEngine` already violates that by calling `IComplianceRulePackProvider.GetRulePackAsync`. **Follow that existing exception** — inject the same provider; do not convert these engines to `IEffectfulFindingEngine`.

`SecurityBaselineFindingEngine` is a coverage-shaped "node exists" engine. Do **not** try to make it insightful in this prompt. Optionally skip emitting Info-level "control is present" rows when the pack is key-narrowed and no mapped security key survived; do not invent IAM/DR analysis.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: make declaration-security-baseline and declaration-premise-conflict findings honor the tenant's enabled complianceRuleKeys, using a published static map onto existing bundled rule ids. No new PolicyPackContentDocument fields. No new finding engine.

Why: PolicyFilteredComplianceRulePackProvider already changes which compliance rules evaluate. The other 38 engines ignore that document. A buyer who toggles CIS Azure public-access rules currently sees compliance findings change and declaration-security findings stay put. Mapping declaration themes onto the same keys makes the moat cover the findings operators actually argue about (public storage, HTTPS, NSG admin ingress, privileged workloads).

Depends on ID-08 having landed so Bicep/K8s/ARM keys actually produce those themes. If ID-08 is not on this branch, STOP and rebase onto it rather than re-implementing parsers.

Read first:
- ArchLucid.Decisioning/Services/DeclarationSecurityBaselineFindingEngine.cs (parameterless today)
- ArchLucid.Decisioning/Services/DeclarationPremiseConflictFindingEngine.cs
- ArchLucid.Decisioning/Analysis/DeclarationSecurityBaselineClassifier.cs (themes: data-protection, transport-security, encryption, network-isolation, and ID-08 workload-isolation if present)
- ArchLucid.Decisioning/Services/ComplianceFindingEngine.cs (constructor-injected IComplianceRulePackProvider precedent)
- ArchLucid.Core/Governance/PolicyPacks/ComplianceRulePackGovernanceFilter.cs (empty keys = do not narrow)
- ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.Decisioning.cs
- ArchLucid.Decisioning/Plugins/BuiltInFindingEngineTypeCatalog.cs
- ArchLucid.Decisioning.Tests/Plugins/BuiltInFindingEngineTypeCatalogTests.cs
- docs/samples/policy-packs/cis-azure-foundations-rules-v1.json — use these existing ids:
  - cis-az-006 Storage account public access disabled
  - cis-az-009 Storage network rules restrict public endpoints
  - cis-az-012 SQL public network access restricted
  - cis-az-018 NSG rules follow least privilege
  - cis-az-019 Just-in-time VM access for management ports
  - cis-az-025 App Service HTTPS only and TLS minimum
  - cis-az-027 Kubernetes API server access restricted
- docs/samples/policy-packs/security-architecture-baseline-rules-v1.json sec-base-028 Private endpoints mandatory for regulated-class datastores

Work:

1. Create ArchLucid.Decisioning/Governance/PolicyPacks/DeclarationSignalPolicyKeyMap.cs — public static class.

   Map each classifier theme token to one or more existing rule ids (HashSet, ordinal ignore case):
   - data-protection → cis-az-006, cis-az-009, cis-az-012, sec-base-028
   - encryption → cis-az-012, cis-az-025 (SQL TLS/public overlap is OK)
   - transport-security → cis-az-025
   - network-isolation → cis-az-018, cis-az-019
   - workload-isolation → cis-az-027 (plus sec-base-028 if you have no better CIS Kubernetes privileged key; document the approximation in an XML comment — do not invent a cis-k8s-* id that does not exist in bundled packs)

   Method: bool IsThemeEnabled(string theme, ComplianceRulePack effectivePack)
   - If the caller's "narrowed" flag is false (see below), return true.
   - Else return true iff any mapped key is present in effectivePack.Rules[].RuleId.

   Do not read PolicyPackContentDocument here — the engine passes the already-filtered pack. That keeps this graph-engine code from taking a second dependency on governance documents.

2. Create ArchLucid.Decisioning/Governance/PolicyPacks/DeclarationSignalPolicyGate.cs — public static class.

   bool PackIsKeyNarrowed(ComplianceRulePack full, ComplianceRulePack filtered)
   Compare rule counts (or rule id sets). If filtered has fewer rules than full, the pack is key-narrowed (or priority-floored). Treat priority-floor-only narrowing as narrowed too — a P0-only tenant should not see P2-shaped declaration noise if you can map themes to P0/P1 keys. If that coupling is too blunt, document it: theme maps to the cis-az keys above regardless of priority, and IsThemeEnabled only checks presence in the filtered pack's remaining rules (priority floor already dropped P2). That is the intended behaviour — do NOT re-implement the floor.

3. Change DeclarationSecurityBaselineFindingEngine to inject IComplianceRulePackProvider (same as ComplianceFindingEngine). AnalyzeAsync:
   - GetRulePackAsync (this is the already-filtered pack in production DI).
   - Classify as today.
   - Drop signals whose theme is not enabled on that pack WHEN the pack has any rules at all. If the pack is empty, emit nothing (fail closed on an empty filtered pack). If you cannot distinguish "not narrowed" from "filtered to empty" from the pack alone, inject BOTH the file loader and the filtered provider — STOP and report rather than guessing. Production DI registers PolicyFilteredComplianceRulePackProvider as IComplianceRulePackProvider, so GetRulePackAsync IS the filtered pack. Empty filtered pack => no declaration findings. Un-narrowed pack (all file rules present) => all themes enabled. Implement un-narrowed detection by comparing filtered.Rules.Count to a full pack loaded once via IComplianceRulePackLoader if that port is already available in Decisioning; otherwise treat "filtered contains at least one mapped key for the theme" OR "filtered contains none of the map's keys at all AND still has many rules" carefully.

   SIMPLER RULE — implement this, not the paragraph above:
   - Load the (filtered) pack from IComplianceRulePackProvider.
   - Collect the set of RuleId values.
   - If the set intersects ANY key in DeclarationSignalPolicyKeyMap (across all themes), the tenant has opted into this vocabulary: emit a signal only when that signal's theme intersects the set.
   - If the set intersects NONE of the map keys, the tenant's pack does not speak this vocabulary yet (today's 45-pack merge may not include cis-az-* depending on assignments): emit ALL signals (legacy behaviour). This avoids silently dropping every declaration finding for tenants whose enabled keys are soc2-* only, until those packs also get mapped. XML-comment this fail-open-when-unmapped posture and add a test for it.

   Populate Finding.PolicyRuleId and Trace.RulesApplied with the first mapped key that survived, so ADR 0063 merge and the frontier-delta harness can join on rule id. Payload stays as today unless a payload DTO already exists; do not add FindingsSnapshot fields.

4. Same gate in DeclarationPremiseConflictFindingEngine (inject the provider; parameterless catalog activation is not required — ComplianceFindingEngine already has constructor args). Catalog + DI registration must still match EngineType.

5. Catalog guard: BuiltInFindingEngineTypeCatalogTests still passes. Composition registration stays AddScoped<Di.IFindingEngine, Ds.DeclarationSecurityBaselineFindingEngine>() — DI will constructor-inject the provider.

6. Tests in ArchLucid.Decisioning.Tests (no ConfigureAwait(false)):
   - Unmapped pack (rules with ids like "soc2-001" only) => declaration findings still emit (fail-open).
   - Pack containing cis-az-006 but not cis-az-025 => public-access signal emits, https-only signal does not.
   - Pack containing cis-az-025 only => opposite.
   - Premise-conflict uses the same theme gate.
   - Mock IComplianceRulePackProvider; do not hit SQL.
   - Existing classifier unit tests stay pack-free (classifiers remain pure).

7. Docs:
   - docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md — declaration engines now join tenant rule keys via DeclarationSignalPolicyKeyMap.
   - docs/library/CONFIGURATION_REFERENCE.md only if you add options (you should not).
   - docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md — one paragraph that CIS Azure keys listed above also gate declaration-security findings. No buyer claim that "all 39 engines are policy-aware."

Do not:
- Add properties to PolicyPackContentDocument or regenerate OpenAPI.
- Convert these engines to IEffectfulFindingEngine.
- Filter RequirementFindingEngine, TopologyCoverageFindingEngine, or other coverage engines.
- Change ComplianceRulePackGovernanceFilter.
- Add a new deep engine (resilience/IAM/etc.).
- Default-on LLM judge changes.
- Push to master.

Compile check: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~DeclarationSignalPolicy|FullyQualifiedName~DeclarationSecurityBaseline|FullyQualifiedName~DeclarationPremiseConflict|FullyQualifiedName~BuiltInFindingEngineTypeCatalog"

Done when: a tenant whose filtered pack includes cis-az-006 and excludes cis-az-025 gets the public-access declaration finding and not the HTTPS-only one; a tenant whose pack has no mapped keys still gets today's declaration findings; classifiers remain pure; OpenAPI unchanged.
```

---

# ID-11 — Advisory-only labeling of the density distribution

**Closes:** assessment §17 item 9's *docs* half. `typed-engine-protected` remains a hard bypass (owner decision — do not change demotion). The distribution report already says "Advisory" in one sentence; several other surfaces still read as if the score gated engine output. This prompt is honesty, not behavior.
**Depends on:** none
**Branch suggestion:** `cursor/insight-density-advisory-label-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: make every committed insight-density measurement surface state, in its own header, that typed-engine scores are advisory because DeterministicInsightDensityGate returns Promote/DecisionGradeFinding unconditionally for non-agent findings (penalty reason typed-engine-protected). Do not change demotion behavior.

Why: docs/quality/insight-density-engine-distribution.md already has a two-line advisory header, but AGENT_EVAL_CORPUS.md, FINDING_ENGINE_OUTPUT_REFERENCE.md, InsightDensityEngineDistributionCalculator XML docs, and the ID-02 prompt archive still describe the score as if it were a control. Assessment §17 item 9 asked to label the report advisory-only rather than reading as a control. The owner has not decided to apply the score to engines; this prompt must not sneak that decision in.

Read first:
- ArchLucid.Core/Findings/DeterministicInsightDensityGate.cs (typed-engine-protected short-circuit)
- ArchLucid.Decisioning/Findings/InsightDensityEngineDistributionCalculator.cs
- ArchLucid.Decisioning.Tests/GoldenCorpus/InsightDensityEngineDistributionReportTests.cs (the markdown writer)
- docs/quality/insight-density-engine-distribution.md
- docs/library/AGENT_EVAL_CORPUS.md (Frontier-baseline delta + any distribution section)
- docs/architecture/INSIGHT_DENSITY_COMPOSER_PROMPTS.md (ID-02 — archive; you may add a one-line "shipped; scores remain advisory" note, do not re-prompt ID-02)
- tests/eval-corpus/insight-density-frontier-delta/README.md (claimBoundary precedent)

Work:

1. Strengthen docs/quality/insight-density-engine-distribution.md header to include an explicit claimBoundary equivalent:
   - Scores do not demote typed-engine findings.
   - The corpus exercises six engines; 33 engines are absent from the table.
   - WouldDemoteIfUnprotectedCount is a counterfactual, not production behavior.
   Keep the existing table. If the report is generated by the test, change the generator in InsightDensityEngineDistributionReportTests so the next record-mode run cannot wipe the disclaimer. Commit the regenerated markdown in this PR (set the env var locally, or edit both generator and committed file).

2. Add the same claimBoundary paragraph to:
   - InsightDensityEngineDistributionCalculator XML <remarks>
   - docs/library/AGENT_EVAL_CORPUS.md
   - docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md near the density-gate mention
   - docs/library/CONFIGURATION_REFERENCE.md under ArchLucid:Findings:InsightDensityGate:DemotionThreshold (that row already mentions typed-engine-protected; make the advisory/control distinction one explicit sentence)

3. Do not change DeterministicInsightDensityGate.Score. Add a test only if you can assert the markdown generator emits the claimBoundary substring, so a future record run cannot drop it.

Do not:
- Apply DemotionThreshold to typed engines.
- Rename typed-engine-protected.
- Add engines to the distribution table.
- Touch UI, OpenAPI, or master.
- Soften buyer-facing copy into a density claim.

Compile check: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test: dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~InsightDensityEngineDistribution"

Done when: every density-distribution surface in-repo states advisory-only + six-engine corpus limit in its own header, and gate behavior is unchanged.
```

---

## After running these

Re-run the ID-01 frontier-delta harness on the feature branch after ID-08 (and ID-10 if it changed titles/rule ids). If novelty percentage did not move, ID-08 filled keys the baseline fixtures already "know" — that is still a product win (Bicep/K8s first reviews get findings) but it is not a pillar-score win until the fixtures include a Bicep/K8s case the baseline lacks.

## Do not start from this document

| Item | Why |
|------|-----|
| One deep engine (resilience / segmentation / IAM / secrets / observability / capacity) | Held for **G-REAL-06** (assessment §17 item 7) |
| Live frontier transcripts | Held until a real pilot architecture exists (§17 item 8) |
| Demote typed-engine findings using the density score | Owner decision (§17 item 9). ID-11 labels only |
| Expand golden corpus to all 39 engines | Assessment item 4; separate from ID-09's Filter contract |
| Restore UI build / 12 backend failures / Vitest | Trunk hygiene stream; different branch |
| TB-885, TB-2033–2037, TB-883 | Assessment hold |
| GTM M-90 / M-44 / M-91 / M-92, G-REAL-05, G-ASSURANCE-02 | Owner/GTM, not engineering |

## Related

- [`INSIGHT_DENSITY_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_COMPOSER_PROMPTS.md) — ID-01–07 archive (shipped)
- [`INGESTION_FIT_GAP_COMPOSER_PROMPTS.md`](INGESTION_FIT_GAP_COMPOSER_PROMPTS.md) — FIT-01–05 archive (shipped)
- [`../library/FINDING_ENGINE_OUTPUT_REFERENCE.md`](../library/FINDING_ENGINE_OUTPUT_REFERENCE.md)
- [`../library/CONTEXT_INGESTION.md`](../library/CONTEXT_INGESTION.md)
- [`../library/DECISIONING_GOLDEN_CORPUS.md`](../library/DECISIONING_GOLDEN_CORPUS.md)
- [`../assessments/LATEST_GPT55.md`](../assessments/LATEST_GPT55.md) §7.1, §17 items 2, 3, 9
