namespace ArchLucid.Application.Pilots;

/// <summary>Outcome of sponsor pack delivery audit recording.</summary>
public enum SponsorPackSentOutcome
{
    Recorded,
    RunNotFound,
    NotCommitted,
}

/// <summary>Outcome of preliminary sponsor share audit recording.</summary>
public enum SponsorPreliminaryShareOutcome
{
    Recorded,
    RunNotFound,
    OverrideRequired,
}

/// <summary>Result of <see cref="IPilotsApplicationService.RecordSponsorPackSentAsync"/>.</summary>
public sealed record SponsorPackSentResult(SponsorPackSentOutcome Outcome);

/// <summary>Result of <see cref="IPilotsApplicationService.RecordSponsorPreliminaryShareAsync"/>.</summary>
public sealed record SponsorPreliminaryShareResult(SponsorPreliminaryShareOutcome Outcome);

/// <summary>Submitted optional value metrics for POST scorecard.</summary>
public sealed record PilotScorecardValueMetricsSubmission(
    decimal? HoursSaved,
    int? RisksMitigated,
    string? QualitativeNotes);

/// <summary>Result of <see cref="IPilotsApplicationService.CreateCloseoutAsync"/>.</summary>
public sealed record PilotCloseoutCreateResult(Guid CloseoutId);
