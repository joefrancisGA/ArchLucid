using ArchLucid.Api.Controllers.Architecture;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

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
    private static readonly string ShareActorOid = "jwt:tenant:viewer";

    private readonly Mock<IScopeContextProvider> _scopeProvider = new();
    private readonly Mock<IActorContext> _actorContext = new();
    private readonly Mock<IAuditService> _auditService = new();
    private readonly Mock<IArchitectureIdentityService> _identityService = new();
    private readonly Mock<IArchitectureInventoryBindingService> _bindingService = new();
    private readonly Mock<IArchitectureSealDeltaService> _sealDeltaService = new();
    private readonly Mock<IRunRepository> _runRepository = new();
    private readonly Mock<IGoldenManifestRepository> _goldenManifestRepository = new();
    private readonly Mock<IArchitectureShareService> _shareService = new();

    public ArchitecturesControllerSharesTests()
    {
        _scopeProvider.Setup(static provider => provider.GetCurrentScope()).Returns(Scope);
        _actorContext.Setup(static context => context.GetActor()).Returns("jwt:actor");
        _actorContext.Setup(static context => context.GetActorId()).Returns("jwt:tenant:actor");
    }

    [Fact]
    public void ListShares_RequiresReadAuthority()
    {
        AuthorizeAttribute? attribute = typeof(ArchitecturesController)
            .GetMethod(nameof(ArchitecturesController.ListArchitectureShares))
            ?.GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
            .Cast<AuthorizeAttribute>()
            .FirstOrDefault();

        attribute.Should().NotBeNull();
        attribute!.Policy.Should().Be(ArchLucidPolicies.ReadAuthority);
    }

    [Fact]
    public async Task ListShares_ReturnsSharePayload()
    {
        _shareService
            .Setup(service => service.TryListSharesAsync(
                Scope,
                ArchitectureId,
                "jwt:tenant:actor",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureShareListResponse
            {
                ArchitectureId = ArchitectureId,
                RestrictToShares = true,
                Shares =
                [
                    new ArchitectureShareResponse
                    {
                        ArchitectureId = ArchitectureId,
                        ActorOid = ShareActorOid,
                        Role = ArchitectureShareRoles.View,
                        GrantedBy = "jwt:actor",
                        GrantedUtc = DateTime.UtcNow,
                    },
                ],
            });

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.ListArchitectureShares(ArchitectureId, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ArchitectureShareListResponse response =
            ok.Value.Should().BeOfType<ArchitectureShareListResponse>().Subject;
        response.RestrictToShares.Should().BeTrue();
        response.Shares.Should().ContainSingle(share => share.ActorOid == ShareActorOid);
    }

    [Fact]
    public async Task UpsertShare_WithoutAdmin_Returns404()
    {
        _shareService
            .Setup(service => service.PutShareAsync(
                Scope,
                ArchitectureId,
                It.IsAny<PutArchitectureShareRequest>(),
                "jwt:actor",
                "jwt:tenant:actor",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureShareMutationResult.NotAuthorized());

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.PutArchitectureShare(
            ArchitectureId,
            new PutArchitectureShareRequest
            {
                ActorOid = ShareActorOid,
                Role = ArchitectureShareRoles.View,
            },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task UpsertShare_WithAdmin_Returns204()
    {
        ArchitectureShareListResponse response = new()
        {
            ArchitectureId = ArchitectureId,
            RestrictToShares = true,
        };

        _shareService
            .Setup(service => service.PutShareAsync(
                Scope,
                ArchitectureId,
                It.IsAny<PutArchitectureShareRequest>(),
                "jwt:actor",
                "jwt:tenant:actor",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureShareMutationResult.Success(response));

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.PutArchitectureShare(
            ArchitectureId,
            new PutArchitectureShareRequest
            {
                ActorOid = ShareActorOid,
                Role = ArchitectureShareRoles.Decide,
            },
            CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task DeleteShare_WhenMissing_Returns404()
    {
        _shareService
            .Setup(service => service.RevokeShareAsync(
                Scope,
                ArchitectureId,
                ShareActorOid,
                "jwt:actor",
                "jwt:tenant:actor",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureShareMutationResult.ArchitectureNotFound());

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.RevokeArchitectureShare(
            ArchitectureId,
            ShareActorOid,
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
