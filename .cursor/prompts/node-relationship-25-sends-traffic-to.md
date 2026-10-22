# NR-25 — A load balancer line names each backend

**Model:** Composer 2.5 (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier model. Do not implement NR-26 in this session.

**Repo:** `c:\ArchLucid`

**Depends on:** NR-20. Do not re-run NR-01 through NR-24. Do not edit the NR index.

## Goal

A load balancer or Application Gateway with a stored backend pool draws one line to each backend resource, labeled **Sends traffic to**. When a load-balancing rule stores a port, the line includes that port.

## Why

Backend pools point at a network interface IP configuration or an app address. Full subscription hides the network interface, so the pool member disappears and the load balancer looks unused.

## What to build

From a stored backend pool, resolve each member to a visible resource:

- A network interface IP configuration resolves to that interface's virtual machine or scale set.
- An address that matches a visible application resolves to that application.
- The line runs from the load balancer or Application Gateway to that resource.
- The label is **Sends traffic to**.
- Append the port from the stored load-balancing rule when the rule and the pool are the same backend. Do not guess a port.
- One member produces one line. Do not also keep an NR-20 generic line for the same pair.

A member whose resource is not in the snapshot does not get a card in this session. Keep the stored target id for NR-27.

Do not draw a line from a pool that has no stored members. Do not use resource-group membership as a backend.

## Tests

1. A load balancer pool member is a virtual machine network interface. Full subscription hides the interface. One line from the load balancer to the virtual machine reads `Sends traffic to`.
2. The load-balancing rule for that pool stores port 443. The line includes 443.
3. A rule with no port stores no port on the line.
4. An Application Gateway backend to a visible app uses the same label.
5. A load balancer with an empty pool draws no backend line.

## Acceptance criteria

- Each stored backend is a **Sends traffic to** line.
- The port appears only when a rule stored it.
- Hidden network interfaces are not required on the plate.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run the new backend tests.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.
- A blank line before `if` and `foreach` unless it is the first line in the method.
- Prefer concrete types over `var`.

## Done when

A load balancer or Application Gateway shows a line to each stored backend, with the rule's port when one was stored.
