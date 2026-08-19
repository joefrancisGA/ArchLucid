> **Scope:** Optional post-V1 Terraform `state mv` if an environment later merges leaf roots. V1 ships 3-wave orchestration without moving state.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Terraform composition — optional `state mv` (post-V1)

**Last reviewed:** 2026-08-16

**Priority:** P3. V1 does **not** require this runbook to execute.

## 1. Objective

Document how an operator **could** merge leaf Terraform state into fewer backends after V1, if blast-radius ownership later favors fewer apply steps. Until then, **greenfield applies only** — see [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §3. `terraform state mv` is **not applicable pre-release**.

## 2. What V1 ships instead

Three **metadata** composition roots (`infra/terraform-foundation`, `infra/terraform-platform`, `infra/terraform-app`) describe operator waves. They have **no providers and no Azure resources**. [`infra/apply-saas.ps1`](../../infra/apply-saas.ps1) `-MultiRoot` validates those roots, then Azure-applies **leaf** directories in wave order. Each leaf keeps its own backend and resource addresses.

Landing-zone scripts wrap `apply-saas.ps1 -MultiRoot`. Canonical leaf order: [`REFERENCE_SAAS_STACK_ORDER.md`](../library/REFERENCE_SAAS_STACK_ORDER.md).

## 3. Blast-radius trade-off

| Shape | Operator steps | Failure isolation | When to prefer |
|-------|----------------|-------------------|----------------|
| **16 isolated leaf applies** (legacy `-LegacyLeafRoots`, includes orchestrator) | Many | One root's apply cannot rewrite another root's state | Team ownership, smallest rollback |
| **3 operator waves, still 15 leaf states** (hosted MultiRoot; V1) | Three conceptual waves; still one apply per leaf | Same isolation as today | Default hosted path |
| **Merged composition backends** (this runbook; post-V1) | ~3 Azure applies | A failed wave apply can touch every resource in that wave's state | Only after owner accepts larger plans |

Nested `module "x" { source = "../terraform-x" }` was **rejected** for V1: several leaves keep `backend "azurerm"`, and wrapping them as modules would change addresses even without `state mv`.

## 4. Security, scale, reliability, cost

- **Security:** Composition roots add no Azure principals, networks, or secrets. Azure apply stays on existing leaf roots (Entra ID identities, private endpoints, Key Vault). Least privilege is unchanged.
- **Scalability:** Wave metadata is documentation + script order. Scale remains per-leaf SKUs and existing modules. No new vendors.
- **Reliability:** Isolated leaf state keeps rollback blast radius per stack. Merging state (this runbook) **increases** blast radius; do not run it on production without change control.
- **Cost:** Metadata roots have no providers, so they add **no Azure spend**. Merged backends do not change Azure SKUs by themselves.

Azure-native: identity is Entra ID; storage, networking, and compute stay in the existing leaf roots.

## 5. When `state mv` becomes applicable

Only after **all** of:

1. V1 is released and at least one environment has live leaf state.
2. Owner accepts larger plan/apply per wave.
3. Child roots that today declare `backend "azurerm"` are converted to modules **or** their state is moved into a wave backend with a reviewed address map.
4. A per-environment dry-run `terraform plan` after `state mv` shows **no unexpected destroys**.

Until then, skip this section.

## 6. Sketch (do not run pre-release)

If a later program merges a wave:

1. Snapshot current leaf state (`terraform state pull`) per leaf in that wave.
2. Stand up the target backend; `terraform init`.
3. For each resource, `terraform state mv` from the leaf address to the composition-module address **only after** the configuration graph matches.
4. `terraform plan` must be empty (or additive-only) before apply.
5. Keep leaf directories read-only until cutover is proven; then archive them.

Exact addresses depend on how modules are wired — do **not** copy a canned mv list from this file.

## 7. Related

- [`REFERENCE_SAAS_STACK_ORDER.md`](../library/REFERENCE_SAAS_STACK_ORDER.md)
- [`DEPLOYMENT_TERRAFORM.md`](../library/DEPLOYMENT_TERRAFORM.md)
- [`LANDING_ZONE_PROVISIONING.md`](../library/LANDING_ZONE_PROVISIONING.md)
- [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §3
