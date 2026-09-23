> **Scope:** Contributor-reference — copy-paste Composer prompts that put back the useful diagram changes from #3585–#3592 without the layout and icon damage. Internal engineering only.
> **Index:** [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md)
> **Paste files:** [`.cursor/prompts/diagram-restore-00-index.md`](../../.cursor/prompts/diagram-restore-00-index.md) (one numbered file per session).
>
> **Base branch:** `revert/diagram-icon-layout-3585-3592` (`32b3a17eb8`). Do not branch from `master`.

# DRS-01–DRS-04 — Diagram restore

**Observed (2026-09-23):** SecureNow Diagrams looked wrong after #3585 (18×18 PNG pack), #3586 (PNG icons on cards), #3587 (subscription frame removed, edges darkened, crude data-flow columns, outline split), and #3592 (data-flow router repair that left the damaged picture in place). Reverting those four commits restored the demo look.

**Product framing (locked):** Bring back the outline split, readable edge ink, and data-flow stage columns. Icons come from the official Azure Architecture Center SVG zip, not the PNG pack. The subscription frame stays.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| Outline is one flat node list | **DRS-01** | Connected and unconnected resources stay mixed |
| Edges `#94a3b8` on both themes | **DRS-02** | Light edges stay faint. Do not “fix” this by setting dark edges to `#111827`. |
| Data flow uses the inventory packer | **DRS-03** | Data flow stays in resource-group cells. Full subscription must stay as it is. |
| Category pictograms | **DRS-04** | No Azure product marks until the owner places the official SVG zip |
| Replay the four PRs | **DRS-HOLD** | The mangled picture returns |

## Sequencing

| Prompt | Depends on |
|--------|------------|
| **DRS-01** Outline sections | `revert/diagram-icon-layout-3585-3592` |
| **DRS-02** Edge ink | Owner looked at DRS-01, or explicitly skipped it |
| **DRS-03** Data-flow columns | Owner looked at DRS-02, or explicitly skipped it |
| **DRS-04** Official SVGs | Owner looked at DRS-03, or explicitly skipped it, **and** the zip is in `ArchLucid.ArtifactSynthesis/Assets/AzureIcons/source/` |
| **DRS-HOLD** | Not implementation |

**Run one prompt per chat.** Do not commit at the end of a prompt. The owner looks, then says whether to commit.

## Owner work (not agent work)

| When | What the owner does |
|------|---------------------|
| Before DRS-04 | Download the SVG zip from [Azure icons](https://learn.microsoft.com/en-us/azure/architecture/icons/) after accepting Microsoft’s terms there. Put the zip in `ArchLucid.ArtifactSynthesis/Assets/AzureIcons/source/`. July 2026 vintage. Do not send a GitHub mirror. |
| After DRS-01 | Open Diagrams. Confirm outline sections. Confirm the picture is unchanged. |
| After DRS-02 | Restart the API. Look at Full subscription in light and dark mode. |
| After DRS-03 | Restart the API. Look at a Data flow diagram, then Full subscription on the same snapshot. |
| After DRS-04 | Restart the API. Look at one mapped card and one unmapped card, fitted and zoomed. |

Nothing else is required before DRS-01.

## Shared constraints

- Do not cherry-pick `1460498a65`, `f49c801263`, `084b91e2d2`, or `bfc0ca30e7`.
- Do not remove the subscription frame.
- Do not restore PNG icons.
- Do not change viewer zoom in this wave.
- Working-tree safety. No `git add -A`. No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
