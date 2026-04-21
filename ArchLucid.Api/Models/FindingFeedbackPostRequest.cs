using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models;

[ExcludeFromCodeCoverage(Justification = "API request DTO; no business logic.")]
public sealed class FindingFeedbackPostRequest
{
    /// <summary>-1 (thumbs down) or +1 (thumbs up).</summary>
    public short Score { get; set; }
}
