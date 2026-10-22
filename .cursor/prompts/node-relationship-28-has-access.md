# NR-28 — A role on one resource is Has access

**Model:** Composer 2.5 (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier model. Do not implement NR-29 in this session.

**Repo:** `c:\ArchLucid`

**Depends on:** NR-11. Do not re-run NR-01 through NR-27. Do not edit the NR index. Do not add a collector. NR-31 collects role assignments.

## Goal

A stored role assignment scoped to one resource draws a solid line labeled **Has access** from the identity's workload to that resource. An assignment scoped to a resource group or the subscription is outline only.

## Why

A subscription Reader assignment would draw a line from one identity to every resource and collapse the component count. The owner limited lines to a single resource.

## What to build

When the snapshot already contains a role assignment:

- Scope is one resource, and both the principal's workload and that resource are on the diagram: one solid line, label **Has access**.
- Scope is a resource group: no line. Outline: `Has {role} on resource group {name}`.
- Scope is the subscription: no line. Outline: `Has {role} on this subscription`.
- Several workloads sharing one identity each get their own line when the scope is one resource.

If the snapshot has no role assignments, draw nothing and add no outline rows. Do not guess access because an app and a Key Vault share a resource group. That guess stays with NR-29.

Do not call Azure. Do not read app settings. Do not treat this line as dashed.

## Tests

1. A stored role assignment on one Key Vault, for a virtual machine's managed identity, draws a solid `Has access` line. It is not dashed.
2. A stored Contributor assignment on the resource group draws no line. The outline says `Has Contributor on resource group {name}`.
3. A stored Reader assignment on the subscription draws no line. The outline says `Has Reader on this subscription`.
4. A graph with no role-assignment rows gains no **Has access** line.

## Acceptance criteria

- Single-resource assignments are solid **Has access** lines.
- Resource-group and subscription assignments are outline sentences.
- Missing role data does not become a guessed line.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run the new access tests.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.
- A blank line before `if` and `foreach` unless it is the first line in the method.
- Prefer concrete types over `var`.

## Done when

Only a role assignment stored against one resource becomes a solid **Has access** line, and broader assignments stay in the outline.
