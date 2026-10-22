# DCU-05 — Node focus repeats the connector hint

**Wave:** diagram consumption UX (**DCU**). **Depends on:** DCU-01. **Do not** implement another prompt in this session.

Do not implement from the wave index. Implement only *What to build*.

## Goal

When an operator clicks a card, the status line still names that card and adds the authorization or hostname hint already used by the connection-evidence panel when an incident connector needs it.

## Why

`ArchitectureDiagramViewer` sets `clickFocus` from `g.node` and renders “Showing connections for {name}.” The incident edges are already on the outline. The hints live in `INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_AUTHORIZATION_HINT` and `INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_HOSTNAME_HINT`. The status line does not use them, so a Web App included because it **may access** SQL reads like any other card.

## Read first

- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx` — `diagram-click-focus-status`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagram-copy.ts`
- `archlucid-ui/src/lib/infra-evidence/parse-infra-evidence-mermaid-outline.ts`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.test.tsx`

## What to build

1. From the outline edges incident to the focused node id, choose at most one extra sentence:
   - If any incident edge is **May access** or its `inferenceSource` is the app-authorized-access source, append `INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_AUTHORIZATION_HINT`.
   - Else if any incident edge is **Likely connected to** or the hostname-inferred source, append `INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_HOSTNAME_HINT`.
   - Otherwise leave the status line as it is today.
2. Prefer the authorization hint when both kinds are incident. Do not stack both sentences.
3. Keep `aria-live="polite"` on the existing status element. Do not add a second panel.
4. Tests: a focused node with a May access edge includes the authorization hint and does not say traffic was observed. A focused node with only observed structural edges keeps the current sentence and omits both hints.

## Acceptance criteria

- Clicking the Web App on an Executive **May access** fixture shows the card name and the authorization hint.
- Clicking a virtual network with only peering edges does not show that hint.
- Copy stays the shared constants. No new percent and no TLS badge.

## Constraints

- Working-tree safety before tracked edits.
- No collector. No compile change required.
- Stage only this prompt’s paths. **No `git add -A`.**

## Verification

```bash
cd archlucid-ui && npx vitest run src/components/architecture/ArchitectureDiagramViewer.test.tsx
```

Heartbeat every 8s if the run exceeds 15s.

## Done when

Focusing a card that **may access** a store shows the existing authorization hint under the canvas.
