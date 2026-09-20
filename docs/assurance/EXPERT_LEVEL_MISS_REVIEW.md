> **Scope:** Contributor-reference — internal engineering assurance guidance and benchmark methodology; not buyer-facing proof or a superiority claim.

# Expert-level miss review

For each benchmark case, an independent reviewer enumerates important architectural issues **before seeing ArchLucid's output**.

## Process

1. Freeze the evidence package.
2. Reviewer writes candidate risks, contradictions, missing-information states and key tradeoffs.
3. Lock that list.
4. Reveal the candidate system output.
5. Classify each difference:
   - legitimate miss;
   - false-positive reviewer expectation;
   - alternative acceptable design;
   - evidence unavailable to the system;
   - unsupported domain;
   - rubric ambiguity.
6. Convert legitimate misses into one of:
   - new independent corpus truth;
   - a metamorphic/property invariant;
   - a missing-evidence state;
   - an explicit unsupported-domain statement;
   - a structural prevention rule.

Do not simply add a phrase suppression or prompt hint unless the miss genuinely is linguistic.

## Independence

A reviewer who authored the implementation should not be the sole miss enumerator. AI reviewers may be used as additional dissent mechanisms, but correlated frontier models are not equivalent to independent human judgment.

## Artifact

Record case id, reviewer id/pseudonym, pre-output issue list, revealed-output matches, misses, adjudication, and resulting regression/prevention work. This artifact becomes evidence for Prompt 39's “regression from every confirmed defect” policy.
