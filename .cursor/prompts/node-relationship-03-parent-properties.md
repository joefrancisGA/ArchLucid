# NR-03 — Child resources attach to their parent

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement NR-04 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-02.

## Goal

Attach a resource that is intrinsic configuration or a child of another resource to its proven parent. Show it as a property of that parent and remove the floating node. Keep it unresolved when the parent cannot be proven.

## Categories and parents

- **public IPs:** the NIC, load balancer, firewall, gateway, Bastion host, or NAT gateway that references the address.
- **components:** the Application Gateway, container app, or application that owns the component.
- **namespaces:** the Service Bus, Event Hub, or Relay namespace parent. A topic or queue link remains a relationship from that parent.
- **services:** the API Management instance, container app, or Kubernetes cluster that owns the service.
- **restore point collections:** the protected VM or VM scale set.
- **imagetemplates:** the source image and output image gallery. This is a build definition, not a runtime node.
- **accessconnectors:** the Purview, Data Factory, or Synapse parent, unless the connector contains an explicit external-system reference. That reference becomes an edge.

## What to build

Add one parent-attachment classifier. Use ARM ids and cited resource references to prove the parent. Attach the child as parent detail and remove its standalone node only after that proof.

A public IP referenced by two parents stays attached to both and does not choose one. A child with no proven parent remains an unresolved resource. Do not use resource-group collocation or a shared name as parentage.

## Tests

1. A public IP referenced by one load balancer appears on that load balancer and has no standalone node.
2. A public IP with no IP configuration or parent reference remains unresolved.
3. A Service Bus namespace owns its topics and queues.
4. A restore point collection follows its protected VM.
5. An access connector with an explicit external target emits an edge to that target.
6. Two resources in the same resource group are not treated as parent and child from collocation alone.

## Acceptance criteria

- Parentage comes from a cited ARM reference.
- A missing parent does not drop the child.
- Image templates do not enter the runtime topology.
- No indirect-link or orphan labeling work in this session.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once with `.\scripts\ci\agent-compile-check.ps1` on the affected test project.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

Each listed child is visibly attached to its proven parent, and a child without a parent remains visible as unresolved.
