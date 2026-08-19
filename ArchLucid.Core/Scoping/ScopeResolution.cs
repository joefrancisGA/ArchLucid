namespace ArchLucid.Core.Scoping;

/// <summary>
///     Full tenant/workspace/project scope with per-dimension source metadata (TB-304).
/// </summary>
public sealed class ScopeResolution
{
    /// <summary>Resolved scope triple for repository and service calls.</summary>
    public ScopeContext Scope { get; init; } = new();

    /// <summary>Tenant dimension resolution.</summary>
    public ScopeDimensionResolution Tenant { get; init; }

    /// <summary>Workspace dimension resolution.</summary>
    public ScopeDimensionResolution Workspace { get; init; }

    /// <summary>Project dimension resolution.</summary>
    public ScopeDimensionResolution Project { get; init; }

    /// <summary>Builds a resolution where every dimension shares the same source.</summary>
    public static ScopeResolution FromUniformSource(ScopeContext scope, ScopeSource source)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return new ScopeResolution
        {
            Scope = scope,
            Tenant = new ScopeDimensionResolution(scope.TenantId, source),
            Workspace = new ScopeDimensionResolution(scope.WorkspaceId, source),
            Project = new ScopeDimensionResolution(scope.ProjectId, source),
        };
    }

    /// <summary>Builds a resolution with independent per-dimension sources.</summary>
    public static ScopeResolution Create(
        ScopeContext scope,
        ScopeDimensionResolution tenant,
        ScopeDimensionResolution workspace,
        ScopeDimensionResolution project)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return new ScopeResolution
        {
            Scope = scope,
            Tenant = tenant,
            Workspace = workspace,
            Project = project,
        };
    }
}
