# FND-016 isolated recovery rehearsal

The FND-016 rehearsal service replays an FND-014 approved simulation against an in-memory copy, verifies its resulting digest and changes against the original dry run, then applies FND-015 inverse steps to the simulated state. It accepts the rehearsal only when the rollback produces exactly the original model digest. It emits a structured evidence payload suitable for review by a **separate** signing authority. It does not sign its own evidence.

This is a real executable **in-memory rehearsal**, not a cloud deployment, OS sandbox, isolated subscription or live infrastructure recovery test. It cannot establish that external side effects, permissions, databases, network routes or distributed dependencies will be restored. Before using rehearsal evidence to approve production execution, integrate a separately administered recovery authority, attestations bound to this evidence, realistic isolated infrastructure test environments, and independent recovery checks. Execution remains disabled.

## Exact rollback sequence binding — reuse audit (2026-11-23)

The original rehearsal validated the FND-014 forward digest and changes,
then checked only the number of FND-015 inverse steps and whether replay
restored the original digest. A substituted inverse with different
intermediate property values could still restore the original digest,
yielding a successful rehearsal of a **different** rollback path from the
reviewed planner output.

The existing rehearsal now derives the expected inverse steps from the
replayed, source-verified `forward.changes`, in reverse chronological order,
using the same `RemediationStep` operation and old/new property semantics as
FND-015. It requires exact equality with `rollback.inverse_steps` before
replaying the rollback. An altered operation or intermediate value fails
as `inverse_steps_mismatch` and produces no rehearsal evidence. This is
an additional **reference-evidence consistency check**, not a new
authorization service or claim that any live rollback is safe.

Regression tests include a two-step property change, whose forged inverse
returns to the correct final digest via a different intermediate value.
A valid FND-015 plan still rehearses successfully. The separate
evidence-bound Ed25519 signing verifier remains unchanged: only an
independent authority can sign accepted rehearsal evidence, and neither
the planner nor rehearsal is connected to a production execution gate.
