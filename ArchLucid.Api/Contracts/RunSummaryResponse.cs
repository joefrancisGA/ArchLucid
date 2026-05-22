using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Contracts;

/// <summary>
///     JSON contract for <see cref="ArchLucid.Persistence.Queries.RunSummaryDto" /> (authority run list and summary
///     endpoints).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "API contract DTO; no business logic.")]
public class RunSummaryResponse
{
    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.RunId" />
    public Guid RunId
    {
        get;
        set;
    }

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.ProjectId" />
    public string ProjectId
    {
        get;
        set;
    } = null!;

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.Description" />
    public string? Description
    {
        get;
        set;
    }

    /// <summary>
    ///     Buyer-facing title mirrored from <see cref="Description" /> today — additive JSON field so Compare/run pickers
    ///     can bind stable labels without inferring from slug identifiers alone.
    /// </summary>
    public string? DisplayName
    {
        get;
        set;
    }

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.IsDemoWelcomeRun" />
    public bool IsDemoWelcomeRun
    {
        get;
        set;
    }

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.IsSample" />
    public bool IsSample
    {
        get;
        set;
    }

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.IsPinned" />
    public bool IsPinned
    {
        get;
        set;
    }

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    /// <summary>
    ///     Operator-facing flags mirroring <see cref="ArchLucid.Persistence.Queries.RunSummaryDto" /> computed properties
    ///     (JSON for UI without null inference).
    /// </summary>
    public bool HasContextSnapshot
    {
        get;
        set;
    }

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.HasGraphSnapshot" />
    public bool HasGraphSnapshot
    {
        get;
        set;
    }

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.HasFindingsSnapshot" />
    public bool HasFindingsSnapshot
    {
        get;
        set;
    }

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.HasGoldenManifest" />
    public bool HasGoldenManifest
    {
        get;
        set;
    }

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.HasDecisionTrace" />
    public bool HasDecisionTrace
    {
        get;
        set;
    }

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.HasArtifactBundle" />
    public bool HasArtifactBundle
    {
        get;
        set;
    }

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.RunDegradedExecution" />
    public bool RunDegradedExecution
    {
        get;
        set;
    }

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.DegradedExecutionAgents" />
    public IReadOnlyList<string> DegradedExecutionAgents
    {
        get;
        set;
    } = [];

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.HasWarnings" />
    public bool HasWarnings
    {
        get;
        set;
    }

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.RunSummaryDto.HasGovernanceWarnings" />
    public bool HasGovernanceWarnings
    {
        get;
        set;
    }
}
