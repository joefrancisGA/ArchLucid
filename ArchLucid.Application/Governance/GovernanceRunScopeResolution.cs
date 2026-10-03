namespace ArchLucid.Application.Governance;

/// <summary>Outcome of <see cref="GovernanceRunScope.TryResolveScopedRunIdAsync"/>.</summary>
public sealed record GovernanceRunScopeResolution
{
    public bool Succeeded { get; init; }

    public string? NormalizedRunId { get; init; }

    public string? ErrorCode { get; init; }

    public string? Message { get; init; }
}
