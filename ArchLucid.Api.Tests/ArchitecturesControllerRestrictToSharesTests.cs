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

/// <summary>AS-089: opt-in restrict-to-shares cannot lock everyone out.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitecturesControllerRestrictToSharesTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid ArchitectureId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid ActorUserId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    private readonly Mock<IScopeContextProvider> _scopeProvider = new();
    private readonly Mock<IActorContext> _actorContext = new();
    private readonly Mock<IAuditService> _auditService = new();
    private readonly Mock<IArchitectureIdentityService> _identityService = new();
    private readonly Mock<IArchitectureInventoryBindingService> _bindingService = new();
    private readonly Mock<IArchitectureRestrictToSharesService> _restrictToSharesService = new();
    private readonly Mock<IArchitectureShareAccessService> _shareAccessService = new();
    private readonly Mock<IArchitectureShareAccessGate> _shareAccessGate = ArchitectureShareAccessGateTestDefaults.CreatePermissiveGate();
    private readonly Mock<IAuthenticatedPlatformUserResolver> _platformUserResolver = new();
    private readonly Mock<IArchitectureSealDeltaService> _sealDeltaService = new();
    private readonly Mock<IRunRepository> _runRepository = new();
    private readonly Mock<IGoldenManifestRepository> _goldenManifestRepository = new();
    private readonly Mock<IManifestHashService> _manifestHashService = new();

    public ArchitecturesControllerRestrictToSharesTests()
    {
        _scopeProvider.Setup(static provider => provider.GetCurrentScope()).Returns(Scope);
        _actorContext.Setup(static context => context.GetActorId()).Returns("jwt:actor");
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
    public void SetRestrictToShares_RequiresExecuteAuthority()
    {
        AuthorizeAttribute? attribute = typeof(ArchitecturesController)
            .GetMethod(nameof(ArchitecturesController.SetRestrictToShares))
            ?.GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
            .Cast<AuthorizeAttribute>()
            .FirstOrDefault();

        attribute.Should().NotBeNull();
        attribute!.Policy.Should().Be(ArchLucidPolicies.ExecuteAuthority);
    }

    [Fact]
    public async Task SetRestrictToShares_WithoutConfirm_Returns400()
    {
        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.SetRestrictToShares(
            ArchitectureId,
            new SetArchitectureRestrictToSharesRequest
            {
                RestrictToShares = true,
                ConfirmOptIn = false,
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task SetRestrictToShares_EnableWithConfirm_AutoInsertsActorAdminShare()
    {
        _platformUserResolver
            .Setup(resolver => resolver.ResolveAsync(It.IsAny<System.Security.Claims.ClaimsPrincipal>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PlatformUserRecord { Id = ActorUserId, PrimaryEmail = "owner@example.com" });

        _restrictToSharesService
            .Setup(service => service.SetAsync(
                Scope,
                ArchitectureId,
                true,
                true,
                ActorUserId,
                "jwt:actor",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureRestrictToSharesSetResult.Success(
                new ArchitectureRestrictToSharesResponse
                {
                    ArchitectureId = ArchitectureId,
                    RestrictToShares = true,
                    ActorAdminShareInserted = true,
                }));

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.SetRestrictToShares(
            ArchitectureId,
            new SetArchitectureRestrictToSharesRequest
            {
                RestrictToShares = true,
                ConfirmOptIn = true,
            },
            CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ArchitectureRestrictToSharesResponse response =
            ok.Value.Should().BeOfType<ArchitectureRestrictToSharesResponse>().Subject;
        response.RestrictToShares.Should().BeTrue();
        response.ActorAdminShareInserted.Should().BeTrue();

        _auditService.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(eventRecord =>
                    eventRecord.EventType == AuditEventTypes.ArchitectureRestrictToSharesEnabled),
                It.IsAny<CancellationToken>()),
            Times.Once);
        _auditService.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(eventRecord =>
                    eventRecord.EventType == AuditEventTypes.ArchitectureShareGranted),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task SetRestrictToShares_WithoutAdminShare_Returns403()
    {
        _shareAccessService
            .Setup(service => service.EvaluateAsync(
                Scope,
                ArchitectureId,
                ActorUserId,
                It.IsAny<bool>(),
                It.IsAny<bool>(),
                It.IsAny<bool>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureShareAccessEvaluation
            {
                ArchitectureFound = true,
                RestrictToShares = true,
                ShareRole = Core.Persistence.ApplicationPorts.Architecture.ArchitectureShareRoles.Decide,
                CanRead = true,
                CanDecide = true,
                CanAdmin = false,
            });

        _platformUserResolver
            .Setup(resolver => resolver.ResolveAsync(It.IsAny<System.Security.Claims.ClaimsPrincipal>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PlatformUserRecord { Id = ActorUserId, PrimaryEmail = "decider@example.com" });

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.SetRestrictToShares(
            ArchitectureId,
            new SetArchitectureRestrictToSharesRequest
            {
                RestrictToShares = false,
                ConfirmOptIn = false,
            },
            CancellationToken.None);

        ObjectResult forbidden = result.Should().BeOfType<ObjectResult>().Subject;
        forbidden.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
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
            ArchitectureShareManagementServiceTestDefaults.CreatePermissiveService().Object,
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
