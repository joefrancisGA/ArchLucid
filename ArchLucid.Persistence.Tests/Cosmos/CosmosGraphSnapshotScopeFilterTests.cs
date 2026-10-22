using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Cosmos;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Cosmos;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CosmosGraphSnapshotScopeFilterTests
{
    [SkippableFact]
    public void DocumentMatchesScope_when_scope_empty_allows_legacy_documents()
    {
        ScopeContext scope = new() { TenantId = Guid.Empty, WorkspaceId = Guid.Empty, ProjectId = Guid.Empty };
        GraphSnapshotDocument document = new() { TenantId = "", WorkspaceId = "", ProjectId = "" };

        CosmosGraphSnapshotScopeFilter.DocumentMatchesScope(scope, document).Should().BeTrue();
    }

    [SkippableFact]
    public void DocumentMatchesScope_rejects_cross_tenant_document()
    {
        Guid tenantA = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid tenantB = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid workspace = Guid.Parse("33333333-3333-3333-3333-333333333333");
        Guid project = Guid.Parse("44444444-4444-4444-4444-444444444444");

        ScopeContext scope = new() { TenantId = tenantA, WorkspaceId = workspace, ProjectId = project };

        GraphSnapshotDocument document = new()
        {
            TenantId = tenantB.ToString("D"),
            WorkspaceId = workspace.ToString("D"),
            ProjectId = project.ToString("D")
        };

        CosmosGraphSnapshotScopeFilter.DocumentMatchesScope(scope, document).Should().BeFalse();
    }
}
