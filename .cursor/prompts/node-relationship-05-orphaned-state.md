# NR-05 — Orphaned is not unconnected

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement NR-06 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-04.

## Goal

Classify a resource as **orphaned** only when its required parent or required endpoint is absent from current Azure metadata. Classify it as **unconnected** when it is structurally valid and merely has no optional relationship.

## Why

Unconnected currently mixes broken required structure with valid isolated resources. The display needs the missing requirement, for example: **Orphaned: protected virtual machine no longer exists.**

## Orphaned

Current Azure or ARM metadata must prove the absence or the unresolved id:

- A public IP with no IP configuration or parent reference.
- A route table with no subnet association, or a route whose next hop does not resolve.
- An NSG associated with neither a subnet nor a NIC.
- A connection whose source or destination does not resolve.
- A restore point collection whose protected VM or VM scale set is gone.
- A private endpoint or private-link association whose target is gone.
- A Bastion host, firewall, or gateway whose required subnet or VNet is gone.
- A load-balancer frontend, backend, or NAT rule whose referenced resource is gone.
- A namespace, component, or child service whose parent is gone.
- A host-pool child whose parent host pool is gone.
- A workflow action whose target is deleted. The workflow itself remains valid.

## Unconnected

The resource remains valid while standing alone:

- Storage account, Key Vault, registry, Redis, or MySQL without a consumer or private endpoint.
- VM or VM scale set without an application or load-balancer relationship.
- Static site, Grafana, Fabric capacity, or Kubernetes cluster without a proven consumer or dependency.
- Workflow with no external action.
- Image template without a resolvable produced image.

## Evidence boundary

Only current Azure metadata or an ARM reference can produce **orphaned**. IaC and logs may show a former relationship as **Configured** or **Observed**. They must not prove orphaned.

## What to build

Add one classifier that returns orphaned or unconnected, plus the missing requirement when orphaned. Surface that text on the unresolved resource. Do not drop the resource.

## Tests

1. A restore point collection whose VM id does not resolve is orphaned and names the missing VM.
2. A storage account with no optional relationships is unconnected.
3. A deleted workflow target marks that action unresolved while the workflow remains.
4. An IaC reference to a missing target is **Configured**, not orphaned.
5. A log reference to a missing target is **Observed**, not orphaned.

## Acceptance criteria

- The two states are mutually exclusive.
- The orphaned message names the missing requirement.
- Historical evidence cannot create the orphaned state.
- No AVD or data-flow display work in this session.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once with `.\scripts\ci\agent-compile-check.ps1` on the affected test project.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

A reviewer can tell whether a resource needs its required parent restored or whether it is valid without any optional relationships.
