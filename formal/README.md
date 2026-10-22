# Formal kernels (Prompt 25)

**Status:** spec-only — Dafny is **not** wired into CI. These files document invariants enforced by C# tests (Prompts 1, 5, 6).

| File | Mirrors |
| --- | --- |
| `merge-invariants.dfy` | `GraphMergeInvariantChecker` — no dangling edges, no topology endpoint-key collision |
| `finalize-cas.dfy` | `OutboxLeaseFinalizeModel` / Coyote DST — no double-finalize, sealed package invariants |

Optional local verify: `dafny verify formal/merge-invariants.dfy` and `formal/finalize-cas.dfy`.
