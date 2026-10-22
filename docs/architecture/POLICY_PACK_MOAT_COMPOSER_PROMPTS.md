> **Scope:** Copy-paste Composer prompt that makes tenant policy packs change **declaration** findings for the packs buyers actually assign — not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Assessment:** [`../assessments/LATEST_GPT55.md`](../assessments/LATEST_GPT55.md) §7.3 / §10 · **Predecessor (SHIPPED):** [`INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md`](INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md) ID-09 / ID-10

# Policy-pack moat — Composer prompt (PP-01)

**Created:** 2026-08-26 · **Status:** ready to run on a feature branch.

**Do not re-run ID-09 or ID-10.** They already landed on `master`:

| Shipped | What it did |
|---------|-------------|
| **ID-09** | `PolicyFilteredGoldenCorpusTests` + `docs/quality/policy-filter-golden-delta.md` — two postures change **compliance** findings |
| **ID-10** | `DeclarationSignalPolicyKeyMap` / `DeclarationSignalPolicyGate` on `declaration-security-baseline` and `declaration-premise-conflict` |

ID-10 only maps **`cis-az-*`** and **`sec-base-028`**. Every other bundled vocabulary (`soc2-*`, `gdpr-*`, `hipaa-*`, `iso27001-*`, `pci-*`, `zta-*`, `cis-aws-*`, `cis-gcp-*`, `aks-*` / `eks-*` / `gke-*`) hits **fail-open**: the tenant opted into a pack and still gets every declaration signal. That is why a buyer toggling SOC 2 vs CIS Azure sees compliance rows move and declaration rows stay put — the remaining half of “policy packs drive 1 of 39 engines.”

**Land on a feature branch. Do not push to `master`.** Suggested Cloud Agent branch: `cursor/policy-pack-declaration-vocabulary-9750`. Name the branch in any commit/push request (`Git-Commit-Requires-Branch`).

## What this prompt does **not** do

- Does **not** make all 39 engines policy-aware. Coverage/topology/cost/inventory/open-commitment/portfolio-recurrence stay pack-inert. Claim boundary stays honest.
- Does **not** add fields to `PolicyPackContentDocument` (no OpenAPI).
- Does **not** add a finding engine, SQL, UI, or new curated rule JSON.
- Does **not** start **G-REAL-06**, SOC 2 CPA, or third-party pen test.
- Does **not** rewrite `ComplianceRulePackGovernanceFilter`.
- Follow-on **PP-02** (not this chat): optionally suppress Info-level `SecurityBaselineFindingEngine` “control is present” rows when the pack is vocabulary-narrowed. Out of scope here.

---

## Global constraints

- Each class in its own file. Prefer LINQ. Prefer concrete types over `var`. Blank line before `if` / `foreach` unless first line of a method. Always check nulls. Comment anything a two-year developer would not follow. **No `ConfigureAwait(false)` in tests.**
- Tenant isolation stays database-per-tenant (ADR 0037). No SQL RLS as the paying-client boundary.
- Before editing tracked files, run `.\scripts\agent\check-working-tree-path.ps1` on those paths.
- Stage only files this prompt changes. **No `git add -A`.**
- One scoped compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'` (one retry on exit code 1).
- Do not regenerate OpenAPI. Do not touch `archlucid-ui`.

---

# PP-01 — Map buyer packs onto the existing declaration policy gate

**Closes:** toggling a non-CIS bundled pack does not change declaration-security or declaration-premise-conflict findings, because `TenantUsesDeclarationVocabulary` is false for `soc2-001` and the gate fail-opens.
**Depends on:** none (ID-08/09/10 are on `master`)
**Branch suggestion:** `cursor/policy-pack-declaration-vocabulary-9750`

### Design intent (read before prompting)

Keep the ID-10 gate. Change **how vocabulary membership is decided**.

Today (`DeclarationSignalPolicyGate.ShouldEmitTheme`):

1. Empty filtered pack → emit nothing (fail closed). Keep this.
2. Filtered pack intersects the **mapped id set** → emit only themes whose mapped ids survived. Keep this.
3. Filtered pack intersects **none** of the mapped ids → emit **all** themes (fail-open). This is correct for FinOps / AI-gov / DORA / OTel / sustainability. It is **wrong** once the pack’s prefix is a security/privacy framework that has declaration-relevant rules.

