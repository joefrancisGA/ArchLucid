# SN-PACK-02 — OWASP ASVS architecture pack

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md`

**Depends on:** nothing.

## Goal

A bundled policy pack, slug `owasp-asvs-architecture`, of architecture-review rules derived from the OWASP Application Security Verification Standard, scoped to requirements that deployment architecture and collected Azure evidence can address.

## Why

Generic SecureNow features OWASP ASVS. The bundle has `owasp-api-top10` but no ASVS pack.

## Read first

- `docs/library/authoring-prompts/README.md`, `GENERATOR_PROMPT.md`, `CRITIC_PROMPT.md`, `PACK_CONTEXTS.md`
- `ArchLucid.Application/Governance/DefaultPolicyPacks/Bundled/owasp-api-top10.json`
- `docs/samples/policy-packs/` for an existing OWASP rules file, if present
- `ArchLucid.Application/Governance/DefaultPolicyPacks/DefaultPolicyPackBundledManifest.cs`
- `ArchLucid.Decisioning.Tests/Governance/BundledPolicyPackTestCatalog.cs`

## What to build

1. Confirm the current ASVS release on the OWASP project page before authoring. As far as this prompt's author knows it is 5.0. If it differs, use the current release and record the version in the pack metadata.
2. Add a `PACK_CONTEXTS.md` block. Keep to chapters with an architecture or deployment surface: authentication and session architecture, access control architecture, secure communication, data protection, configuration, logging, and API and web service architecture. Exclude requirements that only code review can check. About 40 rules.
3. Generate and critic the rules file and pack file, add the bundled pack, append it to the manifest, and register it in the test catalog.

ASVS is published under a Creative Commons share-alike license. Do not copy requirement text. Write each rule as an architecture check in your own words and cite the requirement identifier (for example `V9.1.1`) in `frameworkMappings`. Add one line to the pack metadata naming the source and its license.

No rule ships at `Critical`.

## Tests

1. The manifest test sees the new pack.
2. Every rule id is unique across the bundle.
3. Every `frameworkMappings` identifier matches `^V\d+\.\d+\.\d+$`.
4. No rule description contains a sentence copied from ASVS. The critic pass checks this. The test asserts the license line is present in metadata.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'`, then run the bundled pack tests.
- List every requirement identifier you were not certain of in the session summary. Do not guess.
- Do not commit.

## Done when

`owasp-asvs-architecture` is bundled for the current ASVS release, passes the bundle tests, and paraphrases rather than copies ASVS text.
