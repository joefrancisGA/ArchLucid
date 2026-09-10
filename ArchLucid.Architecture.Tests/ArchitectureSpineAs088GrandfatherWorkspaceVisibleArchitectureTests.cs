using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-088: grandfathered architectures (RestrictToShares = false) remain list-visible until opt-in.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs088GrandfatherWorkspaceVisibleArchitectureTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task As088_list_includes_unrestricted_architecture_for_workspace_readers()
    {
        InMemoryArchitectureIdentityRepository repository = new();
        ArchitectureIdentityRecord created = await repository.CreateAsync(Scope, "Grandfather package", null);

        created.RestrictToShares.Should().BeFalse("AS-088 default open — column defaults to 0 on new rows");

        ArchitectureIdentityListPage page = await repository.ListAsync(Scope, page: 1, pageSize: 50);

        page.Items.Should().ContainSingle(item => item.ArchitectureId == created.ArchitectureId);
    }
}
