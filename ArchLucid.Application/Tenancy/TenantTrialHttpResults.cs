namespace ArchLucid.Application.Tenancy;

public sealed class TenantTrialStatusDto
{
    public string Status { get; init; } = "None";

    public DateTimeOffset? TrialStartUtc { get; init; }

    public DateTimeOffset? TrialExpiresUtc { get; init; }

    public int? DaysRemaining { get; init; }

    public int TrialRunsUsed { get; init; }

    public int? TrialRunsLimit { get; init; }

    public int TrialSeatsUsed { get; init; }

    public int? TrialSeatsLimit { get; init; }

    public Guid? TrialSampleRunId { get; init; }

    public Guid? TrialWelcomeRunId { get; init; }

    public DateTimeOffset? FirstCommitUtc { get; init; }

    public double? TimeToFirstCommittedManifestTotalSeconds { get; init; }

    public decimal? BaselineReviewCycleHours { get; init; }

    public string? BaselineReviewCycleSource { get; init; }

    public DateTimeOffset? BaselineReviewCycleCapturedUtc { get; init; }

    public bool IdentityHandoffPending { get; init; }
}

public sealed class TenantTrialLinkEntraBody
{
    public Guid EntraTenantId { get; init; }

    public string? LocalEmail { get; init; }

    public string? EntraOid { get; init; }
}

public sealed class TenantTrialConvertBody
{
    public string? TargetTier { get; init; }
}

public enum TenantTrialHttpOutcome
{
    Success,
    TenantNotFound,
    ValidationFailed,
    Conflict,
}

public sealed record TenantTrialStatusQueryResult
{
    public required TenantTrialHttpOutcome Outcome { get; init; }

    public TenantTrialStatusDto? Status { get; init; }
}

public sealed record TenantTrialLinkEntraResult
{
    public required TenantTrialHttpOutcome Outcome { get; init; }

    public string? Message { get; init; }
}

public sealed record TenantTrialConvertResult
{
    public required TenantTrialHttpOutcome Outcome { get; init; }

    public string? Message { get; init; }
}
