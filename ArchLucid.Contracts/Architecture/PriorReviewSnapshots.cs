namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     Typed prior revision pinned for cross-run finding engines and incremental re-review.
/// </summary>
public sealed class PriorReviewSnapshots
{
    public Guid? PriorArchitectureVersionId
    {
        get;
        set;
    }

    public Guid? PriorGraphSnapshotId
    {
        get;
        set;
    }

    public Guid? PriorFindingsSnapshotId
    {
        get;
        set;
    }

    public Guid? PriorRunId
    {
        get;
        set;
    }

    /// <summary>Wave-10 suggestion 96: prior run policy pack pin hash hex stamped on prior Γ.</summary>
    public string? PriorPinnedPolicyPackIdsHashSha256Hex
    {
        get;
        set;
    }

    /// <summary>Wave-10 suggestion 96: prior run evidence pin hash hex stamped on prior Γ.</summary>
    public string? PriorPinnedEvidencePackagePinsHashSha256Hex
    {
        get;
        set;
    }

    /// <summary>Wave-10 suggestion 96: prior run κ content hash hex stamped on prior Γ.</summary>
    public string? PriorPinnedArchitectureVersionContentHashSha256Hex
    {
        get;
        set;
    }

    /// <summary>Wave-10 suggestion 96: prior run κ model content hash hex stamped on prior Γ.</summary>
    public string? PriorPinnedKnowledgeModelContentHashSha256Hex
    {
        get;
        set;
    }

    /// <summary>Wave-11 suggestion 106: prior run focused-pilot mode pin stamped on prior Γ.</summary>
    public string? PriorPinnedFocusedPilotModeEnabled
    {
        get;
        set;
    }

    /// <summary>Wave-11 suggestion 106: prior run focused-pilot cloud provider pin stamped on prior Γ.</summary>
    public string? PriorPinnedFocusedPilotCloudProvider
    {
        get;
        set;
    }
}
