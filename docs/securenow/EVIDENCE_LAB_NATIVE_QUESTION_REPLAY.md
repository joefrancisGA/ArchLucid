# SecureNow Evidence Lab — native offline question replay (increment 2)

**Branch:** developed separately from RC43. **Status:** Partial replay, not a complete SQL-backed security finding/path run.

## Why this increment

The Python V1 lab inspects existing evidence packages and question exports. This increment invokes the **real production C# components** to reproduce the inventory/diagram portion of the question queue directly from one Azure ZIP:

- \`AzureExtractorPackageZipValidator\` (including ZIP archive safety checks)
- \`AzureExtractorManifestReader\`
- \`AzureExtractorPackageInventoryReader\`
- \`AzureInventorySecurityEdgeMaterializer\` (production edge logic and optional companion families)
- \`SecureNowDiagramQuestionCandidateBuilder\` (extracted unchanged from production service and shared by both callers)
- \`SecureNowQuestionCompiler\`

The production \`SecureNowQuestionDispositionService\` now calls the extracted builder rather than maintaining a separate private copy. This reduces divergence between the lab and UI question queue.

## Usage

First build with the project's .NET 10 SDK and *locally available dependencies* (a regular \`dotnet run\` may restore packages, so pre-build where strict air-gapping is required):

\`\`\`bash
dotnet build tools/SecureNow.QuestionReplay/SecureNow.QuestionReplay.csproj --no-restore
dotnet run --no-build --no-restore --project tools/SecureNow.QuestionReplay -- \
  --zip ./private/packages/subscription.zip \
  --out ./private/lab-results/native-questions.json
\`\`\`

To include original ARM resource identifiers and original question text in the **local** output (opt-in):

\`\`\`bash
dotnet run --no-build --no-restore --project tools/SecureNow.QuestionReplay -- \
  --zip ./private/packages/subscription.zip \
  --out ./private/lab-results/native-questions-full.json \
  --include-identifiers
\`\`\`

Default output hashes resource IDs; no question text or resource names are exported by default. Treat all reports and packages as confidential, even when identifiers are hashed. Never commit actual customer ZIPs or generated reports.

## Guarantees and limits

- Reads exactly one ZIP from local disk. No Azure token, ARM/Graph, SQL, paid AI, outbound service or user-question mutation is used.
- Validates original ZIP schema and archive safety before decoding; enforces a 128 MiB input limit.
- Uses deterministic snapshot identity from the input package hash for reproducible partial replay.
- Preserves the production question compiler's source, key, fingerprint and "Open" status; never auto-answers or changes a persisted disposition.
- Uses production **security-edge materialization** to identify relationships in the ZIP; the program does not claim parity with the complete stored/scope-enriched graph.
- Does **not** run the SQL snapshot repository, effective policy pack loader, persisted inferred-connection repository, operator dispositions, inventory visibility filters, or the SecureNow path/rank/cut-point engines. For those, a disposable scoped SQL-backed replay service is still needed.
- A missing relationship does **not** establish no traffic, no access, or a security defect. A missing ZIP member does **not** establish an Azure permission denial.
- Management-group package replay is not yet supported: input must represent exactly one subscription.

## Tests

\`\`\`bash
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj \
  --filter FullyQualifiedName~SecureNowOfflineQuestionReplayTests
\`\`\`

Tests cover generated isolated-resource questions, shared-service exemptions, relationships suppressing spurious isolated-resource candidates, deterministic replay and invalid ZIP rejection. Existing \`SecureNowQuestionDispositionServiceTests\` and \`SecureNowQuestionCompilerTests\` should remain unchanged and continue to pass.

## Follow-on work (SQL-backed, full-fidelity replay)

Use the already-existing \`AzureInventorySnapshotMaterializer\` and \`AzureInventorySnapshotPostMaterializeCoordinator\` with an isolated disposable SQL database under tenant/workspace/project scope. Load the real effective policy pack and persisted inferred connection/answer state, then compare the full generated question set and the operational findings/paths to the original run. Protect RBAC, sponsor proof, evidence provenance, and tenant/project separation. This follow-on must not ship as part of RC43 and must not initiate production collection or Azure changes.
