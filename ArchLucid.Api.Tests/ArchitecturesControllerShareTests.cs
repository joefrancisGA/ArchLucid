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

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitecturesControllerShareTests
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
    private readonly Mock<IAuditService> _auditService = new();
    private readonly Mock<IArchitectureIdentityService> _identityService = new();
    private readonly Mock<IArchitectureInventoryBindingService> _bindingService = new();
    private readonly Mock<IArchitectureSealDeltaService> _sealDeltaService = new();
    private readonly Mock<IRunRepository> _runRepository = new();
    private readonly Mock<IGoldenManifestRepository> _goldenManifestRepository = new();
    private readonly Mock<IArchitectureShareService> _shareService = new();

    public ArchitecturesControllerShareTests()
    {
        _scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(Scope);
        _actorContext.Setup(static a => a.GetActor()).Returns("actor@example.com");
        _actorContext.Setup(static a => a.GetActorId()).Returns("jwt:tenant:actor");
    }

    [Fact]
    public async Task ListArchitectureShares_NotAuthorized_Returns404()
    {
        _shareService
            .Setup(s => s.TryListSharesAsync(Scope, ArchitectureId, "jwt:tenant:actor", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureShareListResponse?)null);

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.ListArchitectureShares(ArchitectureId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task PutArchitectureShare_Success_Returns200AndAudits()
    {
        ArchitectureShareListResponse response = new()
        {
            ArchitectureId = ArchitectureId,
            RestrictToShares = true,
        };

        _shareService
            .Setup(s => s.PutShareAsync(
                Scope,
                ArchitectureId,
                It.IsAny<PutArchitectureShareRequest>(),
                "actor@example.com",
                "jwt:tenant:actor",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureShareMutationResult.Success(response));

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.PutArchitectureShare(
            ArchitectureId,
            new PutArchitectureShareRequest
            {
                ActorOid = "jwt:tenant:viewer",
                Role = ArchitectureShareRoles.View,
            },
            CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(response);

        _auditService.Verify(
            s => s.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.ArchitectureShareGranted),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task PatchArchitectureRestrictToShares_ValidationFailed_Returns400()
    {
        _shareService
            .Setup(s => s.PatchRestrictToSharesAsync(
                Scope,
                ArchitectureId,
                It.IsAny<PatchArchitectureRestrictToSharesRequest>(),
                "actor@example.com",
                "jwt:tenant:actor",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureShareMutationResult.ValidationFailed("Confirm restrict-to-shares before hiding this architecture from unshared workspace members."));

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
    public void PutArchitectureShare_RequiresExecuteAuthority()
    {
        AuthorizeAttribute? attribute = typeof(ArchitecturesController)
            .GetMethod(nameof(ArchitecturesController.PutArchitectureShare))
            ?.GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
            .Cast<AuthorizeAttribute>()
            .FirstOrDefault();

        attribute.Should().NotBeNull();
        attribute!.Policy.Should().Be(ArchLucidPolicies.ExecuteAuthority);
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
