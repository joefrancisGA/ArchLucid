using ArchLucid.Application.Architecture;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class ArchitectureShareAccessServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    private static readonly Guid ArchitectureId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid ActorUserId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    [Fact]
    public async Task EvaluateAsync_loads_restrict_flag_and_share_role_from_repository()
    {
        InMemoryArchitectureShareRepository repository = new();
        repository.SeedArchitecture(ArchitectureId, restrictToShares: true);
        repository.SeedShare(new ArchitectureShareRecord
        {
            ArchitectureId = ArchitectureId,
            UserId = ActorUserId,
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ScopeProjectId = Scope.ProjectId,
            Role = ArchitectureShareRoles.Decide,
            GrantedBy = "jwt:actor",
            GrantedUtc = DateTime.UtcNow,
        });

        ArchitectureShareAccessService sut = new(repository);

        ArchitectureShareAccessEvaluation evaluation = await sut.EvaluateAsync(
            Scope,
            ArchitectureId,
            ActorUserId,
            hasReadAuthority: true,
            hasExecuteAuthority: true,
            hasWorkspaceAdminAuthority: false,
            CancellationToken.None);

        evaluation.ArchitectureFound.Should().BeTrue();
        evaluation.RestrictToShares.Should().BeTrue();
        evaluation.ShareRole.Should().Be(ArchitectureShareRoles.Decide);
        evaluation.CanDecide.Should().BeTrue();
    }

    [Fact]
    public async Task CountRestrictedWithoutActorShareAsync_returns_zero_for_workspace_admin()
    {
        InMemoryArchitectureShareRepository repository = new();
        repository.SeedArchitecture(ArchitectureId, restrictToShares: true);

        ArchitectureShareAccessService sut = new(repository);

        int count = await sut.CountRestrictedWithoutActorShareAsync(
            Scope,
            ActorUserId,
            hasWorkspaceAdminAuthority: true,
            CancellationToken.None);

        count.Should().Be(0);
    }

    [Fact]
    public async Task CountRestrictedWithoutActorShareAsync_counts_restricted_without_share_row()
    {
        InMemoryArchitectureShareRepository repository = new();
        repository.SeedArchitecture(ArchitectureId, restrictToShares: true);

        ArchitectureShareAccessService sut = new(repository);

        int count = await sut.CountRestrictedWithoutActorShareAsync(
            Scope,
            ActorUserId,
            hasWorkspaceAdminAuthority: false,
            CancellationToken.None);

        count.Should().Be(1);
    }
}
