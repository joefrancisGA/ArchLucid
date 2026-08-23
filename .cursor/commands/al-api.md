# /al-api — Launch a Cloud Agent via API

You are invoking the **/al-api** slash command. Your job is to start a Cursor Cloud Agent through the local helper script, using **Composer 2.5 standard** (not Fast). This is hardcoded in the script and cannot be overridden.

## Input

1. **Task text** — everything the user typed after `/al-api` on the same line.
2. **Optional screenshot** — if the user attached an image in this message, use the first image.

If task text is empty, ask the user for a one-line task before continuing.

## Steps

1. Confirm config exists at `.cursor/al-api.config.json`.
   - If missing, tell the user to copy `.cursor/al-api.config.example.json` → `.cursor/al-api.config.json` and set `apiKey` (or set `CURSOR_API_KEY` in their environment).
2. If an image was attached:
   - Save it to a temp file in the repo (for example `.cursor/tmp/al-api-screenshot.png`).
   - Remember the absolute path for the script.
3. Run the helper script from the **repository root**:

**Windows (PowerShell):**
```powershell
.\scripts\Invoke-AlApi.ps1 -Text "<TASK_TEXT>" [-ImagePath "<ABSOLUTE_IMAGE_PATH>"]
```

**macOS/Linux:**
```bash
bash scripts/al-api.sh "<TASK_TEXT>" ["<ABSOLUTE_IMAGE_PATH>"]
```

Replace `<TASK_TEXT>` with the user's task. Omit `-ImagePath` / the second argument if there is no screenshot.

4. Read the script output and reply with:
   - Agent URL (clickable)
   - Agent ID and run ID
   - Confirmation that `composer-2.5` with `fast=false` was used

5. Delete any temp screenshot file you created under `.cursor/tmp/` after the script succeeds.

## Error handling

- If the API returns an error, show the response body and stop.
- Do **not** fall back to starting a Cloud Agent from the UI (that may use Fast mode).
- Do **not** modify code unless the user asked for that in the task text.

## Example

User message:
```
/al-api Fix the login button alignment on mobile
[attached screenshot]
```

You run:
```powershell
.\scripts\Invoke-AlApi.ps1 -Text "Fix the login button alignment on mobile" -ImagePath "C:\path\to\repo\.cursor\tmp\al-api-screenshot.png"
```

Then return the agent URL from the script output.

## Related

- `/al-bug-api` — launch `/al-bug` on a Cloud Agent (Composer 2.5 standard)
