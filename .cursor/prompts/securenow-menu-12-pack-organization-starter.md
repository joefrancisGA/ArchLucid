# SN-PACK-04 — Organization policy and architecture pack starter

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md`

**Depends on:** SN-ED-03. Featured frameworks and the `Organization` tag already exist.

## Goal

From the Frameworks page, a security architect can start an organization pack from a starter template that covers the common shapes of internal policy: approved regions, approved services, network boundaries, identity rules, data classification handling, and required tags. The pack then works like any other assigned pack.

## Why

The owner wants organization policy and architecture standards to live in policy packs beside NIST, ASVS, and MCSB. Custom pack creation may already exist. This prompt reuses it rather than building a second editor.

## Read first

- The SecureNow Frameworks page under `archlucid-ui/src/app/(operator)/compliance/policy-packs/`
- The policy pack create, publish, and assign API (`PolicyPacksController` and its app service; see `ArchLucid.Api.Tests/PolicyPacksControllerPublishAssignScopeTests.cs`)
- `ArchLucid.Application/Governance/IPolicyPackRuleTemplatesService.cs`
- `docs/samples/policy-packs/security-architecture-baseline-rules-v1.json`
- `templates/policy-packs/` for existing starter templates

## What to build

1. Find the existing custom pack creation path. If there is none, stop and report what exists. Do not build a pack editor in this session.
2. Add a starter template, `organization-security-architecture-starter`, beside the existing templates. It contains about 12 parameterized rules, two per shape listed in the goal, each with a placeholder the architect fills in (for example the allowed region list). Rule ids use the prefix `org-`.
3. On the SecureNow Frameworks page, add an outline `Start an organization pack` action that opens the existing create path with this template preselected. No new modal if the create path already has one.
4. A pack created from the template carries the `Organization` tag from SN-ED-03.

Follow the form validation rule: the create action stays disabled until every required placeholder has a value, and errors show on the form, not as toasts.

## Tests

1. The template loads through the rule templates service and every rule id starts with `org-`.
2. `Start an organization pack` opens the create path with the template selected.
3. Create stays disabled while a required placeholder is empty.
4. A pack created from the template shows in Featured with the `Organization` tag.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- One class per file. No `ConfigureAwait(false)` in tests.
- If C# changed, compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`
- From `archlucid-ui`, run the Vitest files you touched and `npx tsc --noEmit -p tsconfig.json`.
- No new pack editor, no AI rule drafting.
- Do not commit.

## Done when

A security architect can start an organization pack from a starter template on the Frameworks page, fill in the placeholders, and assign it like any other pack.
