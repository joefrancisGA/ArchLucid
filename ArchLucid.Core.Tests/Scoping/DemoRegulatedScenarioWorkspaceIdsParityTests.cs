using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Scoping;

/// <summary>Marketing/docs publish literal Workspace B anchors; derivation must stay byte-identical.</summary>
[Trait("Category", "Unit")]
public sealed class DemoRegulatedScenarioWorkspaceIdsParityTests
{
    [Fact]
    public void Derivations_under_default_tenant_match_published_stable_ids()
    {
        Guid tenantId = ScopeIds.DefaultTenant;

        DemoRegulatedScenarioWorkspaceIds.WorkspaceRowId(tenantId).Should().Be(DemoWorkspaceStableIds.RegulatedScenarioWorkspaceId);
        DemoRegulatedScenarioWorkspaceIds.ProjectScopeRowId(tenantId).Should().Be(DemoWorkspaceStableIds.RegulatedScenarioProjectScopeId);
        DemoRegulatedScenarioWorkspaceIds.AuthorityRunId(tenantId).Should().Be(DemoWorkspaceStableIds.RegulatedScenarioArchitectureReviewRunId);
    }
}
