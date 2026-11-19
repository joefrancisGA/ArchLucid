# Independent model review for ArchLucid and SecureNow

**Recorded November 19, 2026**

Use Sol Medium for routine Aspects reviews, a different model for an independent second pass, and the strongest available reviewer for a risk-focused check of the exact release candidate. This is a proposed QA practice for review planning and budgeting. Existing release gates and required checks still apply.

## What the recent reviews showed

The compare-two-reviews changes surfaced two defects at the boundary between data-loading hooks and their UI. The gate outcome hook omitted fields the panel needed to distinguish missing results from a failed load. The ROI hook omitted the flag the panel needed to explain that neither review showed positive estimated savings. Both omissions also violated the declared TypeScript return types. Seven focused scenarios passed with mocked queries after the fixes. See [gate outcome fix #7146](https://github.com/joefrancisGA/ArchLucid/pull/7146) and [ROI comparison fix #7147](https://github.com/joefrancisGA/ArchLucid/pull/7147).

These examples support checking changed code through its callers and exercising the full set of states. They provide evidence about the reviewed changes. A comparison of model quality would require a controlled sample. Earlier cancellation findings came from a concentrated review of similar in-memory repositories, so interpret the observed defect density in light of that coverage.

## Three review passes

| Pass | Scope and method | Evidence to keep |
| --- | --- | --- |
| Routine review with Sol Medium | Work newest-first through the tracked application source. Prioritize unreviewed spans and make a deliberate repeat visit when a regression, dependency, or fix warrants it. Follow changed behavior through its callers and run the relevant checks. | Baseline SHA, reviewed paths and spans, last Git change times, reasons for revisits, confirmed defects, and actual validation results. |
| Independent second pass with a different model | Give the reviewer a pinned source revision, the expected behavior, and access to the same code and test evidence. Have it record its findings before seeing the first review. Then compare findings and verify unique issues against source or tests. | Model and settings, independently confirmed findings, duplicate findings, and coverage gaps that remain. |
| Premium release-candidate review | Pin the exact candidate SHA and supply the delta from the last verified baseline, existing results, and known gaps. Spend most of the budget on tenant isolation, data integrity and migrations, retries and concurrency, and critical user workflows with weak coverage. | Candidate and baseline SHAs, scope reviewed, unresolved release risks, and targeted retest results on the candidate that will ship. |

For UI and API changes, check how callers handle loading, failure, missing or empty data, and success. Use a type check for return contracts and targeted tests for the meaning of each state. For persistence changes, trace the write, read, and retry paths that depend on the same behavior.

## Control the release-review cost

Agree on the budget and highest-risk paths before starting the premium pass. Start with the release delta and the critical paths it can affect. Expand only when the review finds a recurring defect pattern or a critical area lacks sufficient verification. Confirm each proposed release blocker with source evidence or a targeted test. If a fix changes the candidate, verify the affected paths against the new candidate SHA.

Track confirmed findings from each pass and the effort spent verifying them. Use the unique findings and remaining risk to decide where an independent or premium review is worth repeating on the next release.
