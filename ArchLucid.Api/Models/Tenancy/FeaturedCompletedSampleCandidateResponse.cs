namespace ArchLucid.Api.Models.Tenancy;

/// <summary>Eligible completed review for workspace-owner featured sample selection.</summary>
public sealed class FeaturedCompletedSampleCandidateResponse
{
    public required Guid RunId { get; init; }

    public required string ReviewTitle { get; init; }

    public required string ArchitectureName { get; init; }

    public required DateTimeOffset CompletedUtc { get; init; }

    public required bool IsSampleApproved { get; init; }
}
