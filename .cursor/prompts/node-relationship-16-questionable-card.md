# NR-16 — A questionable card is yellow, and the reason is a policy-pack finding

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-15. Do not re-run NR-01 through NR-15. Do not add a name-prefix matcher to AVD identification.

## Goal

A resource that an assigned policy pack marks as questionable keeps its place on the diagram, with a light-to-medium yellow card. A click shows why it is questionable and the action a person should take. The reader is not asked to answer. The rule "a virtual machine whose name starts with `AVD` and is not a collected session host" exists only as pack content for UHG. It is not a general diagram rule.

## Why

`avd01-nprod-0` is on the plate because no session host record names it. That is a UHG naming leftover, not an Azure fact, so `InventoryDiagramAvdScopeResolver` must not treat a name prefix as identification. The owner wants the card color and the click panel for any pack that marks a resource questionable, and wants this one predicate to fire only when the UHG pack is assigned.

Every inventory card currently shares one fill: `[&_svg_g.node>rect.node-card]:fill-[var(--arch-diagram-node-fill)]` in `ArchitectureDiagramViewer.tsx`. A presentation attribute on the rect loses to that rule. Clicking a forest card dims the rest of the neighborhood (`diagram-click-dim`) and does not explain the card.

## What to build

### Yellow card and click panel (general)

Add an optional attention record on the diagram node, with a reason and one recommended action. A node with that record:

- Adds class `node-card-questionable` on its card rect.
- Sets the card fill to `#FDE68A` in the SVG so a PNG export stays yellow.
- Adds a CSS exception in `ArchitectureDiagramViewer.tsx` with higher specificity than the shared `node-card` fill, so the viewer does not paint the card back to the normal fill. Light mode uses `#FDE68A`. Dark mode uses `#A16207`. Keep the existing label text colors readable on both.
- Draws the word `Questionable` on the card. Color is not the only signal.
- Puts the reason on the node group's title or `aria-label`.

Clicking that card still runs the existing neighborhood focus. Beside the diagram, not in a modal, render a panel when the focused node has attention:

- `data-testid="infra-diagrams-questionable-panel"`
- The reason, then the recommended action.
- A close control that hides the panel. Closing it does not clear the neighborhood focus.

No text input, no checkbox, no Save, and no step the reader must finish. A node without attention keeps the normal card and opens no panel.

Do not add a connection-state enum value. Do not hide the node. Do not move it into Shared services.

### UHG rule (pack content only)

Rule key: `uhg-avd-vm-not-in-host-pool`.

Evaluate it only when the assigned policy pack's `complianceRuleKeys` contain that key. `PolicyPackAssignmentComplianceRuleKeysResolver` already reads those keys from published `ContentJson`. When the key is absent, return no attention rows.

When the key is present, mark a `Microsoft.Compute/virtualMachines` node when all of these are true:

- The virtual machine name starts with `avd`, compared ordinal-ignore-case. Do not use contains.
- The snapshot has at least one session host (`Microsoft.DesktopVirtualization/hostPools/sessionHosts`). If it has none, return no attention rows.
- No collected session host names the machine. A session host names it when `properties.resourceId` or `vmResourceId` equals the virtual machine ARM id, or when the session host name before the first `.` equals the virtual machine name, ordinal-ignore-case.

Reason: `This virtual machine is named like a UHG session host and is not registered in any session host collected for this snapshot.`

Recommended action: `Confirm whether it should be registered to a host pool, kept as an image or management machine, or retired.`

Ship the pack document at `templates/policy-packs/uhg/uhg-unregistered-avd-session-host.pack.json` with that single `complianceRuleKeys` entry. Do not name the file `compliance-rules.json`. Do not add the key to `default-compliance.rules.json`, `ga-starter-compliance.rules.json`, or any platform bundled pack. Do not seed it from `DefaultPolicyPackSeeder`.

Do not change `InventoryDiagramAvdScopeResolver`, `IncludeAvdAssets`, or `DiagramMode.Avd`. A name that starts with `avd` stays on the general diagram. Show AVD Assets is unrelated to this color.

## Tests

1. A node given an attention record renders `node-card-questionable`, fill `#FDE68A`, and the word `Questionable`. A click shows the reason and the recommended action in `infra-diagrams-questionable-panel`. The neighborhood dim still applies. There is no input and no Save.
2. A node without attention has no `node-card-questionable` class and no panel.
3. With the rule key assigned, virtual machine `avd01-nprod-0` is marked when the snapshot has other session hosts and none name it. The reason and action are the sentences above.
4. The same virtual machine is not marked when a session host is named `avd01-nprod-0.contoso.com`, or when a session host `resourceId` is that virtual machine's ARM id.
5. Virtual machine `web01` is not marked. A snapshot with zero session hosts marks nothing, including `avd01-nprod-0`.
6. Without the rule key, `avd01-nprod-0` gets no attention.
7. `default-compliance.rules.json` and `ga-starter-compliance.rules.json` do not contain `uhg-avd-vm-not-in-host-pool`.
8. A virtual machine whose name contains `avd` and that has no session-host edge remains on Full subscription. The existing NR-15 identification tests still pass.

## Acceptance criteria

- Any assigned pack can turn a card yellow by supplying a reason and a recommended action.
- The click panel states both and does not ask for an answer.
- The UHG predicate runs only when `uhg-avd-vm-not-in-host-pool` is assigned.
- The virtual machine stays on the diagram.
- AVD identification does not gain a name-prefix rule.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run the new attention tests, `InventoryDiagramAvdIsolationApplierTests`, and the diagram viewer test that covers the panel.
- Do not commit. Do not edit unrelated dirty files.
- Do not add an icon pack. Do not collect new Azure data. Do not change the session-host extractor.
- Do not add a route or a tab. Do not collapse workspace tabs.

## Done when

With the UHG rule key assigned, `avd01-nprod-0` is a yellow card that stays on the plate, and a click shows why it is questionable and what a person should confirm. The same card is the normal color when that key is not assigned.
