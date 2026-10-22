namespace ArchLucid.Contracts.Architecture;

/// <summary>Operator-facing honesty strings for PC-06 seal delta surfaces.</summary>
public static class ArchitectureSealDeltaHonesty
{
    public const string OrientationOnly =
        "This panel compares your current draft to the last sealed record for orientation only. It is not a governed re-run and does not update findings or sealed evidence.";

    public const string NoPriorSeal =
        "No prior sealed record for this architecture yet. Commit a review to establish a baseline for weekly change tracking.";

    public const string NoOpenDraft =
        "No open draft to compare against the last seal. Create or reopen a draft version to see what changed since the sealed record.";

    public const string NoChanges =
        "Current draft matches the last sealed assumptions and provenance on record.";
}
