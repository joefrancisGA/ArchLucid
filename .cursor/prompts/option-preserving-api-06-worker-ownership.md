# OP-06 — Worker ownership inventory (still one Worker)

**Do not** add a second Worker project or Container App. **Do not** split SQL. **Do not** change `Hosting:Role`. **Do not** add a second API host.

Depends on **OP-01** capability ids. Can run in parallel with **OP-05**.

## Goal

Name which background loops belong to which capability so a later host split does not leave SecureNow as “an HTTP UI for jobs it does not run.”

Still **one** `ArchLucid.Worker` process calling the same composition root.

## Why

Api vs Worker is already the correct **role** split (ADR 0001). Inventory pull, findings materialization, remediation, outbox, and authority pipeline drain are Worker work. Two HTTP hosts sharing one unnamed Worker is three processes on one catalog with no owner.

## Context

- `docs/architecture/architecture_handbook/41-hosted-services-inventory.md`
- `docs/architecture/adrs/0001-hosting-roles-api-worker-combined.md`
- `ArchLucid.Host.Core/Hosted/*.cs`
- `ArchLucid.Host.Composition/Startup/Modules/HostedServicesCompositionRegistrar*.cs`
- `ArchLucid.Worker/ArchLucid.Worker.csproj` (references Host.Composition only)

## What to build

1. `docs/architecture/data/product-capability-worker-map.json`:

```json
{
  "version": 1,
  "hostedServices": [
    {
      "typeName": "ArchLucid.Host.Core.Hosted.ExampleHostedService",
      "capability": "authority",
      "status": "assigned",
      "ownerNote": null
    }
  ]
}
```

Closed `capability` / `status` sets match OP-01. `platform` = shared drain (outbox infrastructure, archival, leader election, health). `authority` = run pipeline / review jobs. `infra-evidence` = extractor auto-pull, inventory materialization. `governance` = advisory/compliance loops that are not run-pipeline.

2. Discover every `IHostedService` / `BackgroundService` **concrete type** registered for Worker/Combined role (reflection on Host.Core + Host.Composition, or a maintained list plus a test that every discovered type is in the JSON). Prefer discovery + coverage test (same pattern as OP-01 controllers).

3. Architecture test: every discovered hosted service appears exactly once; disputed rows have `ownerNote`.

4. Add a **short** subsection to handbook `41-hosted-services-inventory.md` (10 lines max) pointing at the JSON and stating: one Worker until OP-07/OP-08; do not deploy a second worker by product line.

5. Session summary **must** answer:
   - Who owns Azure extractor auto-pull?
   - Who owns authority pipeline outbox drain?
   - Who owns findings/advisory scans?
   - What stays `platform` because both products break if it stops?

## Acceptance criteria

- Coverage test green.
- Handbook pointer exists.
- `ArchLucid.Worker.csproj` still has no second composition root.
- No Terraform/Container App product-line worker split.

## Constraints

- Do not change scheduler intervals, leader election, or feature flags except if a type was unregistered by mistake (out of scope — do not “fix” production loops).
- One class per file for new test types.
- Do not fork collectors.
- Scoped tests only (`ArchLucid.Architecture.Tests` filter on the new type names).
