using System.ComponentModel.DataAnnotations;

namespace ArchLucid.Api.Models.CustomerSuccess;

/// <summary>Thumbs feedback on a finding or run.</summary>
public sealed class ProductFeedbackRequest
{
    /// <summary>Optional stable finding reference (e.g. fingerprint or graph node id).</summary>
    public string? FindingRef { get; init; }

    public Guid? RunId { get; init; }

    /// <summary>-1 = thumbs down, 0 = neutral, 1 = thumbs up.</summary>
    [Range(-1, 1)]
    public short Score { get; init; }

    public string? Comment { get; init; }
}
