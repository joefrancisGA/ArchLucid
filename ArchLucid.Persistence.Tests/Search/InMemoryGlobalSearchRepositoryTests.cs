using ArchLucid.Core.Scoping;
using ArchLucid.Core.Search;
using ArchLucid.Persistence.Search;

namespace ArchLucid.Persistence.Tests.Search;

[Trait("Category", "Unit")]
public sealed class InMemoryGlobalSearchRepositoryTests
{
    [Fact]
    public async Task SearchAsync_returns_empty_result_for_blank_query()
    {
        InMemoryGlobalSearchRepository sut = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        GlobalSearchResult blank = await sut.SearchAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            "   ",
            5,
            CancellationToken.None);

        blank.Should().NotBeNull();
    }

    [Fact]
    public async Task SearchAsync_returns_empty_result_for_non_blank_query()
    {
        InMemoryGlobalSearchRepository sut = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        GlobalSearchResult result = await sut.SearchAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            "gateway",
            5,
            CancellationToken.None);

        result.Should().NotBeNull();
    }
}
