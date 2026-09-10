using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

using Moq;

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
    private const string ActorOid = "jwt:tenant:actor";

    [Fact]
    public async Task EvaluateAsync_loads_restrict_flag_and_share_role_from_repository()
    {
        Mock<IArchitectureIdentityRepository> identityRepository = new();
        InMemoryArchitectureShareRepository shareRepository = new();

        identityRepository
            .Setup(repository => repository.GetByIdAsync(Scope, ArchitectureId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureIdentityRecord
            {
                ArchitectureId = ArchitectureId,
                RestrictToShares = true,
            });

        await shareRepository.UpsertAsync(
            Scope,
            new ArchitectureShareRecord
            {
                ArchitectureId = ArchitectureId,
                ActorOid = ActorOid,
                Role = ArchitectureShareRoles.Decide,
                GrantedBy = "jwt:actor",
                GrantedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        ArchitectureShareAccessService sut = new(identityRepository.Object, shareRepository);

        ArchitectureShareAccessEvaluation evaluation = await sut.EvaluateAsync(
            Scope,
            ArchitectureId,
            ActorOid,
            hasReadAuthority: true,
            hasExecuteAuthority: true,
            hasWorkspaceAdminAuthority: false,
            CancellationToken.None);

        evaluation.ArchitectureFound.Should().BeTrue();
        evaluation.RestrictToShares.Should().BeTrue();
        evaluation.ShareRole.Should().Be(ArchitectureShareRoles.Decide);
        evaluation.CanDecide.Should().BeTrue();
    }
}
