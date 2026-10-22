using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantWorkspaceScopeGuardTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    [Fact]
    public async Task RequireTenantAndWorkspaceAsync_returns_workspace_not_found_when_list_workspaces_is_null()
    {
        ScopeContext scope = new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(scope);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = TenantId, Name = "t" });
        tenants
            .Setup(repository => repository.ListWorkspacesAsync(TenantId, It.IsAny<CancellationToken>()))
            .Returns(Task.FromResult<IReadOnlyList<TenantWorkspaceListItem>>(null!));

        TenantWorkspaceScopeResult result = await TenantWorkspaceScopeGuard.RequireTenantAndWorkspaceAsync(
            scopeProvider.Object,
            tenants.Object,
            CancellationToken.None);

        result.Outcome.Should().Be(TenantWorkspaceScopeOutcome.WorkspaceNotFound);
    }
}
