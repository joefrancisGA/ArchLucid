using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Application.Governance.PolicyPacks;

public enum PolicyPackHttpOutcome
{
    Success,
    ScopeNotFound,
    ResourceNotFound,
    VersionNotFound,
    ValidationFailed,
    CrossTenantDistributionBlocked,
    Conflict,
}

public sealed record PolicyPackHttpResult<T>
{
    public required PolicyPackHttpOutcome Outcome { get; init; }

    public T? Value { get; init; }

    public string? Message { get; init; }

    public static PolicyPackHttpResult<T> ScopeNotFound() =>
        new() { Outcome = PolicyPackHttpOutcome.ScopeNotFound };

    public static PolicyPackHttpResult<T> Success(T value) =>
        new() { Outcome = PolicyPackHttpOutcome.Success, Value = value };
}

public sealed record PolicyPackAssignHttpResult
{
    public required PolicyPackHttpOutcome Outcome { get; init; }

    public PolicyPackAssignment? Assignment { get; init; }

    public Guid? PolicyPackId { get; init; }

    public string? VersionKey { get; init; }
}

public sealed record PolicyPackVersionHttpResult
{
    public required PolicyPackVersionLookupOutcome Outcome { get; init; }

    public PolicyPackVersion? Version { get; init; }

    public Guid? PolicyPackId { get; init; }

    public string? PackVersion { get; init; }
}

public sealed record PolicyPackEffectiveContentHttpResult
{
    public required PolicyPackHttpOutcome Outcome { get; init; }

    public PolicyPackContentDocument? Content { get; init; }

    public EffectivePolicyPackSet? EffectiveSet { get; init; }
}
