# SN-PACK-01 — NIST SP 800-53 Rev. 5 architecture pack

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md`

**Depends on:** nothing.

## Goal

A bundled policy pack, slug `nist-800-53-r5-architecture`, of architecture-review rules derived from NIST SP 800-53 Rev. 5, scoped to controls that collected Azure evidence can support or contradict.

## Why

Generic SecureNow features NIST SP 800-53. The bundle has `nist-csf-2-architecture` and ARC-AMPE (which is 800-53 Moderate-derived), but no 800-53 pack of its own.

## Read first

- `docs/library/authoring-prompts/README.md`, `GENERATOR_PROMPT.md`, `CRITIC_PROMPT.md`, `PACK_CONTEXTS.md` (Wave 0 ARC-AMPE block as the model)
- `docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md`
- `docs/library/POLICY_PACK_ARC_AMPE_DESIGN.md` (how `frameworkMappings` cite 800-53 identifiers)
- `ArchLucid.Application/Governance/DefaultPolicyPacks/Bundled/nist-csf-2-architecture.json` and `cis-azure-foundations.json`
- `docs/samples/policy-packs/cis-azure-foundations-rules-v1.json`
- `ArchLucid.Application/Governance/DefaultPolicyPacks/DefaultPolicyPackBundledManifest.cs`
- `ArchLucid.Decisioning.Tests/Governance/BundledPolicyPackTestCatalog.cs`

## What to build

1. Add a `PACK_CONTEXTS.md` block for this pack. Sub-corpora by control family that architecture evidence can address: AC, AU, CM, CP, IA, SC, SI, SR, and RA. About 60 rules. `priorityFloor: P0` keeps roughly 15 to 20 active by default, the same pattern ARC-AMPE uses.
2. Run the generator and critic prompts to produce `docs/samples/policy-packs/nist-800-53-r5-architecture-rules-v1.json` and the pack file.
3. Add the bundled pack JSON under `DefaultPolicyPacks/Bundled/` and append it to `bundled-policy-packs-v1.manifest.json`.
4. Register it in the bundled pack test catalog.

Rules cite control identifiers (for example `SC-7`, `AC-6(1)`) in `frameworkMappings`. Do not reproduce control text. NIST publications are public domain, but rule descriptions are written as architecture checks, not restated controls.

No rule ships at `Critical`. This is an architecture-review pack, not a gate.

## Tests

1. The manifest test sees the new pack, and every listed content file exists.
2. Every rule id is unique across the bundle.
3. Every `frameworkMappings` identifier matches the 800-53 pattern `^[A-Z]{2}-\d+(\(\d+\))?$`.
4. No rule has severity `Critical`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'`, then run the bundled pack tests.
- List every control identifier you were not certain of in the session summary for the owner's spot check. Do not guess an identifier to fill a gap.
- Do not commit.

## Done when

`nist-800-53-r5-architecture` is bundled, passes the bundle tests, and cites only 800-53 identifiers the critic pass and owner spot check accept.
