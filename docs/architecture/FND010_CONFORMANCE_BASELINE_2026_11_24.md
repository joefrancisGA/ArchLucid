# FND-010 / FND-061 source-level control adoption baseline — 2026-11-24

## Scope and reproducibility

Pinned master: `d3aabdd478c97724193c20b29ea1ad189917b6b8`. Reviewed **49 distinct HTTP action methods** across **17 controller families** (aliases count once), supported by 58 pinned source blobs. The existing route/tier registry has **255** unique controller files; the untruncated Git tree contains **590** C# files in the controller directory, including partials and non-action files. Those are discovery counts, not eligible-action counts. The remaining 238 registry families and additional unreviewed actions inside represented families are not assumed compliant or exempt.

The machine-readable [baseline](../../config/architecture/fnd010-adoption-baseline.json) records action identity, review status, evidence path/blob identity, rationale, selected textual ordering sentinels, and pending PR references. Every recorded action declaration was checked against pinned master (49/49); all 11 distinct order sentinels were independently checked against the pinned source and passed. This source verification is not a compiled control-flow or runtime test.

**Criterion:** current resource-level read/decide/share or evidence-entitlement authorization before the first protected evidence read, cache access or AI grounding, with denial consumed and exact authorized resource binding. Minimal scoped identity/header discovery is allowed when needed to resolve authorization. For protected collections, authorization must constrain the actual evidence set; filtering public responses alone is not strict pre-hydration conformance. This is an adoption census of the reviewed authorization boundary, not certification of FND-010 mandatory audit, FND-061 all-path authorization, SQL isolation, revocation atomicity, every integrity guard, or deployment policy. Canonical architecture-share evaluation and central evidence-entitlement/audit decisions are distinct existing components; a share-gate pass must not be reported as proof of mandatory central audit.

## Baseline metrics

| Status | Actions | Interpretation |
| --- | ---: | --- |
| Conformant in reviewed boundary | 17 | Observed call chain uses and consumes the existing resource authorization before protected processing |
| Partial | 7 | Meaningful adoption, but strict pre-hydration or alternate mode remains unresolved |
| Confirmed gap | 19 | Observed entry chain enters evidence hydration before resource-specific authorization; not an assertion of an exploited incident |
| Unverified | 5 | Insufficient call-chain evidence for a conformance judgment |
| Exempt | 1 | Static Ask prompt catalog, not a protected evidence access |
| **Total reviewed/cohort** | **49** | **48 eligible or candidate actions**, excluding one justified exemption |

Conservative cohort conformance = 17/48 = **35.42%**. Partial adoption is not counted as conformant. This is not a repository-wide percentage, and the 48 includes actions whose full applicability and downstream chains need confirmation. Scope-wide denominator remains open; the discovery report inventories additional candidate actions without assigning them eligibility or conformance.

## Prioritized confirmed gaps

| Family | Action count | Recommendation |
| --- | ---: | --- |
| AuthorityReadsController | 6 | Canonical run detail, manifest, review trail, rationale, provenance and export: reuse canonical share gate before existing hydration. Review ListRuns separately (unverified). |
| ExplanationController | 6 | PR #8046 proposes correction; at baseline its changes were not on master. Revalidate the actual merged source before crediting. |
| RunCoverageController | 4 | Coverage and acknowledgement reads plus two mutations: read/decide checks before the shared seal helper. |
| TechnologyLedgerController | 2 | Read and patch: resource decision before seal hydration, preserve execute/decide intersection. |
| RunAgentEvaluationController | 1 | Require actual resource share decision after identity discovery and before seal, trace, evidence package and semantic evaluation. |

The seven partial actions are ordinary/streamed/finding Ask, two direct conversation routes, draft reasoning and evidence hub. Preserve recent security improvements; metadata-first proof projection and additional hub modes require separate review. Remaining five unverified actions: cloud resource list, draft questions/answer/skip, canonical run list. The direct finding inspector merged in #8050 is counted on master by source, not by pending CI. Existing scoped findings-list and CSV-export tracking adoption remains an independently identified residual (not counted in this initial cohort).

## Reproducible discovery and regression checks

The existing FND-017 advisory workflow now runs the census and publishes both the existing report and `fnd010-adoption-report.json`:

```sh
python -m unittest discover -s scripts/tests -p 'test_fnd010_adoption_census.py' -v
python scripts/architecture/fnd010_adoption_census.py --output fnd010-adoption-report.json
```

The scanner uses the existing controller registry and performs conservative HTTP-attribute/method discovery across controller partials. It reports additional unclassified candidate methods and unresolved attribute locations. Discovery is heuristic, does not model runtime route conventions, inherited routes, minimal APIs, middleware, background workers or every C# declaration shape, and is not a complete endpoint census.

A missing/changed pinned file, missing action declaration, registry membership change, or failed selected source-order sentinel changes that action's **effective** classification to unverified. A changed exemption is also unverified, not silently retained. Unreviewed actions cannot improve the percentage. The order checks detect certain source regressions, but cannot prove semantic dominance; blob identity is a revision marker, not a cryptographic authorization proof. Changes require review and evidence refresh, not mechanical hash updates. Nine authored unit tests cover stable accounting, alias deduplication, stale evidence, reordered reads, missing sources, new partial actions, unresolved attributes, method boundaries, stale exemptions and duplicate rows. New workflow execution pending; no new production control or full build initiated.

## Next acceptance criteria

1. Harden the six canonical AuthorityReadsController actions and verify corresponding legacy aliases; explicitly inspect inventory/listing authorization before changing pagination.
2. Reconcile #8046 and #8050 exact-head tests and master adoption. Keep source status and CI status separate.
3. Address coverage, technology ledger and agent evaluation gaps, then expand the census by controller family using unclassified discovery output.
4. Review the seven partial and five unverified actions; extend to internal consumers and workers, including mandatory audit where applicable.
5. Add actual control-flow and HTTP negative controls to existing FND-017/FND-061 mechanisms. Promote only validated invariants to merge-blocking after false-positive review; do not replace runtime gates with a textual scan. Run full integration only on RC49 unless explicitly authorized otherwise.

Owner retains merge authority. No comprehensive master build, paid infrastructure or new architectural control family introduced.
