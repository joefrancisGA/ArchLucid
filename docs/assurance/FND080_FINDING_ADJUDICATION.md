> **Scope:** Internal, offline assurance for reviewed synthetic cases in ArchLucid and SecureNow. This workflow does not authorize processing tenant data or make a product-wide accuracy claim.

# FND-080 independent finding adjudication

Use this workflow after [expert-level miss review](EXPERT_LEVEL_MISS_REVIEW.md) when a material FND-078 disagreement remains unresolved by FND-079. The input is the FND-079 version 1 verification report, not the engine receipts or a list of raw findings. Intake selects one exact comparison row with an `inconclusive` or `not_testable` result. Triage material cases by severity first, then select within the declared scope. A disagreement, an incomparable partition, and a negative finding are different things.

## Custody and reviewer assignment

1. The authorized operator confirms that the fixture, report, evidence cards, and any future export contain only reviewed synthetic data. Reject tenant data and secrets, including in copied free text, paths, IDs, provenance, or evidence references. This tool does not try to sanitize arbitrary input or authenticate a reviewer.
2. A separate custodian reviews and pins the private policy. Use opaque review and scope aliases, a neutral question, and neutral evidence summaries. Record all comparison producers in the exclusion list, and document reviewer qualifications by product and finding family and any case conflicts. The operator verifies each human's identity and controls access outside the tool. A caller-controlled actor name is not proof of identity. Automated agents are not independent human adjudicators.
3. Keep the original report and fixture, proof report and check bundle, policy, ledger, blinding key, and authoritative heads in a restricted operator store. Generate a fresh 32-byte per-case secret encoded as 64 hex digits and protect the file. The operator shares only the `packet` output with the assigned reviewers. Never commit operator inputs, ledger content, or keys to the corpus. Keep holdout review in separate custody from model, rubric, and fixture-tuning teams.
4. The packet omits origin IDs, roles, revisions, original scope, coverage reasons, and raw evidence. It includes unordered coverage states, curated evidence, and, where feasible, neutral scalar options A/B whose ordering is keyed. No option in an incomplete scope means “false.” If there is no safe projection, only a nonselection can be recorded from that packet. Operators must screen free text and neutral labels for indirect disclosure. Reviewers can still infer origins from recognizable patterns, so this is not a guarantee of anonymity. For benchmark miss enumeration, collect each reviewer's independent evidence-based issue list before showing the options.
5. Record a proposal with its scope, evidence aliases, rationale and uncertainty. For an acceptance or supersession, a different eligible reviewer must validate it. Keep the prior revisions and trusted head in append-only storage. Publish the new ledger and authoritative head with an atomic compare-and-swap in the custody system. The local tool verifies the hash chain against the supplied expected head, but cannot detect truncation if the operator also supplies an untrusted historical head. It does not provide storage immutability or actor signatures.

## Private authorization policy

The following is a shape example. Replace the angle-bracketed values and obtain the pin for the reviewed policy through your custody process. Digests are SHA-256 over the shared FND-078 canonical JSON representation, not over the indented file bytes.

```json
{
  "schemaVersion": 1,
  "case": {
    "reviewId": "review-0080-a",
    "caseId": "synthetic-case-a",
    "reportSha256": "<FND-079 report digest>",
    "rowSha256": "<FND-079 comparisonRowSha256>",
    "dataClass": "reviewed_synthetic",
    "material": true,
    "scopeAlias": "scope-a",
    "question": "Which value is supported in the synthetic fixture scope?",
    "producers": ["comparison-author"],
    "proofSource": {
      "id": "independent-reference",
      "revision": "<immutable revision or digest>",
      "locator": "synthetic/reference.json"
    },
    "evidence": [{"alias": "card-1", "summary": "Sanitized evidence about the scope."}]
  },
  "reviewers": [
    {"id": "reviewer-a", "active": true, "products": ["ArchLucid"], "families": ["example"],
     "qualification": "review-roster/1", "conflicts": []},
    {"id": "reviewer-b", "active": true, "products": ["ArchLucid"], "families": ["example"],
     "qualification": "review-roster/1", "conflicts": []}
  ],
  "corpus": {
    "schemaVersion": 1,
    "corpusVersion": "release-1",
    "entries": [
      {"caseId": "synthetic-case-a", "inputSha256": "<digest of report inputFingerprints>",
       "sourceGroup": "synthetic-source-a", "partition": "regression"}
    ],
    "protectedHoldout": [
      {"inputSha256": "<protected immutable fingerprint>", "sourceGroup": "protected-origin-a"}
    ]
  }
}
```

