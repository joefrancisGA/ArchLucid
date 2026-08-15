namespace ArchLucid.Application.Operator;

/// <summary>Trial lifecycle fields required by operator shell banners.</summary>
public sealed class OperatorShellTrialStatusSnapshot
{
    public string Status { get; init; } = "None";

    public int? DaysRemaining { get; init; }

    public int TrialRunsUsed { get; init; }

    public int? TrialRunsLimit { get; init; }

    public int TrialSeatsUsed { get; init; }

    public int? TrialSeatsLimit { get; init; }

    public Guid? TrialSampleRunId { get; init; }

    public Guid? TrialWelcomeRunId { get; init; }

    public DateTimeOffset? FirstCommitUtc { get; init; }
}
