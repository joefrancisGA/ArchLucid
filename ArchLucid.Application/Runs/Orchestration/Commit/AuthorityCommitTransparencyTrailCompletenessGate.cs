using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Runs.Orchestration.Commit;

/// <summary>
/// Blocks finalize when the intake transparency trail is missing (ADR 0073 / LK-09).
/// Empty asserted/inferred/skipped arrays are legal; null trail is not.
/// </summary>
public static class AuthorityCommitTransparencyTrailCompletenessGate
{
    public static PreCommitGateResult? Evaluate(TransparencyTrail? trail)
    {
        if (trail is not null)
        {
            return null;
        }

        return new PreCommitGateResult
        {
            Blocked = true,
            Reason = AuthorityCommitTransparencyTrailIncompleteBlockedReason.MissingTrail,
        };
    }
}
