using ArchLucid.Application.Architecture;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scim.Models;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

/// <summary>AS-096: architecture share grants reject SCIM group principals.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class ArchitectureShareGrantTargetValidatorTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    private static readonly Guid PlatformUserId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid ScimGroupId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private readonly Mock<IPlatformUserRepository> _platformUsers = new();
    private readonly Mock<IScimGroupRepository> _scimGroups = new();

    [Fact]
    public async Task ValidateUserTargetAsync_rejects_scim_group_id()
    {
        _scimGroups
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, ScimGroupId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ScimGroupRecord
            {
                Id = ScimGroupId,
                TenantId = Scope.TenantId,
                DisplayName = "Architects",
                ExternalId = "grp-architects",
            });

        ArchitectureShareGrantTargetValidator sut = new(_platformUsers.Object, _scimGroups.Object);

        ArchitectureShareGrantTargetValidationResult result = await sut.ValidateUserTargetAsync(
            Scope,
            ScimGroupId,
            CancellationToken.None);

        result.Status.Should().Be(ArchitectureShareGrantTargetValidationStatus.ScimGroupNotSupported);
    }

    [Fact]
    public async Task ValidateUserTargetAsync_accepts_existing_platform_user()
    {
        _scimGroups
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, PlatformUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScimGroupRecord?)null);

        _platformUsers
            .Setup(repository => repository.GetByIdAsync(PlatformUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PlatformUserRecord { Id = PlatformUserId, PrimaryEmail = "reader@example.com" });

        ArchitectureShareGrantTargetValidator sut = new(_platformUsers.Object, _scimGroups.Object);

        ArchitectureShareGrantTargetValidationResult result = await sut.ValidateUserTargetAsync(
            Scope,
            PlatformUserId,
            CancellationToken.None);

        result.Status.Should().Be(ArchitectureShareGrantTargetValidationStatus.Valid);
    }

    [Fact]
    public async Task ValidateUserTargetAsync_rejects_unknown_principal()
    {
        Guid unknownId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        _scimGroups
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, unknownId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScimGroupRecord?)null);

        _platformUsers
            .Setup(repository => repository.GetByIdAsync(unknownId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PlatformUserRecord?)null);

        ArchitectureShareGrantTargetValidator sut = new(_platformUsers.Object, _scimGroups.Object);

        ArchitectureShareGrantTargetValidationResult result = await sut.ValidateUserTargetAsync(
            Scope,
            unknownId,
            CancellationToken.None);

        result.Status.Should().Be(ArchitectureShareGrantTargetValidationStatus.UserNotFound);
    }
}
