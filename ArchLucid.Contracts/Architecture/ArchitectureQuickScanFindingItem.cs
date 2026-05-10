using System.ComponentModel.DataAnnotations;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Contracts.Architecture;

/// <summary>One quick-scan finding returned to API clients (subset of <see cref="ArchitectureFinding" />).</summary>
public sealed class ArchitectureQuickScanFindingItem
{
    /// <summary>Short title (maps from finding category).</summary>
    [Required]
    public string Title { get; init; } = string.Empty;

    /// <summary>Detail text (maps from finding message).</summary>
    [Required]
    public string Description { get; init; } = string.Empty;

    public FindingSeverity Severity { get; init; }

    public double? ConfidenceScore { get; init; }

    public FindingConfidenceLevel? ConfidenceLevel { get; init; }
}
