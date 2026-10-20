using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Tenancy;

/// <summary>Result of <see cref="TenantWorkspaceScopeGuard"/> tenant + workspace existence checks.</summary>
public sealed record TenantWorkspaceScopeResult
{
    public required TenantWorkspaceScopeOutcome Outcome { get; init; }

    public ScopeContext? Scope { get; init; }
}