`proofSource` may be null for a judgment-only case. It must otherwise name the independent, immutable source already present in the approved FND-079 check bundle, not either comparison producer. Use the same normalized `sourceGroup` for renamed or derived cases. Import the authoritative protected holdout inventory into every policy release and never remove entries simply because a holdout is retired. The tool blocks cross-partition use based on fingerprints and declared ancestry, including held-out entries not otherwise listed in the local corpus. It cannot discover unregistered related cases. A holdout case never exports, and cases in tuning cannot export either.

## Commands and lifecycle

In a restricted working directory, set `POLICY_PIN` from the reviewed policy, then use Bash:

```bash
tool=(python3 scripts/assurance/review_divergent_findings.py)
private=(--report unresolved.json --policy approval.json --policy-sha256 "$POLICY_PIN" --secret-file case.key)
"${tool[@]}" packet "${private[@]}" > reviewer-packet.json
"${tool[@]}" genesis "${private[@]}"
"${tool[@]}" append "${private[@]}" --head "$TRUSTED_GENESIS" \
  --actor reviewer-a --event proposal.json > ledger-01.json
"${tool[@]}" append "${private[@]}" --head "$TRUSTED_PROPOSAL_HEAD" --ledger ledger-01.json \
  --actor reviewer-b --event accept.json > ledger-02.json
```

The custodian supplies the `TRUSTED_*` values and stores the new `eventSha256` on each successful append. For proposals, use these exact fields:

```json
{
  "action": "propose",
  "decision": "supports_option",
  "option": "A",
  "basis": "human_judgment",
  "rationale": "The scoped reference supports the selected reading.",
  "evidence": ["card-1"],
  "uncertainty": "No inference outside the synthetic scope.",
  "proofSha256": null
}
```

Use `neither` or `unresolved` with a null option when appropriate. Accepting these dispositions or a judgment-only selection records a human decision, not an automated expectation. To propose a reproducible expectation, use `basis: reproducible` and supply the digest of the completed FND-079 proof report. `accept` and `dispute` require `action`, `targetSha256`, and `rationale`. Acceptance targets the current proposal event. Disputing a draft clears it without deleting history. Disputing an accepted label makes it inactive. Once a replacement proposal is recorded, `supersede` targets its hash and additionally requires `replacesSha256` for the prior accepted event.

## Automated regression

Rerun the approved FND-079 check against the same immutable fixture, comparison and check bundle. A higher offline work budget can resolve a previously budget-limited result. Export verifies the proof against the approved check and independent fixture evidence rather than trusting a human “supported” label or the check report alone. Version 1 supports replaying Boolean and bounded integer scalar assertions, including distinct counts from scoped synthetic evidence. No fixture is assigned for judgment alone, unresolvable cases, or an unsupported deterministic oracle.

```bash
"${tool[@]}" export "${private[@]}" --ledger ledger-02.json --head "$TRUSTED_ACTIVE_HEAD" \
  --proof verified.json --fixture synthetic-fixture.json --checks approved-checks.json > regression.json
"${tool[@]}" check-regression --regression regression.json --regression-sha256 "$REGRESSION_PIN" \
  --active-head "$TRUSTED_ACTIVE_HEAD" --fixture synthetic-fixture.json \
  --plan candidate-plan.json --receipt candidate-receipt.json
```

The export is a versioned exact expectation plus the synthetic fixture pin, proof and approval lineage, and corpus version. Publish it and the immutable synthetic fixture only after the custodian confirms no private data is present. The automated check consumes a new pinned FND-078 candidate receipt, checks exact typed equality and complete scoped coverage, and fails on missing or duplicate matches. The consuming job must take the current authoritative head from the custodian, not from the export being checked, so a disputed or replaced label invalidates its old export. A successful check is evidence for that assertion and scope only.

The focused CI suite uses simulated reviewers and synthetic evidence, including a complete intake-to-regression run. It does not constitute live human adjudication.