**New rule:** a tenant “speaks declaration vocabulary” when the filtered pack contains **either** a mapped rule id **or** a rule id whose prefix is in the published **framework-prefix family** below. Then emit a theme only if at least one mapped key for that theme survived the filter.

So `soc2-001` only (logical access) **suppresses** public-network and HTTPS-only signals (those themes map to `soc2-018` / `soc2-004`, which did not survive). A full SOC 2 assignment that still includes `soc2-003` / `soc2-004` / `soc2-018` emits those themes. `cost-opt-001` only still fail-opens.

Do **not** invent rule ids. Map only ids that already exist in `docs/samples/policy-packs/*-rules-v1.json`.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: expand DeclarationSignalPolicyKeyMap so buyer-common bundled policy packs (SOC 2, GDPR, HIPAA, ISO 27001, PCI-DSS, Zero Trust, CIS AWS, CIS GCP, AKS/EKS/GKE) actually gate declaration-security-baseline and declaration-premise-conflict findings. Keep fail-open only for prefixes that have no declaration-relevant rules (cost-opt, ai-gov, dora, otel, sust-base, rel-base, perf-base, ops-base, and similar). No new PolicyPackContentDocument fields. No new finding engine. No OpenAPI. No UI.

Why: Assessment v3 called this “policy packs drive one of 39 engines.” ID-10 made declaration engines honor cis-az-* / sec-base-028 and fail-open otherwise. A tenant who assigns the SOC 2 pack (soc2-*) still gets every declaration signal, so toggling SOC 2 vs CIS Azure does not change the findings operators argue about (public storage, HTTPS, NSG/admin ingress, privileged workloads). The moat is still a compliance-checklist moat.

Do not re-implement ID-09 (PolicyFilteredGoldenCorpusTests) or ID-10’s cis-az map. Do not change ComplianceRulePackGovernanceFilter. Do not convert engines to IEffectfulFindingEngine. Do not filter RequirementFindingEngine, TopologyCoverageFindingEngine, cost, inventory, open-commitment, or portfolio-recurrence engines.

Read first:
- ArchLucid.Decisioning/Governance/PolicyPacks/DeclarationSignalPolicyKeyMap.cs
- ArchLucid.Decisioning/Governance/PolicyPacks/DeclarationSignalPolicyGate.cs
- ArchLucid.Decisioning/Services/DeclarationSecurityBaselineFindingEngine.cs
- ArchLucid.Decisioning/Services/DeclarationPremiseConflictFindingEngine.cs
- ArchLucid.Decisioning.Tests/Services/DeclarationSignalPolicyFindingEngineTests.cs (the soc2-001 fail-open case MUST change)
- ArchLucid.Decisioning.Tests/GoldenCorpus/PolicyFilteredGoldenCorpusTests.cs (compliance-only sibling — do not weaken; add a declaration sibling)
- docs/quality/policy-filter-golden-delta.md (claimBoundary today: compliance only)
- docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md
- docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md
- These curated rule files (confirm titles before mapping; do not invent ids):
  - docs/samples/policy-packs/soc2-tsc-architecture-rules-v1.json
  - docs/samples/policy-packs/gdpr-baseline-rules-v1.json
  - docs/samples/policy-packs/hipaa-architecture-rules-v1.json
  - docs/samples/policy-packs/iso27001-architecture-rules-v1.json
  - docs/samples/policy-packs/pci-dss-architecture-rules-v1.json
  - docs/samples/policy-packs/zero-trust-architecture-rules-v1.json
  - docs/samples/policy-packs/cis-azure-foundations-rules-v1.json (already mapped)
  - docs/samples/policy-packs/cis-aws-foundations-rules-v1.json
  - docs/samples/policy-packs/cis-gcp-foundations-rules-v1.json
  - docs/samples/policy-packs/security-architecture-baseline-rules-v1.json (sec-base-028 already mapped)
  - docs/samples/policy-packs/aks-production-baseline-rules-v1.json
  - docs/samples/policy-packs/eks-production-baseline-rules-v1.json
  - docs/samples/policy-packs/gke-production-baseline-rules-v1.json

Work:

