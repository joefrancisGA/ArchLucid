# FND-010 / FND-061 source-level control adoption baseline — 2026-11-24

## Scope and reproducibility

Pinned master `a4e11fa60f31ab105a1d522b37c57ad69083dbd2`. The cohort covers **51 distinct HTTP action methods** across **18 controller families**, supported by 81 pinned source blobs. Multiple route attributes on one method count once. The two architecture inventory actions count separately because each has its own HTTP action method. The registry contains **255** controller files, and Git's untruncated controller tree contains **591** C# files, including partials. These are discovery counts. The remaining 237 registry families and unreviewed actions within represented families have no classification here.

The machine-readable [baseline](../../config/architecture/fnd010-adoption-baseline.json) records action identity, classification, rationale, blob IDs and selected ordering sentinels. All 51 action declarations, 81 evidence blobs and 51 distinct ordering sentinels verified against the pinned source.

To count as conformant, the reviewed action must consume the resource-specific read, decide, share or entitlement decision before protected evidence hydration, cache access or AI grounding. Scoped identity-only discovery is allowed. For collections, authorization must constrain the evidence used to build results. This census measures source-level resource authorization in the reviewed cohort. Mandatory central audit, full FND-061 coverage, SQL isolation, revocation atomicity and deployment policy require separate verification.

## Refreshed cohort

| Status | Prior baseline | Refreshed baseline |
| --- | ---: | ---: |
| Conformant in the reviewed boundary | 17 | 39 |
| Partial | 7 | 10 |
| Confirmed gap | 19 | 0 |
| Unverified | 5 | 1 |
| Exempt | 1 | 1 |
| **Reviewed actions** | **49** | **51** |
| **Eligible or candidate actions** | **48** | **50** |

Conservative cohort conformance rose from **17/48 (35.42%)** to **39/50 (78.00%)**. The original pinned reference was `d3aabdd478c97724193c20b29ea1ad189917b6b8`. Partial adoption does not count toward the numerator. The percentage applies only to these reviewed actions.

| Revalidated surface | Actions | Source finding |
| --- | ---: | --- |
| Explanation | 6 | Exact-run authorization precedes detail and explanation inputs. Comparison consumes decisions for both runs before seal reads. |
| Canonical authority reads | 6 | Exact-run authorization precedes detail and downstream manifest, trail, rationale, provenance and export processing. |
| Authority inventory | 1 | Scoped candidates are checked before seal selection, visible pagination and trace enrichment. |
| Architecture inventory | 2 | Visible runs drive offset and keyset pagination. ETags include visible continuation metadata. |
| Run coverage | 4 | Read or Decide authorization precedes seal hydration and coverage or acknowledgement work. |
| Technology ledger | 2 | Run Read or Decide authorization precedes seal and ledger access. ExecuteAuthority still applies to the mutation. |
| Agent evaluation | 1 | The run’s authorization precedes seal, trace, package and semantic evaluation. Both route attributes map to one method. |

The evidence reflects merged explanation, authority, inventory and coverage changes ([#8046](https://github.com/joefrancisGA/ArchLucid/pull/8046), [#8056](https://github.com/joefrancisGA/ArchLucid/pull/8056), [#8060](https://github.com/joefrancisGA/ArchLucid/pull/8060), [#8099](https://github.com/joefrancisGA/ArchLucid/pull/8099), [#8103](https://github.com/joefrancisGA/ArchLucid/pull/8103)). Focused .NET CI for #8103 passed 258 tests, including the inventory cases ([run 45546671612](https://github.com/joefrancisGA/ArchLucid/actions/runs/45546671612)). The census records source ordering for the wider cohort.

## Draft preflight reconciliation

Merged [PR #8116](https://github.com/joefrancisGA/ArchLucid/pull/8116) applies run sharing before manifest hydration in draft intake and wizard preflights. Its focused suite passed 303 tests ([run 45554297620](https://github.com/joefrancisGA/ArchLucid/actions/runs/45554297620)). The three question actions move from gap to partial because the repaired preflight is only one part of each action's authorization path. `ReasonDraft` remains partial. The cohort numerator stays at 39.

## Remaining work

- **Draft question intake.** `GetDraftQuestions` loads the target draft via scoped CRUD. `AnswerQuestion` and `SkipQuestion` load and mutate via the scoped mutation stage. Review and enforce draft-specific access before the draft payload on these paths. `ReasonDraft` applies draft and history proof before model use, with raw pre-reads still separately reviewable.
- **Other partial actions.** Ordinary, streamed and finding Ask, the two direct conversation actions, and the evidence hub retain their prior partial findings. Review metadata-first history proof projection and the hub’s alternate modes. The cloud-resource list remains unverified.
- **Wider adoption.** The Architecture Intelligence create branch still uses the scope-only seal preflight. Its existing-run guard parses a run ID and loads scoped detail before a run-share check. Audit the existing-run read and mutation modes separately from fresh creation, including persisted model identity. Review internal consumers, workers and mandatory audit separately.

## Reproduce

The FND-017 advisory workflow runs the scanner and publishes the adoption report.

```sh
python -m unittest discover -s scripts/tests -p 'test_fnd010_adoption_census.py' -v
python scripts/architecture/fnd010_adoption_census.py --output fnd010-adoption-report.json
```

Changed pinned files, missing declarations, registry membership changes and failed ordering sentinels make the affected classification unverified. The scanner discovers additional candidate methods heuristically. Text order and blob identity alone cannot establish control-flow dominance, runtime enforcement or complete route coverage.
