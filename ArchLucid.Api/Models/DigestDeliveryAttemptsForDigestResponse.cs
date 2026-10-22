using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Advisory.Delivery;

namespace ArchLucid.Api.Models;

/// <summary>Delivery attempts for one digest within a batch response.</summary>
[ExcludeFromCodeCoverage(Justification = "API response DTO; no business logic.")]
public sealed class DigestDeliveryAttemptsForDigestResponse
{
    public Guid DigestId
    {
        get;
        set;
    }

    public List<DigestDeliveryAttempt> Attempts
    {
        get;
        set;
    } = [];
}
