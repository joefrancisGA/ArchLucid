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
- SecureNow keeps the bounded observation in the existing persisted explanation
  fields for supported, contradicted and explicitly unverified outcomes. If no
  valid observation exists, the explanation retains an unverified outcome without
  naming an observation or verifier. Provider quality events retain the existing
  labels and explanation ID link.
- No historical rows are rewritten and no external probes are introduced.

FND-071 remains partial. SecureNow explanations still persist the projection as text,
not a structured verification envelope. A separate slice is needed for structured
package/export/audit propagation and explicit self-check, independent model and
human-adjudication provenance on other claim families.
