using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Contracts;

/// <summary>
/// JSON contract for <see cref="ArchLucid.Persistence.Queries.ManifestSummaryDto"/> (manifest summary endpoint).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "API contract DTO; no business logic.")]
public class ManifestSummaryResponse
{
    /// <inheritdoc cref="ArchLucid.Persistence.Queries.ManifestSummaryDto.ManifestId"/>
    public Guid ManifestId { get; set; }
    /// <inheritdoc cref="ArchLucid.Persistence.Queries.ManifestSummaryDto.RunId"/>
    public Guid RunId { get; set; }

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.ManifestSummaryDto.CreatedUtc"/>
    public DateTime CreatedUtc { get; set; }

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.ManifestSummaryDto.ManifestHash"/>
    public string ManifestHash { get; set; } = null!;

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.ManifestSummaryDto.RuleSetId"/>
    public string RuleSetId { get; set; } = null!;

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.ManifestSummaryDto.RuleSetVersion"/>
    public string RuleSetVersion { get; set; } = null!;

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.ManifestSummaryDto.DecisionCount"/>
    public int DecisionCount { get; set; }

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.ManifestSummaryDto.WarningCount"/>
    public int WarningCount { get; set; }

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.ManifestSummaryDto.UnresolvedIssueCount"/>
    public int UnresolvedIssueCount { get; set; }

    /// <inheritdoc cref="ArchLucid.Persistence.Queries.ManifestSummaryDto.Status"/>
    public string Status { get; set; } = null!;

    /// <summary>True when <see cref="WarningCount"/> is greater than zero.</summary>
    public bool HasWarnings { get; set; }

    /// <summary>True when <see cref="UnresolvedIssueCount"/> is greater than zero.</summary>
    public bool HasUnresolvedIssues { get; set; }

    /// <summary>
    /// Single-line summary for operator shells (deterministic composition from counts and <see cref="Status"/>).
    /// </summary>
    public string OperatorSummary { get; set; } = "";
}