1. Extend DeclarationSignalPolicyKeyMap (same file unless a helper type needs its own file).

   Keep existing theme tokens: data-protection, encryption, transport-security, network-isolation, workload-isolation.

   ADD these existing ids to the theme sets (union, ordinal ignore case). Comment each id with the rule title from the JSON:

   data-protection (public reachability / private endpoints / storage public access):
   - keep cis-az-006, cis-az-009, cis-az-012, sec-base-028
   - cis-aws-006, cis-aws-009, cis-aws-012
   - cis-gcp-006, cis-gcp-009, cis-gcp-012
   - soc2-018 (Network segmentation for sensitive workloads)
   - pci-002 (Network segmentation between CDE and out-of-scope)
   - pci-003 (Inbound and outbound CDE traffic restricted)
   - iso27001-025 (Network security perimeter documented)
   - aks-015 / eks-015 / gke-015 if those files have the internal-LB / public-LB peer (verify; skip a prefix if the id does not exist)

   encryption (at rest / TDE / platform encryption):
   - keep cis-az-012, cis-az-025 (existing overlap is OK)
   - cis-aws-007, cis-aws-011, cis-aws-020 (storage SSE / SQL TDE / managed disk — verify titles)
   - cis-gcp peers with the same ordinal if present
   - soc2-003 (Encryption protects data at rest)
   - gdpr-001 (Personal data encrypted at rest)
   - hipaa-017 (Encryption and decryption of ePHI)
   - iso27001-010 (Cryptographic controls for data protection)
   - pci-007 (PAN encryption at rest in CDE)
   - zta-008 (Encrypted communications everywhere) — also listed under transport-security; overlap is OK

   transport-security (HTTPS / TLS in transit):
   - keep cis-az-025
   - cis-aws-025 / cis-gcp-025 if title is HTTPS/TLS (verify; CIS Azure 025 is App Service HTTPS only)
   - soc2-004 (Encryption protects data in transit)
   - gdpr-002 (Personal data encrypted in transit)
   - hipaa-022, hipaa-024 (Transmission security / Encryption in transit for ePHI)
   - pci-009 (TLS for PAN transmission over open networks)
   - zta-008

   network-isolation (NSG / JIT / micro-segmentation / management ports):
   - keep cis-az-018, cis-az-019
   - cis-aws-018, cis-aws-019
   - cis-gcp-018, cis-gcp-019
   - soc2-018
   - zta-007 (Micro-segmentation for workloads)
   - pci-002, pci-003
   - iso27001-025

   workload-isolation (privileged containers / API server / hostNetwork):
   - keep cis-az-027, sec-base-028
   - cis-aws-027, cis-gcp-027 if they exist (verify titles — may be Kubernetes API access)
   - aks-001 (private API server — if title matches)
   - aks-009 (Pod security standards)
   - aks-021 (Disallow hostPath and privileged mounts)
   - eks-* / gke-* peers with the same ordinals if present; skip if missing

   Do not add ai-gov, cost-opt, dora, otel, sust-base, rel-base, perf-base, ops-base, supply-chain, or snowflake ids in this prompt. Those packs should keep fail-open.

2. Prefix family (new public helper on the map).

   FrozenSet or HashSet of prefixes that mean “this tenant opted into a declaration-relevant framework,” even when the surviving keys are not themselves mapped (e.g. soc2-001 only):
   soc2, gdpr, hipaa, iso27001, pci, zta, cis-az, cis-aws, cis-gcp, sec-base, aks, eks, gke

   Matching rule: a RuleId equals a mapped id OR starts with "{prefix}-" (ordinal ignore case). Do not treat "iso27001" as matching "iso" — require the hyphen suffix form used in the JSON.

   Change TenantUsesDeclarationVocabulary to return true when the active id set intersects MappedRuleIds OR matches the prefix family.

   XML-comment the fail-open remainder: prefixes outside the family still emit all themes.

3. DeclarationSignalPolicyGate.ShouldEmitTheme stays:
   - empty active set → false
   - !TenantUsesDeclarationVocabulary → true (fail-open)
   - else IsThemeEnabled

   Update the class XML docs: fail-open is for unmapped prefixes, not for SOC 2.

