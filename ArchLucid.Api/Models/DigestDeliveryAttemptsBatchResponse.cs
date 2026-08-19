using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models;

/// <summary>Batch delivery-attempt payload keyed by digest id.</summary>
[ExcludeFromCodeCoverage(Justification = "API response DTO; no business logic.")]
public sealed class DigestDeliveryAttemptsBatchResponse
{
    public List<DigestDeliveryAttemptsForDigestResponse> Items
    {
        get;
        set;
    } = [];
}
