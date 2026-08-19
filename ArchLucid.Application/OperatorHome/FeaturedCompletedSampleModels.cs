namespace ArchLucid.Application.OperatorHome;

/// <summary>Resolved featured completed sample for operator home — safe customer-facing fields only.</summary>
public sealed class FeaturedCompletedSampleSnapshot
{
    public Guid? SelectedRunId { get; init; }

    public bool IsConfigured { get; init; }

    public bool IsAvailable { get; init; }

    public string? ReviewTitle { get; init; }

    public string? ArchitectureName { get; init; }

    public DateTimeOffset? CompletedUtc { get; init; }

    public bool IsSampleApproved { get; init; }
}

/// <summary>Eligible completed review row for workspace-owner sample selection.</summary>
public sealed class FeaturedCompletedSampleCandidate
{
    public required Guid RunId { get; init; }

    public required string ReviewTitle { get; init; }

    public required string ArchitectureName { get; init; }

    public required DateTimeOffset CompletedUtc { get; init; }

    public required bool IsSampleApproved { get; init; }
}