4. Tests — replace the misleading soc2-001 fail-open case. Prefer concrete types, check nulls, no ConfigureAwait(false).

   In DeclarationSignalPolicyFindingEngineTests:
   - cost-opt-001 (or ai-gov-001) only → still emits both public-access and HTTPS (fail-open). This is the new “unmapped prefix” case.
   - soc2-001 only → does NOT emit public-access or HTTPS (vocabulary yes, themes not enabled).
   - soc2-004 only → HTTPS/transport-security emits; public-access/data-protection does not.
   - soc2-018 only → public-access/data-protection emits; HTTPS does not.
   - hipaa-024 only → transport-security emits; data-protection does not.
   - gdpr-001 only → encryption-themed signals emit; HTTPS-only emits only if you also mapped gdpr-001 onto transport-security (you should not — gdpr-001 is at rest).
   - cis-aws-006 only → public-access emits; HTTPS does not (same as cis-az-006).
   - Keep existing cis-az-006 / cis-az-025 / empty-pack / premise-conflict cases.
   - Map unit tests: TenantUsesDeclarationVocabulary(soc2-001) is true; TenantUsesDeclarationVocabulary(cost-opt-001) is false; IsThemeEnabled("transport-security", soc2-004) is true.

   Add ArchLucid.Decisioning.Tests/GoldenCorpus/PolicyFilteredDeclarationGoldenCorpusTests.cs:
   - One fixed graph that produces BOTH a public-network data-protection signal AND an HTTPS-only transport-security signal (reuse CreatePublicAccessAndHttpsDisabledGraph from the engine tests, or share a test helper in its own file if you extract it — do not duplicate a 40-line graph builder in two classes without extracting).
   - Posture A: ComplianceRulePack with only soc2-004.
   - Posture B: ComplianceRulePack with only cis-az-006 (or soc2-018).
   - Run DeclarationSecurityBaselineFindingEngine via FixedComplianceRulePackProvider for each posture.
   - Assert the two finding sets differ by theme / PolicyRuleId in a committed way (A has HTTPS not public-access; B has public-access not HTTPS).
   - Poison: if TenantUsesDeclarationVocabulary is stubbed to always false, both postures would fail-open and this test fails.
   - Suite=Core. Do not change GoldenCorpusHarness.CreateEngines().

5. Docs:
   - docs/quality/policy-filter-golden-delta.md — add a subsection for the declaration sibling (or a new docs/quality/policy-filter-declaration-delta.md). claimBoundary: this still does not make 39 engines policy-aware; coverage/cost/inventory remain pack-inert.
   - docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md — declaration engines join cis-az, cis-aws, cis-gcp, soc2, gdpr, hipaa, iso27001, pci, zta, sec-base, aks/eks/gke via the map; fail-open only outside that prefix family.
   - docs/library/DECISIONING_GOLDEN_CORPUS.md — one sentence pointing at the declaration sibling test.
   - docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md — replace or add one paragraph: assigning CIS Azure / SOC 2 / HIPAA / ISO / PCI / ZTA / CIS AWS/GCP / AKS-EKS-GKE changes which declaration-security findings emit. Do NOT claim all 39 engines are policy-aware. Do NOT claim SOC 2 Type II attestation.
   - docs/architecture/INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md — mark ID-09 and ID-10 SHIPPED; point remaining pack work here. Do not rewrite ID-10’s historical prompt body.

Do not:
- Add properties to PolicyPackContentDocument or regenerate OpenAPI.
- Edit bundled *rules-v1.json content (map existing ids only).
- Filter the other 36 engines.
- Change ComplianceFindingEngine or ComplianceRulePackGovernanceFilter.
- Touch archlucid-ui, SQL DDL, or insight-density demotion (typed-engine-protected stays).
- Push to master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~DeclarationSignalPolicy|FullyQualifiedName~PolicyFilteredDeclarationGoldenCorpus|FullyQualifiedName~PolicyFilteredGoldenCorpus"

Done when:
- A SOC 2-only filtered pack with soc2-004 and not soc2-018 emits HTTPS-only declaration findings and not public-access.
- A CIS Azure pack with cis-az-006 and not cis-az-025 does the opposite.
- cost-opt-001 still fail-opens (unmapped prefix).
- Empty filtered pack still emits nothing.
- Existing cis-az unit tests still pass.
- OpenAPI snapshot unchanged.
- Docs do not claim all 39 engines are policy-aware.
```
