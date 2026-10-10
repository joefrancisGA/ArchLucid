# SN-DEP-01 — ADR: SecureNow in-tenant deployment

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md`

**Depends on:** SN-COL-01 (Proposed or Accepted). **Design only. Do not write product code or Terraform in this session.**

## Goal

One proposed ADR that decides how SecureNow is deployed into a customer's own Azure tenant, while ArchLucid stays multi-tenant PaaS, and how far the two deployment models may diverge.

## Why

The owner expects SecureNow customers to require deployment into their own tenant. ArchLucid is PaaS reachable from anywhere. Today both product lines share one Next.js app and one API host, selected by `NEXT_PUBLIC_ARCHLUCID_PRODUCT`, with SN-ED-01 adding a SecureNow edition. The Terraform roots under `infra/` describe the ArchLucid-hosted platform.

## Read first

- `docs/library/DEPLOYMENT_TERRAFORM.md`, `DEPLOYMENT_RUNBOOK.md`, `DEPLOYMENT_CD_PIPELINE.md`
- `docs/library/TENANT_DATABASE_TOPOLOGY.md`, `MULTI_TENANT_PORTFOLIO.md`, `PER_TENANT_COST_MODEL.md`
- `infra/README.md`, `infra/terraform-container-apps/`, `infra/terraform-private/`, `infra/terraform-entra/`, `infra/terraform-openai/`, `infra/terraform-sql-app/`, `infra/terraform-storage/`, `infra/terraform-keyvault/`
- `infra/terraform-analysis-sandbox/README.md` (a disposable SecureNow footprint, not production)
- `docs/architecture/OPTION_PRESERVING_API_SPLIT_COMPOSER_PROMPTS.md`
- The SN-COL-01 ADR and the SN-ED-01 edition setting
- `docs/architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md`

## What to write

`docs/architecture/adrs/<next number>-securenow-in-tenant-deployment.md`, status **Proposed**, using the repo template. Take the next free number after SN-COL-01's ADR. Add it to the ADR index.

Cover each point with trade-offs, constraints, and expected impact:

1. **Inputs, outputs, boundary.** What runs in the customer tenant, what (if anything) talks to ArchLucid, and what never leaves the tenant.
2. **Same build or a separate build.** One image set configured by product line, edition, and a new hosting mode, compared with separate SecureNow images. Recommend one. Include the effect on the UHG edition's separation and on the SN-07 and SN-ED-02 leak guards.
3. **Hosting mode setting.** Name it (for example `SecureNow:Hosting` = `ArchLucidHosted` or `InTenant`) and list what it switches: billing, trial, vendor Internal navigation, telemetry export, support access, and update checks.
4. **Single-tenant inside a multi-tenant codebase.** How one customer's instance runs with one tenant row while keeping the scoping and isolation checks in place, not removing them.
5. **Platform services.** Container Apps or App Service, Azure SQL, storage, Key Vault, Azure OpenAI in the customer's subscription, Entra ID in the customer's tenant, private endpoints, and no public ingress by default.
6. **Identity.** Customer Entra ID app registrations, managed identities for every service-to-service call, and no shared secrets in configuration.
7. **Updates.** How the customer receives new versions (pull from a registry the customer trusts, signed images, version pinning), and who runs migrations.
8. **Telemetry and support.** Default to no outbound telemetry for the UHG edition. State what generic in-tenant installs may send, with opt-in.
9. **Security, scalability, reliability, cost.** Each one explicitly, including an order-of-magnitude monthly cost for a small install with assumptions stated.
10. **Terraform.** The root and modules SN-DEP-02 will build, reusing existing modules where they fit and naming the ones that need a new variable rather than a fork.
11. **Divergence budget.** What may differ between ArchLucid-hosted and in-tenant (configuration, Terraform roots, Administration pages) and what must not (domain logic, API contracts, schema).
12. **Evolution.** What changes if a customer later wants AWS or GCP collection, without designing it.

State any uncertainty plainly.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Docs only.
- No legal statements about intellectual property.
- Do not commit.

## Done when

A Proposed ADR exists that decides build shape, hosting mode, platform services, identity, updates, telemetry, Terraform scope, and the divergence budget for in-tenant SecureNow.
