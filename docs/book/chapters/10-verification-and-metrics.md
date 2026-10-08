> **Scope:** Chapter 10 stub for the book draft *Managing Azure Security with AI*. Author working notes; not product documentation.
> **Status:** draft

# Chapter 10 — Verification and outcome metrics

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md)

## Reader takeaway

"Fixed" is a claim. Verification is comparing the next snapshot against the expected postcondition. Report outcomes, not activity.

## Key points

- Postconditions: state what must be true after the fix (role assignment absent, public access disabled).
- Snapshot-to-snapshot diff; incomplete collection means "not verified", never "passed".
- Outcome metrics: paths removed, crown-jewel exposure reduced, time a critical path stayed open.
- Why "findings closed" is a weak headline metric.

## Lab idea

Apply the Chapter 9 Terraform, re-collect, and run a verification diff.

## Open questions

- Sample executive one-pager to include?
