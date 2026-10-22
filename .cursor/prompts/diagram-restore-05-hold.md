# DRS-HOLD — Written hold (not implementation)

**Wave:** Diagram restore (**DRS**). **Not an implementation prompt.** Paste when a session starts to replay #3585–#3592, remove the subscription frame, or vendor unofficial Azure icons.

## Goal

Keep the diagram that worked for the 2026-09-23 demo, and add back only the slices in DRS-01–04.

## Do not implement from DRS sessions

| Temptation | Hold |
|------------|------|
| `git revert` of `32b3a17eb8`, or `git cherry-pick` of `1460498a65`, `f49c801263`, `084b91e2d2`, or `bfc0ca30e7` | Restores the mangled picture. Use `git show <sha> -- <path>` for a single file. |
| Branching DRS work from `master` | `master` still has the mangled commits. Branch from `revert/diagram-icon-layout-3585-3592` or from the accepted DRS branch. |
| Restoring `Assets/AzureIcons/*.png` | 18×18 bitmaps. Official art is the Architecture Center SVG zip. |
| Downloading icons from GitHub or a portal dump | Owner rule. The zip comes from the Learn page, placed by the owner. |
| Dark edges `#111827` | Invisible on a dark canvas. Dark ink is `#e2e8f0`. |
| `ShouldDraw` returning false for full Azure inventory | Subscription frame stays. |
| Copying `DiagramForestLayoutSvgRenderer.cs` from `bfc0ca30e7` as a whole | That copy omits the subscription frame. Port the `(DataFlow)` branch only. |
| Data-flow column layout on Full subscription | DRS-03 runs only when the title contains `(DataFlow)`. |
| Changing viewer zoom, wheel handling, or fit-to-view in a DRS chat | The owner zoomed the broken card on purpose so it was visible. Zoom is not this wave. |
| Desktop review tab collapse | Workspace rule |
| GTM **M-90 / M-44 / M-91 / M-92**; reopening **TB-135 / TB-136** | Owner/GTM |
| Using an Azure icon as the ArchLucid mark | Microsoft terms |

## Authorized slices

```text
DRS-01 outline sections
    → owner look
        → DRS-02 edge ink
            → owner look
                → DRS-03 data-flow columns only
                    → owner look
                        → DRS-04 official SVGs, after the owner places the zip
```

## When to start a new prompt set instead

A change to Full subscription packing, the subscription frame, or the viewer camera is a new set. Do not fold it into DRS.
