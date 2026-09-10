using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.Controllers.Architecture;
using ArchLucid.Api.Support;
using ArchLucid.Api.Tests.Support;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>AS-092: architecture share list/grant/revoke endpoints.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitecturesControllerSharesTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid ArchitectureId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid ShareUserId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    private readonly Mock<IScopeContextProvider> _scopeProvider = new();
    private readonly Mock<IActorContext> _actorContext = new();
    private readonly Mock<IAuditService> _auditService = new();
    private readonly Mock<IArchitectureIdentityService> _identityService = new();
    private readonly Mock<IArchitectureInventoryBindingService> _bindingService = new();
    private readonly Mock<IArchitectureRestrictToSharesService> _restrictToSharesService = new();
    private readonly Mock<IArchitectureShareManagementService> _shareManagementService =
        ArchitectureShareManagementServiceTestDefaults.CreatePermissiveService();
    private readonly Mock<IArchitectureShareAccessService> _shareAccessService = new();
    private readonly Mock<IArchitectureShareAccessGate> _shareAccessGate = ArchitectureShareAccessGateTestDefaults.CreatePermissiveGate();
    private readonly Mock<IAuthenticatedPlatformUserResolver> _platformUserResolver = new();
    private readonly Mock<IArchitectureSealDeltaService> _sealDeltaService = new();
    private readonly Mock<IRunRepository> _runRepository = new();
    private readonly Mock<IGoldenManifestRepository> _goldenManifestRepository = new();
    private readonly Mock<IManifestHashService> _manifestHashService = new();

    public ArchitecturesControllerSharesTests()
    {
        _scopeProvider.Setup(static provider => provider.GetCurrentScope()).Returns(Scope);
        _actorContext.Setup(static context => context.GetActor()).Returns("jwt:actor");
        _auditService
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _shareAccessService
            .Setup(service => service.EvaluateAsync(
                Scope,
                ArchitectureId,
                It.IsAny<Guid?>(),
                It.IsAny<bool>(),
                It.IsAny<bool>(),
                It.IsAny<bool>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureShareAccessEvaluation
            {
                ArchitectureFound = true,
                RestrictToShares = false,
                CanRead = true,
                CanDecide = true,
                CanAdmin = true,
            });
    }

    [Fact]
    public void ListShares_RequiresReadAuthority()
    {
        AuthorizeAttribute? attribute = typeof(ArchitecturesController)
            .GetMethod(nameof(ArchitecturesController.ListShares))
            ?.GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
            .Cast<AuthorizeAttribute>()
            .FirstOrDefault();

        attribute.Should().NotBeNull();
        attribute!.Policy.Should().Be(ArchLucidPolicies.ReadAuthority);
    }

    [Fact]
    public async Task ListShares_ReturnsSharePayload()
    {
        _shareManagementService
            .Setup(service => service.GetSharesAsync(Scope, ArchitectureId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureShareListResult.Success(
                new ArchitectureShareListResponse
                {
                    ArchitectureId = ArchitectureId,
                    RestrictToShares = true,
                    Shares =
                    [
                        new ArchitectureShareGrantResponse
                        {
                            UserId = ShareUserId,
                            Role = ArchitectureShareRoles.View,
                            GrantedBy = "jwt:actor",
                            GrantedUtc = DateTime.UtcNow,
                        },
                    ],
                }));

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.ListShares(ArchitectureId, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ArchitectureShareListResponse response =
            ok.Value.Should().BeOfType<ArchitectureShareListResponse>().Subject;
        response.RestrictToShares.Should().BeTrue();
        response.Shares.Should().ContainSingle(share => share.UserId == ShareUserId);
    }

    [Fact]
    public async Task UpsertShare_WithoutAdmin_Returns404()
    {
        _shareAccessService
            .Setup(service => service.EvaluateAsync(
                Scope,
                ArchitectureId,
                It.IsAny<Guid?>(),
                It.IsAny<bool>(),
                It.IsAny<bool>(),
                It.IsAny<bool>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureShareAccessEvaluation
            {
                ArchitectureFound = true,
                RestrictToShares = true,
                ShareRole = ArchitectureShareRoles.View,
                CanRead = true,
                CanDecide = false,
                CanAdmin = false,
            });

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.UpsertShare(
            ArchitectureId,
            ShareUserId,
            new UpsertArchitectureShareRequest { Role = ArchitectureShareRoles.View },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task UpsertShare_WithAdmin_Returns204()
    {
        _shareManagementService
            .Setup(service => service.UpsertShareAsync(
                Scope,
                ArchitectureId,
                ShareUserId,
                ArchitectureShareRoles.Decide,
                "jwt:actor",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureShareUpsertResult.Success());

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.UpsertShare(
            ArchitectureId,
            ShareUserId,
            new UpsertArchitectureShareRequest { Role = ArchitectureShareRoles.Decide },
            CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();

        _auditService.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(eventRecord => eventRecord.EventType == AuditEventTypes.ArchitectureShareGranted),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task DeleteShare_WhenMissing_Returns404()
    {
        _shareManagementService
            .Setup(service => service.DeleteShareAsync(
                Scope,
                ArchitectureId,
                ShareUserId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureShareDeleteResult.ShareNotFound());

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.DeleteShare(ArchitectureId, ShareUserId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task DeleteShare_WithAdmin_WritesRequiredRevokedAudit()
    {
        _shareManagementService
            .Setup(service => service.DeleteShareAsync(
                Scope,
                ArchitectureId,
                ShareUserId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureShareDeleteResult.Success());

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.DeleteShare(ArchitectureId, ShareUserId, CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();

        _auditService.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(eventRecord => eventRecord.EventType == AuditEventTypes.ArchitectureShareRevoked),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private ArchitecturesController BuildSut() =>
        new(
            _scopeProvider.Object,
            _actorContext.Object,
            _identityService.Object,
            _bindingService.Object,
            new ArchitectureInventoryBindingAuditSupport(
                _auditService.Object,
                Microsoft.Extensions.Logging.Abstractions.NullLogger<ArchitectureInventoryBindingAuditSupport>.Instance),
            new ArchitectureShareAuditSupport(
                _auditService.Object,
                Microsoft.Extensions.Logging.Abstractions.NullLogger<ArchitectureShareAuditSupport>.Instance),
            _restrictToSharesService.Object,
            _shareManagementService.Object,
            _shareAccessService.Object,
            _shareAccessGate.Object,
            _platformUserResolver.Object,
            _sealDeltaService.Object,
            _auditService.Object,
            _runRepository.Object,
            _goldenManifestRepository.Object,
            _manifestHashService.Object,
            SealedManifestHashTestSupport.CreateRunDetailQueryServiceWithoutCommittedRuns(),
            SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
}
