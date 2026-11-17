> **Scope:** Internal SecureNow offline batch-analysis runner for engineers; not a full SQL security-path replay, production evidence verification, deployment gate, or authorization to collect from Azure.

# SecureNow Evidence Lab — bounded batch replay (increment 7)

This increment orchestrates the **existing** Python V1 ZIP auditor, the pre-built production C# native question replay, and the offline question reconciliation tool across multiple stored Azure subscription ZIPs. It does not introduce another security engine or collector.

## Prerequisites

- Python 3.12+.
- .NET 10 runtime and a **previously built** SecureNow.QuestionReplay.dll, built using the normal developer/CI build process. The batch runner **does not build or restore** code.
- A private folder of one extractor ZIP per subscription (ZIP schema v1 or v2).
- A **separately established** JSON array of expected subscription IDs, not an inventory derived from the ZIPs themselves.
- Optional question exports saved from the real SecureNow questions endpoint, with resource IDs, snapshot IDs, question keys and evidence fingerprints. These exports are sensitive; never commit them.

Example build (performed separately in approved environment):

\`\`\`bash
dotnet build tools/SecureNow.QuestionReplay/SecureNow.QuestionReplay.csproj -c Release
\`\`\`

Example offline batch:

\`\`\`bash
python3 scripts/securenow/offline_batch.py \
  --packages ./private/packages \
  --native-dll ./tools/SecureNow.QuestionReplay/bin/Release/net10.0/SecureNow.QuestionReplay.dll \
  --expected-subscriptions ./private/expected-subscriptions.json \
  --questions-dir ./private/questions \
  --coverage-dir ./private/coverage \
  --workers 2 \
  --timeout-seconds 120 \
  --out ./private/lab-batch-results
\`\`\`

The question and collector-coverage directories are optional. Without question exports, the native replay remains an *uncompared subset*; a missing export is never treated as zero questions.

The runner invokes the pre-built DLL with the form:

\`\`\`bash
dotnet /path/to/SecureNow.QuestionReplay.dll --zip /path/to/package.zip --out /path/to/result.native.json
\`\`\`

No \`dotnet run\`, restore, Azure sign-in, SQL migration, CI trigger or cloud operation is performed. The child environment excludes Azure credential variables and disables .NET CLI telemetry, but this is **not a security sandbox for arbitrary binaries**: use only the trusted compiled SecureNow executable.

## Limits and fail-closed conditions

- At most **100** ZIPs, **1 GiB** combined compressed input, and the V1 ZIP safety ceilings of 128 MiB per ZIP and 512 MiB total expanded member size per package.
- Worker parallelism must be 1–4; each native replay has a bounded configurable timeout of 1–600 seconds.
- Reject duplicate subscriptions, missing/invalid expected subscription inventories, unexpected subscriptions, missing inputs, invalid native JSON, mismatched SHA-256 package identity, and mismatched question fingerprints.
- Existing native output is deleted before every replay so a stale report cannot masquerade as a fresh execution.
- Reports are saved under the explicit local output folder; never place that folder inside the input package folder. Treat all reports as tenant-confidential despite pseudonymized resource IDs.

### Artifacts

- \`evidence-coverage.json\` and \`evidence-coverage.md\`: original ZIP inventory and source-file presence.
- \`native/<subscriptionId>.native.json\`: directly generated **inventory-question subset** from the production ZIP reader, relationship mapper and question compiler.
- \`reconciliation.json\`: created only when a questions directory is supplied; contains **partial InventoryEvidence slice** comparisons with the original exported question queue.
- \`batch-report.json\`: deterministic, ordered per-subscription state, package hashes, collection gaps, source status, comparison result and stage execution truth. It records the SHA-256 of the prebuilt native DLL, which identifies bytes but does not authenticate a trusted build or Git commit.

The batch report explicitly labels **all SQL-backed engines and coordinator steps as NOT_EXECUTED**. It labels the ZIP/edge/question native stages as EXECUTED_PARTIAL only after validating a fresh native result. It never assigns a fictitious score or clearance to a subscription.

A batch with native execution failures, input gaps, unexpected subscriptions, or reconciliation drift is HOLD. Successful execution of all native replays without a comparison is PARTIAL_NATIVE_REPLAY_ONLY, *not* a full SecureNow result or evidence-complete status.

CLI exit codes: 0 = batch orchestration completed with the labeled partial result; 2 = invalid input or fatal validation; 3 = HOLD. No answer, finding, audit disposition, risk acceptance, procurement gate or Azure resource is mutated.

## Tests

\`\`\`bash
python3 -m unittest discover -s scripts/ci -p 'test_securenow_offline_batch.py' -v
\`\`\`

The tests exercise synthetic ZIPs and a fake native executor to validate offline orchestration independent of the .NET runtime. They cover partial question parity, missing/extra subscriptions, missing exports, worker failures, stale native report rejection, input constraints and output privacy.

These tests **do not** prove the native DLL compiles or the full SQL coordinator succeeds. Those require the focused C# and SQL test suites and a separately controlled disposable SQL catalog.

## Next milestone

Add a separately authorized, isolated **full SQL-backed batch replay runner** that invokes the actual post-materialization coordinator and exports per-engine success/failure, path/finding/rank/cut counts, truncation, source completeness and questions. The existing production coordinator currently discards several per-engine result flags; do not report full success without independently checking each stage or adding reviewed stage-result propagation.

Maintain the RC43 freeze and all tenant, security, evidence-provenance, sponsor/ROI and owner/procurement HOLD controls.
