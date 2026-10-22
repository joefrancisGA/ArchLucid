# EU-UP-01 — Show extract-upload progress on the drop target and the page status

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not add a spinner. Do not introduce a green or brighter accent for in-progress state.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/EXTRACT_UPLOAD_VISIBLE_PROGRESS_LUNA_PROMPTS.md`

**Depends on:** `InventoryZipDropZone` still renders `AzureExtractorUploadProgressBar` as a sibling under the dashed target, and only while `busy` is true.

## Goal

During an upload on Extract & upload, the person can see that the package is still being accepted. The dashed drop target they just used says so, in the existing teal sweep. The page status says `Uploading package…` until that request finishes. The demo button in the sticky aside says the same sentence while that request is the one they started.

## Why

`AzureExtractorUploadProgressBar` is mounted after the drop surface, after the hidden file inputs, and after **Select extractor folder instead of ZIP**. On Extract & upload, Step 2 is the last card in the main column. The accepted-package panel, the checklist, and Step 1 sit above it. When the drop target is already at the bottom of the viewport, the bar is born below the visible page.

While `busy` is true the target also gets `opacity-60` and `cursor-not-allowed`. The control the person is watching gets quieter. The only new signal is the 6px bar underneath it (`h-1.5`). Its label defaults to `Reading inventory package…`.

This page does not know a percent. `useExtractUploadUpload` posts with `fetch` and never reports loaded bytes, so the bar is `IndeterminateProgressSweep` (`role="progressbar"`, accent `--al-accent-interactive`). A spinner would say the same thing and drop the percent on any caller that can pass one. Green already means finished on this page: the header **Inventory on file** tag, the checklist **Done** chips, and **Package accepted**. A brighter green in-flight mark would read as accepted before the server accepts the package.

**Try with Demo Data** calls the same `onUpload` and sets the same `upload.busy`. The button lives in the sticky aside. That aside can stay on screen after the header has scrolled away and before Step 2 has reached the viewport. A status change only on the header misses that click. A change only inside Step 2 misses it too.

`InventoryZipDropZone` is also the wizard ZIP field (`Tier1InventoryZipUploadPanel`, `AzureExtractorPackageZipField`) and `ExtractUploadZipDropShell`. The in-target move applies to every caller. The header sentence and the demo-button sentence are Extract & upload only.

## Read first

- `archlucid-ui/src/components/InventoryZipDropZone.tsx` (the dashed surface, `opacity-60`, the sibling `AzureExtractorUploadProgressBar`)
- `archlucid-ui/src/components/AzureExtractorUploadProgressBar.tsx`
- `archlucid-ui/src/components/ui/indeterminate-progress-sweep.tsx`
- `archlucid-ui/src/components/AzureExtractorZipDropZone.test.tsx`
- `archlucid-ui/src/app/(operator)/administration/extract-upload/_sections/ExtractUploadSettingsPageClient.tsx` (Step 2, `upload.busy`, `showAcceptedDropZone`, the demo button)
- `archlucid-ui/src/app/(operator)/administration/extract-upload/_sections/ExtractUploadSettingsPageHeader.tsx` (`inventoryStatusPresentation`)
- `archlucid-ui/src/lib/extract-upload-settings-page-copy.ts` (the inventory status labels)
- `archlucid-ui/src/app/(operator)/administration/extract-upload/_sections/use-extract-upload-upload.ts` (`fetch`, no upload progress)
- `archlucid-ui/src/app/(operator)/administration/extract-upload/_sections/use-extract-upload-demo.ts` (`onTryDemoData` awaits `onUpload`)
- `archlucid-ui/src/components/wizard/Tier1InventoryZipUploadPanel.tsx` (a second bar, test id `${dropzoneTestId}-validation-progress`, different label)
- `archlucid-ui/src/app/globals.css` (`.al-indeterminate-sweep` already stops under `prefers-reduced-motion`)

## What to build

1. While `busy` is true, the dashed target shows `busyLabel` as its primary sentence and renders `AzureExtractorUploadProgressBar` inside that target. The progress test id stays `${testId}-progress` (default `inventory-zip-drop-progress`). The cloud icon and `Drag and drop your inventory ZIP here` are absent while `busy` is true. The bar is not a sibling after the folder button. The target stays `aria-disabled`. It does not take `opacity-60` while `busy` is true. A target that is `disabled` and not `busy` may stay faded.

2. Add an optional `percent` on `InventoryZipDropZone` and pass it through to `AzureExtractorUploadProgressBar`. When `percent` is omitted, the bar stays the indeterminate sweep. Extract & upload does not pass `percent`. Do not replace this page's `fetch` with an XHR progress client in this session.

3. On Extract & upload, while `upload.busy` is true, the header status tag (`extract-upload-header-inventory-status`) uses kind `in-progress` and the label `Uploading package…`. Put that label in `extract-upload-settings-page-copy.ts` next to the other inventory status labels. When `upload.busy` is false, `inventoryStatusPresentation` is unchanged: **Checking inventory…**, **Inventory on file**, or **No inventory on file**. Upload-busy wins over baseline loading. After the request settles, including a successful accept, the header returns to that inventory label. **Package accepted** stays the Step 2 summary. Do not leave the header on `Uploading package…` after `busy` is false.

4. While `upload.busy` is true, the **Try with Demo Data** button (`extract-upload-try-demo-data`) shows `Uploading package…` and stays disabled. When `busy` is false it shows `Try with Demo Data` again. Do not add an icon spinner on that button.

Keep the sweep color `bg-[var(--al-accent-interactive)]`. Keep a determinate fill at `bg-teal-700` and `dark:bg-teal-500`. Do not add `emerald`, `green`, or a new accent. Do not add a spinner component. Do not call `scrollIntoView` when `busy` flips true.

Leave the wizard's second bar in place (`Validating manifest.json and resources.json…`, test id ending in `-validation-progress`). That label is a different fact from the drop target's `busyLabel`. Do not delete it and do not restyle it.

`ExtractUploadFileProgressList` stays under the drop zone for folder selection. Do not move that list into the header.

## Tests

Extend `archlucid-ui/src/components/AzureExtractorZipDropZone.test.tsx`.

1. With `busy` and `busyLabel` `Uploading…`, `drop-zone-surface` contains `drop-zone-progress`, the surface shows `Uploading…`, and it does not show `Drag and drop your inventory ZIP here`. The surface class does not include `opacity-60`.
2. Without `busy`, the surface shows `Drag and drop your inventory ZIP here` and `drop-zone-progress` is absent.

Extend `archlucid-ui/src/app/(operator)/administration/extract-upload/_sections/ExtractUploadSettingsPageClient.test.tsx`.

3. Stub `fetch` so the baseline request resolves with inventory on file, and the upload `POST` to `/api/proxy/v1/azure-extractor/upload` never settles. Choosing a `.zip` through `extract-upload-drop-zone-input` leaves the header tag on `Uploading package…`. `extract-upload-drop-zone-surface` contains `extract-upload-drop-zone-progress`. The surface does not show `Drag and drop your inventory ZIP here`.
4. The same hung `POST`, with the baseline still reporting inventory on file: after the test resolves that `POST` with a `packageId`, the header tag reads `Inventory on file` and the Step 2 summary shows `Package accepted`.
5. A hung upload started from `extract-upload-try-demo-data` shows `Uploading package…` on that button and on the header tag.

Do not require the `ArchitectureDiagramViewer` zoom suite to pass.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- From `archlucid-ui`, run the focused Vitest files you changed, then `npx tsc --noEmit -p tsconfig.json` if you changed TypeScript.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not hide an Extract & upload section behind a More menu.
- Do not restyle `StatusTag` or add a green in-progress variant.

## Done when

A ZIP drop on Extract & upload, and **Try with Demo Data**, both show `Uploading package…` on a control that is already on screen, and the drop target shows that work in the existing teal sweep instead of a bar under the fold. When the request ends, the header returns to the inventory label. The accepted summary is still **Package accepted**. No spinner and no new green are added.
