using System.ComponentModel.DataAnnotations;

namespace ArchLucid.Contracts.Architecture;

/// <summary>Minimal input for a single-pass architecture quick scan (no full wizard).</summary>
public sealed class ArchitectureQuickScanRequest
{
    /// <summary>Human-readable system or application name.</summary>
    [Required]
    public string SystemName { get; init; } = string.Empty;

    /// <summary>Cloud or platform hint (for example Azure, AWS, GCP, Hybrid).</summary>
    [Required]
    public string CloudProvider { get; init; } = string.Empty;

    /// <summary>Free-text description of scope, constraints, or context.</summary>
    [Required]
    public string Description { get; init; } = string.Empty;
}
