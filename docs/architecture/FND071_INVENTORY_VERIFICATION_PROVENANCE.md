# FND-071 first adoption slice — scoped Azure inventory verification

The production inventory verifier produces a structured observation for the explicit
publicNetworkAccess setting after scope, snapshot freshness and resource checks. Both
product paths now use the same scope-checked provenance projection. It recognizes
the versioned deterministic verifier, identifies the snapshot and resource row,
preserves the capture date and age policy, and states that the check neither proves
reachability nor establishes current configuration.

- ArchLucid keeps the existing structured finding property. Markdown and DOCX show
  the observation only for a verified source finding, and do not elevate omitted,
  malformed, out-of-scope or non-deterministic records.
- SecureNow stores the existing structured falsification record alongside an explanation.
  Its JSON contains the outcome, coverage and any attributable inventory observation.
  Scoped reads bind the record to the path's tenant, workspace, project and snapshot.
  Legacy or malformed observations stay unknown. Provider quality events retain the
  existing labels and explanation ID link. SecureNow provider-quality transition
  audit events also carry that same structured record when its scope and outcome
  match the adjudication. This neither adds audit events for non-transitions nor
  changes quality decisions. Rejection text remains bounded.
- No historical rows are rewritten and no external probes are introduced.

FND-071 remains partial. External packages, exports and audit coverage beyond
provider-quality transitions still need production integration. Other verification
modes and claim families remain outside this slice.
