# DAU-09 — Natural-language patches on ArchitectureDiagramModel

**Wave:** diagram-ai-usability (**DAU**). **Depends on:** DAU-01. **Do not** implement DAU-10–DAU-12.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Architects can say “add a Key Vault in the private subnet and connect it to the API” and receive a **proposed patch** to `ArchitectureDiagramModel` / `ArchitectureDiagramModelRecord` (nodes/edges with provenance `inferred` until accepted). Saving writes the model, then Mermaid is **re-emitted from the model**. The LLM never becomes the Mermaid of record.

## Why

`ArchitectureDiagramEditor` is a Mermaid textarea. IA assessment: no modeling canvas; creation is form + text + import. A canvas is out of wave. NL patches close the authoring gap without Lucid.

## Context

- `archlucid-ui/src/lib/architecture/architecture-diagram-types.ts`
- `archlucid-ui/src/lib/architecture/architecture-diagram-model.ts`
- `archlucid-ui/src/lib/architecture/architecture-diagram-mermaid.ts`
- `archlucid-ui/src/lib/architecture/use-architecture-diagram-panel.ts` (path may be `components/architecture/use-architecture-diagram-panel.ts`)
- `archlucid-ui/src/components/architecture/ArchitectureDiagramEditor.tsx`
- API: `POST/GET /v1/architecture/runs/{runId}/diagrams/model` (generated paths)
- Provenance: `user-drawn` vs `inferred` vs evidence-backed
- IPromptRedactor; Simulator mode
- ADR 0101 / 0084 — do not mint Azure resources; review diagram ≠ inventory ObservedFact

Prefer **client-side patch apply** on the in-memory model for drafts, plus persist through the existing model endpoint if the run already stores a server model. Do not add a third model family.

## What to build

1. `ArchitectureDiagramPatch` types: add/remove/relabel node; add/remove edge; fields id/label/kind/sourceId/targetId. Each patch has `provenance` and `accepted: false` by default.
2. `applyArchitectureDiagramPatches(model, patches)` pure function — immutable; unknown ids on remove ⇒ no-op + warning, not throw.
3. `proposeArchitectureDiagramPatchesFromText(prompt, model)`:
   - Simulator: keyword/template parser for “add X”, “remove Y”, “connect A to B” against existing labels (and new labels as inferred nodes).
   - Real: LLM JSON schema of patches; **validate** every `sourceId`/`targetId` except for add-node (new ids prefixed `patch-`); drop patches that reference unknown ids; IPromptRedactor on the prompt.
4. UI on Architecture diagram ready view: disclosure **Describe a change** (not a new review tab). Textarea + disabled primary until non-empty (TB-2005). Preview list of patches with Accept / Discard. Accept calls existing `onNodeOverride` / save mermaid-from-model path. Version source `user-edit`.
5. Keep **Edit Mermaid source** as the power-user disclosure. Do not remove it.
6. Tests: apply add+edge; reject edge to missing node; Simulator “connect A to B” when A/B exist; mermaid emit still `flowchart`/`graph` valid.

## Acceptance criteria

- After accept, mermaid is `architectureDiagramModelToMermaid(patchedModel)`, not the LLM’s mermaid fence.
- New nodes are `inferred` until accepted, then `user-drawn` or accepted inferred per existing inferred panel rules — pick one and test it; do not mark them evidence-backed.
- Sealed/committed review: `canEdit` false already locks the editor; patches stay locked too.

## Constraints

- Working-tree safety script before tracked edits.
- **Do not** implement 3-way regenerate merge (DAU-10) beyond leaving `user-edit` version source intact.
- **Do not** POST vision. **Do not** write inventory ARM ids.
- One class/file on C# if you add a server propose endpoint; prefer UI+pure TS if the model is still device-local (`architecture-diagram-storage.ts`). If both local and server models exist, patch the same structure both use.
- Verification: focused Vitest on model/mermaid/panel. Scoped `dotnet test` only if you add a C# propose endpoint.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
