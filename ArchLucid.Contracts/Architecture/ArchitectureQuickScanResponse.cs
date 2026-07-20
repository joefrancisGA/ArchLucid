using System.ComponentModel.DataAnnotations;

namespace ArchLucid.Contracts.Architecture;

/// <summary>Lightweight quick-scan outcome for HTTP clients.</summary>
public sealed class ArchitectureQuickScanResponse
{
    [Required]
    public string ScanId { get; init; } = string.Empty;

    [Required]
    public string SystemName { get; init; } = string.Empty;

    [Required]
    public string PrimaryEnvironment { get; init; } = string.Empty;

    [Required]
    public string Summary { get; init; } = string.Empty;

    public List<ArchitectureQuickScanFindingItem> Findings { get; init; } = [];

    public List<string> PositiveObservations { get; init; } = [];

    public List<string> RecommendedNextSteps { get; init; } = [];

    public DateTime CompletedUtc { get; init; }

    /// <summary>True when the response is a static demonstration sample (no model call).</summary>
    public bool IsSampleResult { get; init; }

    [Required]
    public string DemonstrationDisclaimer { get; init; } = string.Empty;
}
