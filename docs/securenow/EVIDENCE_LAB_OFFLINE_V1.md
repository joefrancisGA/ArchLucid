# SecureNow Offline Evidence Lab — V1 baseline

**Status:** First executable increment. It is a **read-only ZIP/evidence-coverage and exported-question auditor**, not yet a full replay of the SQL-backed SecureNow finding/path pipeline.

## Purpose

Inspect previously collected Azure evidence packages, establish exactly which subscription ZIPs are present, identify packaged-versus-unpackaged companion files, and classify the original questions exported from SecureNow. Do not treat missing evidence as a negative or favorable security finding.

The implementation is isolated from RC43 and has no Azure, SQL, API, external LLM or paid-service calls. It writes only local report files under \`--out\`. Treat input ZIPs and outputs as tenant confidential.

## Usage

Place one existing extractor ZIP per subscription in \`private/packages/\`. Optionally prepare \`private/questions/\` with results from the authenticated production endpoint:

\`GET /v1/infra-evidence/snapshots/{snapshotId}/questions\`

Save each response array as \`<subscriptionId>.questions.json\`. Verify the snapshot identity and subscription against its ZIP **before** supplying it to the lab: the lab checks subscription labels but cannot authenticate that an exported question set came from the same snapshot.

Create an **independent**, not extractor-derived, expected subscription inventory as a JSON array such as \`["sub-one","sub-two"]\`. Missing subscriptions then appear explicitly in the report.

\`\`\`bash
python3 scripts/securenow/evidence_lab.py \
  --packages ./private/packages \
  --questions-dir ./private/questions \
  --coverage-dir ./private/coverage \
  --expected-subscriptions ./private/expected-subscriptions.json \
  --out ./private/lab-results
\`\`\`

\`--questions-dir\`, \`--coverage-dir\` and \`--expected-subscriptions\` are optional. An absent question export produces \`questionQueueStatus=NotProvided\` and \`questionCount=null\` — **never** a false zero.

Optional \`coverage/<subscriptionId>.coverage.json\` contains explicitly verified collector results:

\`\`\`json
{
  "subscriptionId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "sources": [
    {
      "source": "entra-group-memberships.json",
      "status": "AccessDenied",
      "detail": "Verified original collector log: Graph HTTP 403"
    }
  ]
}
\`\`\`

Allowed statuses: \`Collected\`, \`NotCollected\`, \`AccessDenied\`, \`NotConfigured\`, \`Failed\`, \`Unknown\`. These are **operator-supplied assertions**; the lab cannot independently verify them. In contrast, a missing ZIP member is classified only as \`NotCollectedOrNotPackaged\`, never as AccessDenied.

## Report and data handling

- \`evidence-coverage.json\`: package SHA-256, capture timestamp, resource count, optional-file presence, independent expected-subscription gaps, original question identities, tentative classifications and explicit limitations.
- \`evidence-coverage.md\`: short human-readable review report.

ARM resource IDs are **SHA-256 pseudonyms by default**; \`--include-resource-ids\` is an explicit local opt-in. Subscription IDs, question keys and operator-supplied coverage details can still be sensitive. Do not commit ZIPs, customer question exports or generated lab reports.

A question classified as requiring application knowledge or human judgment is **not** answered, accepted or suppressed. No findings, graph edges, roles, procurement gates or risk dispositions are modified.

## Tests

\`\`\`bash
python3 -m unittest discover -s scripts/ci -p 'test_securenow_evidence_lab.py' -v
\`\`\`

The test corpus is synthetic and uses no real customer Azure resources.

## Explicit engineering limitations / next milestone

The ZIP audit does **not** execute the production \`AzureInventorySnapshotMaterializer\`, \`AzureInventorySnapshotPostMaterializeCoordinator\`, graph/path engines, SQL repositories, effective policy packs, or \`SecureNowQuestionCompiler\`. It **consumes exported questions**, which allows an independent coverage audit without introducing a second question generator. The package-member check cannot determine whether a collector actually attempted the corresponding Azure API or whether a service was absent versus inaccessible.

Next, build a separately tested, offline .NET adapter around the **actual existing** materializer, scoped repositories and post-materialization coordinator, using disposable SQL test infrastructure. Its result should be compared against this independent report. Require source package/snapshot/policy version pinning, negative cross-tenant/workspace/project tests, stable output, and preservation of all sponsor/ROI and owner-gated HOLD semantics before claiming full replay.

Do not merge this into RC43, start live Azure collection, call paid services, trigger CI manually, or mark a release ready based on this audit.
