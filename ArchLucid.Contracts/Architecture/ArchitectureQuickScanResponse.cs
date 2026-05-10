using System.ComponentModel.DataAnnotations;

namespace ArchLucid.Contracts.Architecture;

/// <summary>Lightweight quick-scan outcome for HTTP clients.</summary>
public sealed class ArchitectureQuickScanResponse
{
    [Required]
    public string ScanId { get; init; } = string.Empty;

    [Required]
    public string Summary { get; init; } = string.Empty;

    public List<ArchitectureQuickScanFindingItem> Findings { get; init; } = [];

    public DateTime CompletedUtc { get; init; }
}
