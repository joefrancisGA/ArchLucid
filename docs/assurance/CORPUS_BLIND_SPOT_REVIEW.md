# Corpus blind-spot review

A corpus blind spot exists when two plausible implementations can disagree about an important conclusion while both still pass all current semantic cases.

## ArchLucid adversarial dimensions

Add cases around:

- equivalent architectures with different names/order/format;
- hidden single points of failure;
- conflicting availability and cost objectives;
- impossible or mutually inconsistent RTO/RPO requirements;
- ambiguous tenant/data isolation boundaries;
- trust-boundary crossings with incomplete diagrams;
- declared vs observed contradictions;
- multiple reasonable designs where the product must expose tradeoffs rather than a single fake-certain answer;
- benign complexity that should not trigger findings;
- evidence missing in exactly the place required to justify a strong claim.

## SecureNow adversarial dimensions

Add worlds around:

- subscription, resource-group and resource-level RBAC inheritance;
- nested groups and federated identities;
- directionality errors;
- private endpoint plus public-access contradiction;
- public path plus missing NSG evidence;
- disjoint routes versus shared controls;
- duplicate evidence;
- stale versus current snapshots;
- missing inventory slices;
- conflicting ObservedFact and HumanAssertion;
- unsupported certainty that must remain InsufficientEvidence.

## Review protocol

For each proposed case, write the independent truth before running production code. The reviewer should be able to explain why the expected conclusion follows without reading the implementation.

The synthetic-world, metamorphic, reference-reachability, reference-RBAC and reference-cut-point suites are the first concrete outputs of this program.
