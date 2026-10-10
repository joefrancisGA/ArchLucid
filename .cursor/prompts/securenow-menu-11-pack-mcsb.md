# SN-PACK-03 — Microsoft cloud security benchmark pack

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md`

**Depends on:** nothing.

## Goal

A bundled policy pack, slug `microsoft-cloud-security-benchmark`, of architecture-review rules derived from the Microsoft cloud security benchmark (MCSB). Each rule says which Microsoft tool already reports on that control, so SecureNow extends Microsoft tooling instead of competing with it.

## Why

Generic SecureNow features MCSB, and the owner wants SecureNow to extend Microsoft tools. Defender for Cloud uses MCSB as its default regulatory standard. The bundle has `cis-azure-foundations`, `azure-paas-security`, and `entra-iam-baseline`, but no MCSB pack.

## Read first

- `docs/library/authoring-prompts/README.md`, `GENERATOR_PROMPT.md`, `CRITIC_PROMPT.md`, `PACK_CONTEXTS.md`
- `ArchLucid.Application/Governance/DefaultPolicyPacks/Bundled/cis-azure-foundations.json`, `azure-paas-security.json`, `entra-iam-baseline.json`
- `ArchLucid.Integrations.AzureExtractor/GetOnlyHostedAzureArmReadClient.PolicyDefinitions.cs` (what Azure Policy data collection already reads)
- `ArchLucid.Application/Governance/DefaultPolicyPacks/DefaultPolicyPackBundledManifest.cs`
- `ArchLucid.Decisioning.Tests/Governance/BundledPolicyPackTestCatalog.cs`

## What to build

1. Confirm the current MCSB version on Microsoft Learn before authoring and record it in pack metadata. Do not assume a version.
2. Add a `PACK_CONTEXTS.md` block. Sub-corpora by MCSB domain: Network security (NS), Identity management (IM), Privileged access (PA), Data protection (DP), Asset management (AM), Logging and threat detection (LT), Posture and vulnerability management (PV), Endpoint security (ES), Backup and recovery (BR), and DevOps security (DS). About 50 rules.
3. Each rule adds `relatedMicrosoftTooling`, a short list naming where Microsoft already reports on it: `Defender for Cloud recommendation`, `Azure Policy built-in`, `Entra ID`, or `Microsoft Sentinel`. Only name a tool when the critic pass confirms the relationship. If the pack schema has no slot for this, put it in the rule's remediation text and say so in the session summary. Do not change the schema in this session.
4. Generate and critic the rules file and pack file, add the bundled pack, append it to the manifest, and register it in the test catalog.

Paraphrase. Cite MCSB control identifiers (for example `NS-1`, `IM-3`) in `frameworkMappings`. Do not copy Microsoft text.

No rule ships at `Critical`.

## Tests

1. The manifest test sees the new pack.
2. Every rule id is unique across the bundle.
3. Every `frameworkMappings` identifier matches `^(NS|IM|PA|DP|AM|LT|IR|PV|ES|BR|DS|GS)-\d+$`.
4. No rule has severity `Critical`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'`, then run the bundled pack tests.
- Do not call Defender for Cloud, Azure Policy, or any Microsoft API in this session.
- List every identifier or tooling link you were not certain of in the session summary.
- Do not commit.

## Done when

`microsoft-cloud-security-benchmark` is bundled for the current MCSB version, each rule cites MCSB identifiers, and rules point to the Microsoft tool that already reports on them where that link is confirmed.
