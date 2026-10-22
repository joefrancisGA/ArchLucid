namespace ArchLucid.Core.Scoping;

/// <summary>Published anchors for evaluator demo workspaces seeded under <see cref="ScopeIds.DefaultTenant"/>.</summary>
/// <remarks>Sha256-derived strings + DefaultTenant GUID <c>N</c> format — parity tests guard drift.</remarks>
public static class DemoWorkspaceStableIds
{
    /// <summary>Tenant workspace backing the self-demo tour (marketing + Dev bootstrap).</summary>
    public static readonly Guid ProductTourWorkspaceId = Guid.Parse("2b2571e1-1884-62a2-1e8b-15a2a70a0342");

    /// <summary><c>ScopeProjectId</c> GUID for seeded tour runs + exports.</summary>
    public static readonly Guid ProductTourProjectScopeId = Guid.Parse("9beb918c-83d4-1385-0486-21f341806c5c");

    /// <summary>Committed demo architecture review surfaced at <c>/reviews/{Guid:N}</c> in operator shell.</summary>
    public static readonly Guid ProductTourArchitectureReviewRunId = Guid.Parse("b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf");

    /// <summary>Workspace B synthetic regulated storyline (Alpine × Meridian).</summary>
    public static readonly Guid RegulatedScenarioWorkspaceId = Guid.Parse("3f1a16c3-172e-5632-c53a-3ed16446f603");

    /// <summary><c>ScopeProjectId</c> for seeded regulated runs.</summary>
    public static readonly Guid RegulatedScenarioProjectScopeId = Guid.Parse("49074cdf-bdab-a5fa-789b-09a3e556a8f2");

    /// <summary>Committed regulated AI governance review run.</summary>
    public static readonly Guid RegulatedScenarioArchitectureReviewRunId = Guid.Parse("61c60d76-2b80-93f9-46bb-2f66fd608b9b");
}
