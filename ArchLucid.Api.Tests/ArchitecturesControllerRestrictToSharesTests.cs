using ArchLucid.Api.Controllers.Architecture;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

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

    private readonly Mock<IScopeContextProvider> _scopeProvider = new();
    private readonly Mock<IActorContext> _actorContext = new();
    private readonly Mock<ArchLucid.Core.Audit.IAuditService> _auditService = new();
    private readonly Mock<IArchitectureIdentityService> _identityService = new();
    private readonly Mock<IArchitectureInventoryBindingService> _bindingService = new();
    private readonly Mock<IArchitectureSealDeltaService> _sealDeltaService = new();
    private readonly Mock<IRunRepository> _runRepository = new();
    private readonly Mock<IGoldenManifestRepository> _goldenManifestRepository = new();
    private readonly Mock<IArchitectureShareService> _shareService = new();

    public ArchitecturesControllerRestrictToSharesTests()
    {
        _scopeProvider.Setup(static provider => provider.GetCurrentScope()).Returns(Scope);
        _actorContext.Setup(static context => context.GetActor()).Returns("jwt:actor");
        _actorContext.Setup(static context => context.GetActorId()).Returns("jwt:tenant:actor");
    }

    [Fact]
    public void SetRestrictToShares_RequiresExecuteAuthority()
    {
        AuthorizeAttribute? attribute = typeof(ArchitecturesController)
            .GetMethod(nameof(ArchitecturesController.PatchArchitectureRestrictToShares))
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

        IActionResult result = await sut.PatchArchitectureRestrictToShares(
            ArchitectureId,
            new PatchArchitectureRestrictToSharesRequest
            {
                RestrictToShares = true,
                ConfirmRestrict = false,
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task SetRestrictToShares_EnableWithConfirm_AutoInsertsActorAdminShare()
    {
        ArchitectureShareListResponse response = new()
        {
            ArchitectureId = ArchitectureId,
            RestrictToShares = true,
            Shares =
            [
                new ArchitectureShareResponse
                {
                    ArchitectureId = ArchitectureId,
                    ActorOid = "jwt:tenant:actor",
                    Role = ArchitectureShareRoles.Admin,
                    GrantedBy = "jwt:actor",
                    GrantedUtc = DateTime.UtcNow,
                },
            ],
        };

        _shareService
            .Setup(service => service.PatchRestrictToSharesAsync(
                Scope,
                ArchitectureId,
                It.Is<PatchArchitectureRestrictToSharesRequest>(request =>
                    request.RestrictToShares && request.ConfirmRestrict),
                "jwt:actor",
                "jwt:tenant:actor",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureShareMutationResult.Success(response));

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.PatchArchitectureRestrictToShares(
            ArchitectureId,
            new PatchArchitectureRestrictToSharesRequest
            {
                RestrictToShares = true,
                ConfirmRestrict = true,
            },
            CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ArchitectureShareListResponse payload =
            ok.Value.Should().BeOfType<ArchitectureShareListResponse>().Subject;
        payload.RestrictToShares.Should().BeTrue();
        payload.Shares.Should().ContainSingle(share => share.Role == ArchitectureShareRoles.Admin);
    }

    [Fact]
    public async Task SetRestrictToShares_WithoutAdminShare_Returns403()
    {
        _shareService
            .Setup(service => service.PatchRestrictToSharesAsync(
                Scope,
                ArchitectureId,
                It.IsAny<PatchArchitectureRestrictToSharesRequest>(),
                "jwt:actor",
                "jwt:tenant:actor",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureShareMutationResult.NotAuthorized());

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.PatchArchitectureRestrictToShares(
            ArchitectureId,
            new PatchArchitectureRestrictToSharesRequest
            {
                RestrictToShares = false,
                ConfirmRestrict = false,
            },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    private ArchitecturesController BuildSut() =>
        ArchitecturesControllerTestSupport.BuildController(
            _scopeProvider,
            _actorContext,
            _identityService,
            _bindingService,
            _sealDeltaService,
            _auditService,
            _runRepository,
            _goldenManifestRepository,
            _shareService);
}
