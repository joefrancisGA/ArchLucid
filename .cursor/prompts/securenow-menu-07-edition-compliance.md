# SN-ED-03 — Featured frameworks per SecureNow edition

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md`

**Depends on:** SN-ED-01 and SN-MENU-02. SN-PACK-01 to 03 may or may not be on the branch.

## Goal

The Frameworks page lists a short **Featured** set first, chosen by edition, then every other bundled pack. Generic features NIST SP 800-53, OWASP ASVS, the Microsoft cloud security benchmark, and organization packs. UHG features ARC-AMPE first.

## Why

The owner wants generic SecureNow to be framework-neutral, with NIST, OWASP ASVS, and the Microsoft cloud security benchmark in focus. The UHG edition's compliance analysts care most about ARC-AMPE. Today the sidebar group itself is named `ARC-AMPE Compliance`, which SN-MENU-01 and 02 already removed.

## Read first

- `ArchLucid.Application/Governance/DefaultPolicyPacks/Bundled/bundled-policy-packs-v1.manifest.json`
- `ArchLucid.Application/Governance/DefaultPolicyPacks/Bundled/arc-ampe-architecture-themes.json`
- The service that seeds bundled pack assignments (search `bundled-policy-packs-v1.manifest`)
- `docs/library/POLICY_PACK_ARC_AMPE_DESIGN.md` § Assignment
- The SecureNow policy packs page under `archlucid-ui/src/app/(operator)/compliance/policy-packs/`
- `archlucid-ui/src/lib/product-line/securenow-policy-packs-route-safety.test.ts`
- `archlucid-ui/src/lib/product-line/securenow-compliance-home-copy.ts`
- The SN-ED-01 edition modules

## What to build

### Featured list per edition

Add `archlucid-ui/src/lib/editions/securenow-featured-frameworks.ts` that returns an ordered list of pack ids for an edition, through an exhaustive switch:

| Edition | Featured pack ids, in order |
|---------|-----------------------------|
| `generic` | NIST SP 800-53 Rev. 5 (SN-PACK-01), OWASP ASVS (SN-PACK-02), Microsoft cloud security benchmark (SN-PACK-03), `security-architecture-baseline`, `cis-azure-foundations`, `nist-csf-2-architecture` |
| `uhg` | `arc-ampe-architecture-themes`, then the generic list |

Put the UHG list in `archlucid-ui/src/lib/editions/uhg/` and import it from the switch, so UHG-specific choices stay in the UHG folder.

Use the pack ids from the manifest. A featured id that is not bundled yet is skipped silently in the UI and listed in a unit test as expected-missing until its SN-PACK prompt lands. Update that test when a pack lands.

### Frameworks page

In the SecureNow shell, the page shows a `Featured` section with the featured packs in order, then `All frameworks` with the rest in the current order. Assignment, enable, and disable controls do not change. Organization packs (custom packs the tenant created) appear in Featured after the bundled featured packs, with an `Organization` `StatusTag`.

The Architecture shell page is unchanged.

### Default assignment per edition

Find where bundled packs are assigned at tenant creation. Read `SecureNow:Edition` there:

- `Uhg`: ARC-AMPE stays enabled by default, as today.
- `Generic`: ARC-AMPE is bundled but not enabled by default. The generic featured packs that exist are enabled by default.

If that seeding path is shared with the Architecture product, keep Architecture behavior exactly as today and add the edition rule only for SecureNow tenants. If you cannot tell a SecureNow tenant from an Architecture tenant at seed time, stop and report what you found. Do not guess.

## Tests

1. Generic featured list order equals the table, minus packs not bundled yet.
2. UHG featured list starts with `arc-ampe-architecture-themes`.
3. The Frameworks page in the SecureNow shell renders Featured before All frameworks, and an organization pack appears in Featured with the `Organization` tag.
4. The Architecture shell page is unchanged.
5. Seeding with `Uhg` enables ARC-AMPE. Seeding with `Generic` leaves it bundled and disabled. Architecture seeding is unchanged.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- One class per file. No `ConfigureAwait(false)` in tests. Prefer explicit types over `var`.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`
- From `archlucid-ui`, run the Vitest files you touched and `npx tsc --noEmit -p tsconfig.json`.
- Do not author pack content in this session. SN-PACK-01 to 04 do that.
- Do not commit.

## Done when

Generic SecureNow features NIST SP 800-53, OWASP ASVS, the Microsoft cloud security benchmark, and organization packs. UHG SecureNow features ARC-AMPE first. Architecture is unchanged.
