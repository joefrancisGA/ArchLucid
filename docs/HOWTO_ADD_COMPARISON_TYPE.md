## How to add a new comparison type

This guide walks through the main steps required to introduce a **new comparison type** that can be:

- built and persisted as a `ComparisonRecord`
- replayed via `ComparisonReplayService`
- exported again (Markdown/HTML/DOCX/PDF as appropriate)

It is written for internal engineers already familiar with `end-to-end-replay` and `export-record-diff`.

---

### 1. Name and contract

1. **Choose a comparison type id** (string)  
   - Examples: `"end-to-end-replay"`, `"export-record-diff"`.  
   - Pick something stable and machine-friendly, e.g. `"run-metadata-only"` or `"agent-result-diff"`.

2. **Define the payload contract** in `ArchiForge.Application.Analysis` (or appropriate namespace)
   - Create a `sealed class` for the comparison result payload, similar to:
     - `EndToEndReplayComparisonReport`
     - `ExportRecordDiffResult`
   - Ensure it is JSON-serializable with `System.Text.Json` (no special converters required unless truly necessary).

---

### 2. Generate and persist the comparison

1. **Create a comparison service** (if needed)  
   - Mirror `IEndToEndReplayComparisonService` / `IExportRecordDiffService`:
     - `Task<YourNewComparisonPayload> BuildAsync(...)` or `YourNewComparisonPayload Compare(...)`.

2. **Extend `IComparisonAuditService` / `ComparisonAuditService`**
   - Add a `RecordXAsync(...)` method that:
     - constructs a new `ComparisonRecord`
     - sets:
       - `ComparisonType = "your-comparison-type-id"`
       - relevant linkage (`LeftRunId`, `RightRunId`, or export IDs, etc.)
       - `Format` (e.g. `"json+markdown"`)
       - `SummaryMarkdown` (optional)
       - `PayloadJson = JsonSerializer.Serialize(yourPayload)`
   - Persist via `IComparisonRecordRepository.CreateAsync(...)`.

3. **Expose it via API**  
   - Add an endpoint under `ArchitectureController` that:
     - runs your comparison
     - optionally persists it (using the new audit method)
     - returns a summary + sets `X-ArchiForge-ComparisonRecordId` when persisted

---

### 3. Rehydrate payloads for replay

1. **Update `ComparisonRecordPayloadRehydrator`**
   - Add a method:
     - `public static YourNewComparisonPayload? RehydrateYourType(ComparisonRecord record)`
   - Use the same `JsonSerializerOptions` as the other helpers:
     - `JsonSerializer.Deserialize<YourNewComparisonPayload>(record.PayloadJson, JsonOptions)`

2. **Add unit/integration coverage**
   - Test that:
     - a record with your comparison type can be rehydrated
     - invalid/missing payloads produce a clear `InvalidOperationException`.

---

### 4. Wire into `ComparisonReplayService`

1. **Routing based on `ComparisonType`**
   - In `ComparisonReplayService.ReplayAsync(...)`:
     - Extend the `switch` on `record.ComparisonType`:
       - `"your-comparison-type-id" => await ReplayYourTypeAsync(record, format, mode, cancellationToken),`

2. **Implement `ReplayYourTypeAsync`**
   - Inside `ComparisonReplayService`:
     - Rehydrate the payload using your new helper.
     - Decide which formats you support:
       - Markdown (likely)
       - HTML
       - DOCX and/or PDF (if you have an export service for your payload)
     - Return a `ReplayComparisonResult` (fill `Content` or `BinaryContent`, `FileName`, `Format`).
     - Honor `ReplayMode` where it makes sense:
       - For `artifact`: use stored payload only.
       - For `regenerate`: rebuild payload from source (if applicable).
       - For `verify`: regenerate, compare, and attach drift metadata.

3. **Populate metadata**
   - Use `SetRecordMetadata(...)` (or equivalent helper) to copy:
     - `LeftRunId`, `RightRunId`
     - `LeftExportRecordId`, `RightExportRecordId`
     - `CreatedUtc`, `FormatProfile` (if you have profiles)

---

### 5. Expose and document replay support

1. **Ensure the replay endpoints work for your type**
   - `POST /v1/architecture/comparisons/{comparisonRecordId}/replay`
   - `POST /v1/architecture/comparisons/{comparisonRecordId}/replay/metadata`
   - For unsupported formats, throw a clear `InvalidOperationException` with a friendly message.

2. **Extend search & metadata surfaces as needed**
   - If your comparison type has special linkage (e.g., specific tags or labels), add filters to:
     - `GET /v1/architecture/comparisons` search endpoint
     - CLI `comparisons list` (if useful)

3. **Update docs**
   - Add a short section to:
     - `COMPARISON_REPLAY.md` – listing the new comparison type and supported formats.
     - `ARCHITECTURE_COMPONENTS.md` – mentioning your new comparison service/formatter.

4. **Add integration tests**
   - End-to-end test that:
     - builds your comparison
     - persists it
     - replays it (at least Markdown)
     - optionally verifies drift where applicable.

