# Outbox lease + finalize enumeration (Prompt 5)

Handwritten C# state model substitute for TLA+ on the SQL outbox + finalize CAS protocol (TB-1311 / TB-943).

## Package states

| State | Meaning |
| --- | --- |
| **Unsealed** | Run package mutable by orchestrated execute / worker paths |
| **Sealed** | Golden manifest committed; worker late-writes forbidden except via commit verb |

## Run / worker states

| State | Meaning |
| --- | --- |
| **Running** | Active worker holds a lease and may heartbeat |
| **Recovering** | Lease lost or worker crashed; resume path may reclaim |
| **Partial** | Persisted outputs exist but finalize preconditions not met |
| **Ready** | ReadyForCommit preconditions satisfied |
| **NeedsAttention** | Zombie lease or invariant violation requiring operator action |

## Events

| Event | Typical source |
| --- | --- |
| `lease` | Outbox dequeue claims work |
| `heartbeat` | Lease renewal while processing |
| `crash` | Worker process loss |
| `resume` | Worker reclaim after crash |
| `finalize` | Commit/finalize CAS verb (never folded into execute) |
| `late-write` | Worker attempts post-seal mutation |

## Invariants (model-tested)

1. **Never double-finalize** — second `finalize` on a sealed package is rejected.
2. **No sealed rewrite from worker** — `late-write` after seal fails unless already sealed via `finalize`.
3. **Lease zombie detectable** — heartbeat expiry while lease held moves to `NeedsAttention`.
4. **Persist-before-LLM** — `finalize` without persisted outputs stays `Partial` / rejected.

Implementation: `ArchLucid.Host.Core.Tests/Coordination/OutboxLeaseFinalizeModel.cs` and `OutboxLeaseFinalizeEnumerationTests.cs`.

Coyote DST (Prompt 15): `OutboxLeaseFinalizeCoyoteTests.cs` explores actor message schedules with bounded `MaxFairSchedulingSteps` and replayable traces.
