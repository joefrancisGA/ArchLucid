namespace ArchLucid.Core.Scoping;

/// <summary>Published anchors for evaluator CTAs tied to Workspace A seeded under <see cref="ScopeIds.DefaultTenant"/>.</summary>
/// <remarks>Sha256-derived from <c>ArchLucid.Demo.ProductTour.*</c> + DefaultTenant GUID <c>N</c> format — parity tests guard drift.</remarks>
public static class DemoWorkspaceStableIds
{
    /// <summary>Tenant workspace backing the self-demo tour (marketing + Dev bootstrap).</summary>
    public static readonly Guid ProductTourWorkspaceId = Guid.Parse("2b2571e1-1884-62a2-1e8b-15a2a70a0342");

    /// <summary><c>ScopeProjectId</c> GUID for seeded tour runs + exports.</summary>
    public static readonly Guid ProductTourProjectScopeId = Guid.Parse("9beb918c-83d4-1385-0486-21f341806c5c");

    /// <summary>Committed demo architecture review surfaced at <c>/reviews/{Guid:N}</c> in operator shell.</summary>
    public static readonly Guid ProductTourArchitectureReviewRunId = Guid.Parse("b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf");
}
