namespace ArchLucid.Contracts.Findings;

/// <summary>Stable reason codes for findings withheld from the sealed record (DR-02).</summary>
public static class WithheldFindingReasons
{
    public const string ProseOnlyEmission = "prose-only-emission";

    public const string MergeConflictDropped = "merge-conflict-dropped";

    public const string EngineFailureAdvisory = "engine-failure-advisory";

    public const string ComplianceTagFromProse = "compliance-tag-from-prose";
}
