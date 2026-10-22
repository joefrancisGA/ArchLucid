using System.ComponentModel.DataAnnotations;

using ArchLucid.Contracts.Serialization;

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

    private List<ArchitectureQuickScanFindingItem> findings = [];

    public List<ArchitectureQuickScanFindingItem> Findings
    {
        get => findings;
        init => findings = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> positiveObservations = [];

    public List<string> PositiveObservations
    {
        get => positiveObservations;
        init => positiveObservations = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> recommendedNextSteps = [];

    public List<string> RecommendedNextSteps
    {
        get => recommendedNextSteps;
        init => recommendedNextSteps = ContractCollectionDefaults.Coalesce(value);
    }

    public DateTime CompletedUtc { get; init; }

    /// <summary>True when the response is a static demonstration sample (no model call).</summary>
    public bool IsSampleResult { get; init; }

    [Required]
    public string DemonstrationDisclaimer { get; init; } = string.Empty;
}
