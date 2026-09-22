using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class ArchitectureShareManagementServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    private static readonly Guid ArchitectureId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid ShareUserId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    [Fact]
    public async Task GetSharesAsync_returns_list_with_restrict_flag()
    {
        Mock<IArchitectureIdentityRepository> identities = CreateIdentityMock(restrictToShares: true);
        Mock<IArchitectureShareRepository> shares = new();

        shares
            .Setup(repository => repository.ListByArchitectureIdAsync(Scope, ArchitectureId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new ArchitectureShareRecord
                {
                    ArchitectureId = ArchitectureId,
                    ActorOid = ArchitectureSharePlatformUserActorOid.FromUserId(ShareUserId),
                    Role = ArchitectureShareRoles.Admin,
                    GrantedBy = "owner@example.com",
                    GrantedUtc = DateTime.UtcNow,
                },
            ]);

        ArchitectureShareManagementService sut = new(
            identities.Object,
            shares.Object,
            CreateValidGrantTargetValidator().Object);

        ArchitectureShareListResult result = await sut.GetSharesAsync(Scope, ArchitectureId, CancellationToken.None);

        result.Status.Should().Be(ArchitectureShareListStatus.Success);
        result.Response!.RestrictToShares.Should().BeTrue();
        result.Response.Shares.Should().ContainSingle(share =>
            share.ActorOid == ArchitectureSharePlatformUserActorOid.FromUserId(ShareUserId));
    }

    [Fact]
    public async Task UpsertShareAsync_rejects_invalid_role()
    {
        Mock<IArchitectureIdentityRepository> identities = CreateIdentityMock();
        Mock<IArchitectureShareRepository> shares = new();

        ArchitectureShareManagementService sut = new(
            identities.Object,
            shares.Object,
            CreateValidGrantTargetValidator().Object);

        ArchitectureShareUpsertResult result = await sut.UpsertShareAsync(
            Scope,
            ArchitectureId,
            ShareUserId,
            "Owner",
            "jwt:actor",
            CancellationToken.None);

        result.Status.Should().Be(ArchitectureShareUpsertStatus.InvalidRole);
    }

    [Fact]
    public async Task DeleteShareAsync_returns_not_found_when_row_missing()
    {
        Mock<IArchitectureIdentityRepository> identities = CreateIdentityMock();
        Mock<IArchitectureShareRepository> shares = new();

        shares
            .Setup(repository => repository.TryDeleteAsync(
                Scope,
                ArchitectureId,
                ArchitectureSharePlatformUserActorOid.FromUserId(ShareUserId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        ArchitectureShareManagementService sut = new(
            identities.Object,
            shares.Object,
            CreateValidGrantTargetValidator().Object);

        ArchitectureShareDeleteResult result = await sut.DeleteShareAsync(
            Scope,
            ArchitectureId,
            ShareUserId,
            CancellationToken.None);

        result.Status.Should().Be(ArchitectureShareDeleteStatus.ShareNotFound);
    }

    [Fact]
    public async Task UpsertShareAsync_rejects_scim_group_principal()
    {
        Mock<IArchitectureIdentityRepository> identities = CreateIdentityMock();
        Mock<IArchitectureShareRepository> shares = new();
        Mock<IArchitectureShareGrantTargetValidator> grantTargets = new();

        grantTargets
            .Setup(validator => validator.ValidateUserTargetAsync(
                Scope,
                ShareUserId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureShareGrantTargetValidationResult.ScimGroupNotSupported());

        ArchitectureShareManagementService sut = new(identities.Object, shares.Object, grantTargets.Object);

        ArchitectureShareUpsertResult result = await sut.UpsertShareAsync(
            Scope,
            ArchitectureId,
            ShareUserId,
            ArchitectureShareRoles.View,
            "jwt:actor",
            CancellationToken.None);

        result.Status.Should().Be(ArchitectureShareUpsertStatus.ScimGroupNotSupported);
    }

    private static Mock<IArchitectureShareGrantTargetValidator> CreateValidGrantTargetValidator()
    {
        Mock<IArchitectureShareGrantTargetValidator> validator = new();

        validator
            .Setup(service => service.ValidateUserTargetAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureShareGrantTargetValidationResult.Valid());

        return validator;
    }

    private static Mock<IArchitectureIdentityRepository> CreateIdentityMock(bool restrictToShares = false)
    {
        Mock<IArchitectureIdentityRepository> identities = new();

        identities
            .Setup(repository => repository.GetByIdAsync(Scope, ArchitectureId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureIdentityRecord
            {
                ArchitectureId = ArchitectureId,
                DisplayName = "Payments",
                RestrictToShares = restrictToShares,
            });

        return identities;
    }
}
