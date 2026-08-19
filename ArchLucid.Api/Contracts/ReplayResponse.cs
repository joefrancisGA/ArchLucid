using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Contracts;

/// <summary>
///     JSON subset of <see cref="ArchLucid.Persistence.Replay.ReplayResult" /> (omits full
///     <see cref="ArchLucid.Persistence.Queries.RunDetailDto" /> and entity bodies).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "API contract DTO; no business logic.")]
public class ReplayResponse
{
    /// <inheritdoc cref="ArchLucid.Persistence.Replay.ReplayResult.RunId" />
    public Guid RunId
    {
        get;
        set;
    }

    /// <inheritdoc cref="ArchLucid.Persistence.Replay.ReplayResult.Mode" />
    public string Mode
    {
        get;
        set;
    } = null!;

    /// <inheritdoc cref="ArchLucid.Persistence.Replay.ReplayResult.ReplayedUtc" />
    public DateTime ReplayedUtc
    {
        get;
        set;
    }

    /// <summary>Id of <see cref="ArchLucid.Persistence.Replay.ReplayResult.RebuiltManifest" /> when present.</summary>
    public Guid? RebuiltManifestId
    {
        get;
        set;
    }

    /// <summary>Hash of rebuilt manifest when present.</summary>
    public string? RebuiltManifestHash
    {
        get;
        set;
    }

    /// <summary>Id of <see cref="ArchLucid.Persistence.Replay.ReplayResult.RebuiltArtifactBundle" /> when present.</summary>
    public Guid? RebuiltArtifactBundleId
    {
        get;
        set;
    }

    /// <inheritdoc cref="ArchLucid.Persistence.Replay.ReplayResult.Validation" />
    public ReplayValidationResponse Validation
    {
        get;
        set;
    } = new();

    /// <summary>True when replay produced a rebuilt manifest or artifact bundle reference.</summary>
    public bool HasRebuildOutput
    {
        get;
        set;
    }

    /// <summary>Number of entries in <see cref="ReplayValidationResponse.Notes" />.</summary>
    public int ValidationNoteCount
    {
        get;
        set;
    }
}
