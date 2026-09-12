> **Scope:** Contributor-reference — system-not-job (SN) explicit out-of-wave skips for SN-040 close audit. Not buyer-facing copy.

# System-not-job out-of-wave residuals

**Status:** recorded in [`SYSTEM_NOT_JOB_ACCEPTANCE_2026-09-11.md`](SYSTEM_NOT_JOB_ACCEPTANCE_2026-09-11.md) (SN-040) · **Do not** mark these rows shipped unless product actually ships them.

| Item | Tracking | Owner prompt | Status | Notes |
|------|----------|--------------|--------|-------|
| Draft-to-draft Compare | R12 rejected alternative | **SN-038** | **Not shipped** | Compare stays committed-manifest. **SN-014** is the allowed Compare (labeled envelope runs). Cheap sketch is clone-from-snapshot (ADR **0092**). |
| Live presence (avatars, cursors, occupancy) | ADR **0090** / **LW-089** lease | **SN-039** | **Not shipped** | Concurrent desk is work-lease, not presence. Collab strip remains history; no finding-comment chat. |

## Do not claim

- Draft-diff Compare shipped in system-not-job wave 25.
- Live presence avatars, cursors, occupancy heartbeats, or finding-comment chat shipped in this wave.
- **SN-038** / **SN-039** closed the gap — the prompts exist only to prevent scope creep.

## Ratchet

- `archlucid-ui/src/lib/system-not-job-out-of-wave-residuals.ts`
- `archlucid-ui/src/lib/system-not-job-out-of-wave-residuals.test.ts`
- `ArchLucid.Architecture.Tests/SystemNotJobSn038DoNotImplementDraftCompareArchitectureTests.cs`
- `ArchLucid.Architecture.Tests/SystemNotJobSn039DoNotImplementLivePresenceArchitectureTests.cs`
