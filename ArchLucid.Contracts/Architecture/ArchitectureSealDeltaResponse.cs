namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     Read-only projection of how the current draft differs from the latest sealed golden manifest
///     for one architecture identity (PC-06).
/// </summary>
public sealed class ArchitectureSealDeltaResponse
{
    public Guid ArchitectureId
    {
        get;
        set;
    }

    public bool HasPriorSeal
    {
        get;
        set;
    }

    public Guid? LatestSealedManifestId
    {
        get;
        set;
    }

    public Guid? LatestSealedReviewRunId
    {
        get;
        set;
    }

    public Guid? CurrentDraftId
    {
        get;
        set;
    }

    public IReadOnlyList<ArchitectureSealDeltaItem> Diffs
    {
        get;
        set;
    } = [];

    /// <summary>Server-owned copy forbidding treating this panel as sealed evidence.</summary>
    public string HonestyCopy
    {
        get;
        set;
    } = ArchitectureSealDeltaHonesty.OrientationOnly;

    /// <summary>Populated when there is nothing to diff (no seal, no draft, or identical).</summary>
    public string? EmptyStateCopy
    {
        get;
        set;
    }
}
