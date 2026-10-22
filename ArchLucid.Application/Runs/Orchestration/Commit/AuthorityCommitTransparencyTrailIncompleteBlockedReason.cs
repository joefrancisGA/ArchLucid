namespace ArchLucid.Application.Runs.Orchestration.Commit;

/// <summary>User-facing finalize block when ADR 0073 trail completeness fails.</summary>
public static class AuthorityCommitTransparencyTrailIncompleteBlockedReason
{
    public const string MissingTrail =
        "Finalize requires a transparency trail with asserted, inferred, and skipped sections. Complete intake provenance or reload the package before sealing.";
}
