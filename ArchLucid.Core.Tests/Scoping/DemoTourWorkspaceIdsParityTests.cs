using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Scoping;

public sealed class DemoTourWorkspaceIdsParityTests
{
/// <summary>Marketing/docs publish literal GUID anchors; derivation must stay byte-identical.</summary>
[Trait("Category", "Unit")]
[Fact]
    public void Derivations_under_default_tenant_match_published_stable_ids()
    {
        Guid tenantId = ScopeIds.DefaultTenant;

        DemoTourWorkspaceIds.WorkspaceRowId(tenantId).Should().Be(DemoWorkspaceStableIds.ProductTourWorkspaceId);
        DemoTourWorkspaceIds.ProjectScopeRowId(tenantId).Should().Be(DemoWorkspaceStableIds.ProductTourProjectScopeId);
        DemoTourWorkspaceIds.AuthorityRunId(tenantId).Should().Be(DemoWorkspaceStableIds.ProductTourArchitectureReviewRunId);
    }
}
