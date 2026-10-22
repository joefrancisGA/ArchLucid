using System.ComponentModel.DataAnnotations;

using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     The transient result of a lightweight, single-pass LLM architecture scan.
/// </summary>
public sealed class QuickScanResult
{
    /// <summary>Unique identifier for this scan result.</summary>
    [Required]
    public string ScanId { get; init; } = Guid.NewGuid().ToString("N");

    /// <summary>High-level summary of the scan.</summary>
    public string Summary { get; init; } = string.Empty;

    /// <summary>Architecture findings identified during the quick scan.</summary>
    private List<ArchitectureFinding> findings = [];

    public List<ArchitectureFinding> Findings
    {
        get => findings;
        init => findings = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>UTC timestamp when this scan was completed.</summary>
    public DateTime CompletedUtc { get; init; } = TimeProvider.System.GetUtcNow().UtcDateTime;
}
