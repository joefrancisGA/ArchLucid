# Architectural defect prevention review

Every recurring or credibility-relevant defect should be classified by the weakest layer that allowed it.

## Root-cause layers

1. **Type/compile boundary** — invalid state was representable.
2. **Persistence/transaction boundary** — partial or conflicting state could commit.
3. **Scope/authorization boundary** — tenant/workspace/project authority was not structural.
4. **Evidence/provenance boundary** — a conclusion could outrun its evidence.
5. **Algorithm boundary** — optimized reasoning lacked an independent truth mechanism.
6. **Workflow boundary** — a failure could appear successful or disappear between surfaces.
7. **Presentation boundary** — canonical truth existed but was rendered inconsistently.
8. **Test/measurement boundary** — tests mirrored implementation or never sampled the failure mode.

## Prevention order

Prefer, in order:

1. make the invalid state unrepresentable;
2. fail closed at the commit or authority boundary;
3. centralize one canonical invariant;
4. add property/metamorphic/reference-oracle checks;
5. add a narrow regression test;
6. add prose/lint only when the failure is genuinely textual.

## Required defect closeout

For a confirmed defect record:

- root-cause layer;
- why existing controls missed it;
- chosen prevention layer;
- regression/prevention artifact;
- whether the defect changes a credibility metric or public claim.

Repeated defects with the same root cause must trigger an architecture review rather than another local patch.
