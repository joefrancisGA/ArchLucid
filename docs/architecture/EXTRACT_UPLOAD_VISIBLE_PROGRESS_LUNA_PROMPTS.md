> **Scope:** Paste-ready GPT-5.6 Luna prompt. Show Extract & upload progress inside the drop target, on the page status, and on the demo button. Internal engineering only.
> **Paste-ready file:** [`.cursor/prompts/extract-upload-01-visible-progress.md`](../../.cursor/prompts/extract-upload-01-visible-progress.md)

# Extract & upload visible progress — Luna prompt

**Created:** 2026-10-04 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Do not implement from this index.

On Extract & upload, Step 2 sits at the bottom of a long page. `InventoryZipDropZone` mounts `AzureExtractorUploadProgressBar` under the dashed target, and fades that target to 60% opacity while `busy` is true. The bar is off screen for the whole request. This page's `fetch` reports no percent, so the bar is the existing teal indeterminate sweep. Green on this page already means the package was accepted.

| ID | Prompt | Intent |
|----|--------|--------|
| **EU-UP-01** | [extract-upload-01-visible-progress.md](../../.cursor/prompts/extract-upload-01-visible-progress.md) | Put the existing teal progress inside the drop target. Set the header status to `Uploading package…` while `upload.busy` is true, then restore the inventory label. Use that same sentence on **Try with Demo Data**. |

Run **EU-UP-01** on its own.

## Do not pull into this session

- A spinner, including a green or brighter-green spinner
- A new accent color, or an emerald / green in-progress treatment
- `scrollIntoView` as the way to reveal the bar
- Replacing the Extract & upload `fetch` with an XHR progress client
- Removing the wizard's separate `Validating manifest.json and resources.json…` bar
- Hiding Extract & upload sections behind a More menu
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**
