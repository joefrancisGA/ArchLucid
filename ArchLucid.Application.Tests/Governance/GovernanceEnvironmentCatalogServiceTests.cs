using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
public sealed class GovernanceEnvironmentCatalogServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task GetCatalogAsync_returns_defaults_without_persisting_when_scope_is_empty()
    {
        InMemoryGovernanceEnvironmentCatalogRepository repository = new();
        GovernanceEnvironmentCatalogService service = CreateService(repository);

        GovernanceEnvironmentCatalog catalog = await service.GetCatalogAsync(Scope, CancellationToken.None);

        catalog.Environments.Should().HaveCount(3);
        catalog.Transitions.Should().HaveCount(2);
        catalog.IsAdministratorConfigured.Should().BeFalse();
        (await repository.GetByScopeAsync(Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId, CancellationToken.None))
            .Should()
            .BeNull();
    }

    [Fact]
    public async Task ReplaceCatalogAsync_rejects_duplicate_slugs()
    {
        InMemoryGovernanceEnvironmentCatalogRepository repository = new();
        GovernanceEnvironmentCatalogService service = CreateService(repository);

        ReplaceGovernanceEnvironmentCatalogRequest request = new()
        {
            Environments =
            [
                new GovernanceEnvironmentDefinition { Slug = "qa", DisplayName = "QA", SortOrder = 0, IsActive = true },
                new GovernanceEnvironmentDefinition { Slug = "qa", DisplayName = "QA duplicate", SortOrder = 1, IsActive = true },
            ],
            Transitions =
            [
                new GovernanceEnvironmentTransition { SourceSlug = "qa", TargetSlug = "qa" },
            ],
        };

        Func<Task> act = async () => await service.ReplaceCatalogAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task ReplaceCatalogAsync_rejects_zero_transitions()
    {
        InMemoryGovernanceEnvironmentCatalogRepository repository = new();
        GovernanceEnvironmentCatalogService service = CreateService(repository);

        ReplaceGovernanceEnvironmentCatalogRequest request = new()
        {
            Environments =
            [
                new GovernanceEnvironmentDefinition { Slug = "draft", DisplayName = "Draft", SortOrder = 0, IsActive = true },
            ],
            Transitions = [],
        };

        Func<Task> act = async () => await service.ReplaceCatalogAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*At least one environment transition is required*");
    }

    [Fact]
    public async Task ReplaceCatalogAsync_rejects_duplicate_transition_edges()
    {
        InMemoryGovernanceEnvironmentCatalogRepository repository = new();
        GovernanceEnvironmentCatalogService service = CreateService(repository);

        ReplaceGovernanceEnvironmentCatalogRequest request = new()
        {
            Environments =
            [
                new GovernanceEnvironmentDefinition { Slug = "draft", DisplayName = "Draft", SortOrder = 0, IsActive = true },
                new GovernanceEnvironmentDefinition { Slug = "approved", DisplayName = "Approved", SortOrder = 1, IsActive = true },
            ],
            Transitions =
            [
                new GovernanceEnvironmentTransition { SourceSlug = "draft", TargetSlug = "approved" },
                new GovernanceEnvironmentTransition { SourceSlug = "draft", TargetSlug = "approved" },
            ],
        };

        Func<Task> act = async () => await service.ReplaceCatalogAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Duplicate transition*");
    }

    [Fact]
    public async Task IsValidTransitionAsync_uses_administrator_catalog()
    {
        InMemoryGovernanceEnvironmentCatalogRepository repository = new();
        GovernanceEnvironmentCatalogService service = CreateService(repository);

        await service.ReplaceCatalogAsync(
            new ReplaceGovernanceEnvironmentCatalogRequest
            {
                Environments =
                [
                    new GovernanceEnvironmentDefinition { Slug = "draft", DisplayName = "Draft", SortOrder = 0, IsActive = true },
                    new GovernanceEnvironmentDefinition { Slug = "approved", DisplayName = "Approved", SortOrder = 1, IsActive = true },
                ],
                Transitions =
                [
                    new GovernanceEnvironmentTransition { SourceSlug = "draft", TargetSlug = "approved" },
                ],
            },
            CancellationToken.None);

        (await service.IsValidTransitionAsync("draft", "approved", CancellationToken.None)).Should().BeTrue();
        (await service.IsValidTransitionAsync("approved", "draft", CancellationToken.None)).Should().BeFalse();
    }

    [Fact]
    public async Task IsValidTransitionAsync_falls_back_to_static_ladder_when_scope_is_unconfigured()
    {
        InMemoryGovernanceEnvironmentCatalogRepository repository = new();
        GovernanceEnvironmentCatalogService service = CreateService(repository);

        (await service.IsValidTransitionAsync("dev", "test", CancellationToken.None)).Should().BeTrue();
        (await service.IsValidTransitionAsync("dev", "prod", CancellationToken.None)).Should().BeFalse();
    }

    private static GovernanceEnvironmentCatalogService CreateService(IGovernanceEnvironmentCatalogRepository repository)
    {
        MockScopeContextProvider scopeProvider = new(Scope);

        return new GovernanceEnvironmentCatalogService(scopeProvider, repository);
    }

    private sealed class MockScopeContextProvider(ScopeContext scope) : IScopeContextProvider
    {
        public ScopeContext GetCurrentScope() => scope;
    }
}
