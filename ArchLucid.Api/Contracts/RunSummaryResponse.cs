using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Contracts;

/// <summary>
/// JSON contract for <see cref="ArchLucid.Persistence.Queries.RunSummaryDto"/> (authority run list and summary endpoints).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "API contract DTO; no business logic.")]
public class RunSummaryResponse
{
    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.RunId"/>
    public Guid RunId { get; set; }
    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.ProjectId"/>
    public string ProjectId { get; set; } = null!;

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.Description"/>
    public string? Description { get; set; }
    public DateTime CreatedUtc { get; set; }
    public Guid? ContextSnapshotId { get; set; }
    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.GraphSnapshotId"/>
    public Guid? GraphSnapshotId { get; set; }

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.FindingsSnapshotId"/>
    public Guid? FindingsSnapshotId { get; set; }

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.GoldenManifestId"/>
    public Guid? GoldenManifestId { get; set; }

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.DecisionTraceId"/>
    public Guid? DecisionTraceId { get; set; }

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.ArtifactBundleId"/>
    public Guid? ArtifactBundleId { get; set; }

    /// <summary>Operator-facing flags mirroring <see cref="ArchLucid.Persistence.Queries.RunSummaryDto"/> computed properties (JSON for UI without null inference).</summary>
    public bool HasContextSnapshot { get; set; }

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.HasGraphSnapshot"/>
    public bool HasGraphSnapshot { get; set; }

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.HasFindingsSnapshot"/>
    public bool HasFindingsSnapshot { get; set; }

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.HasGoldenManifest"/>
    public bool HasGoldenManifest { get; set; }

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.HasDecisionTrace"/>
    public bool HasDecisionTrace { get; set; }

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.HasArtifactBundle"/>
    public bool HasArtifactBundle { get; set; }
}
