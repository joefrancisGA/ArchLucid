using System.Net;

using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.Controllers.Architecture;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Support;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>AS-091: restricted architectures return 404 for same-tenant principals without share.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitecturesControllerRestrictedShareIdorTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid RestrictedArchitectureId =
        Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    private const string SecretDisplayName = "SECRET-RESTRICTED-PACKAGE-AS091";

    private readonly Mock<IScopeContextProvider> _scopeProvider = new();
    private readonly Mock<IActorContext> _actorContext = new();
    private readonly Mock<IAuditService> _auditService = new();
    private readonly Mock<IArchitectureIdentityService> _identityService = new();
    private readonly Mock<IArchitectureInventoryBindingService> _bindingService = new();
    private readonly Mock<IArchitectureRestrictToSharesService> _restrictToSharesService = new();
    private readonly Mock<IArchitectureShareAccessService> _shareAccessService = new();
    private readonly Mock<IArchitectureShareAccessGate> _shareAccessGate = new();
    private readonly Mock<IAuthenticatedPlatformUserResolver> _platformUserResolver = new();
    private readonly Mock<IArchitectureSealDeltaService> _sealDeltaService = new();
    private readonly Mock<IRunRepository> _runRepository = new();
    private readonly Mock<IGoldenManifestRepository> _goldenManifestRepository = new();
    private readonly Mock<IManifestHashService> _manifestHashService = new();

    public ArchitecturesControllerRestrictedShareIdorTests()
    {
        _scopeProvider.Setup(static provider => provider.GetCurrentScope()).Returns(Scope);

        _shareAccessGate
            .Setup(gate => gate.EnsureArchitectureReadAllowedAsync(
                It.IsAny<ControllerBase>(),
                It.IsAny<System.Security.Claims.ClaimsPrincipal>(),
                Scope,
                RestrictedArchitectureId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ControllerBase controller, System.Security.Claims.ClaimsPrincipal _, ScopeContext _, Guid _, CancellationToken _) =>
                controller.NotFoundProblem(
                    $"Architecture '{RestrictedArchitectureId:D}' was not found.",
                    ProblemTypes.ResourceNotFound));

        _shareAccessGate
            .Setup(gate => gate.EnsureArchitectureDecideAllowedAsync(
                It.IsAny<ControllerBase>(),
                It.IsAny<System.Security.Claims.ClaimsPrincipal>(),
                Scope,
                RestrictedArchitectureId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ControllerBase controller, System.Security.Claims.ClaimsPrincipal _, ScopeContext _, Guid _, CancellationToken _) =>
                controller.NotFoundProblem(
                    $"Architecture '{RestrictedArchitectureId:D}' was not found.",
                    ProblemTypes.ResourceNotFound));

        _shareAccessGate
            .Setup(gate => gate.EvaluateArchitectureAsync(
                It.IsAny<System.Security.Claims.ClaimsPrincipal>(),
                Scope,
                RestrictedArchitectureId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureShareAccessEvaluation
            {
                ArchitectureFound = true,
                RestrictToShares = true,
                CanRead = false,
                CanDecide = false,
                CanAdmin = false,
            });
    }

    [Fact]
    public async Task GetArchitecture_WhenUnshared_Returns404_Not200()
    {
        _identityService
            .Setup(service => service.GetIdentityAsync(Scope, RestrictedArchitectureId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureIdentityDetail
            {
                ArchitectureId = RestrictedArchitectureId,
                DisplayName = SecretDisplayName,
            });

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.GetArchitecture(RestrictedArchitectureId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be((int)HttpStatusCode.NotFound);
        notFound.Value.Should().NotBeOfType<ArchitectureIdentityDetail>();
    }

    [Fact]
    public async Task ListArchitectures_OmitsRestrictedArchitecture_WhenUnshared()
    {
        _identityService
            .Setup(service => service.ListIdentitiesAsync(Scope, 1, 50, false, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureIdentityListPage
            {
                Items =
                [
                    new ArchitectureIdentityListItem
                    {
                        ArchitectureId = RestrictedArchitectureId,
                        DisplayName = SecretDisplayName,
                    },
                ],
                TotalCount = 1,
                Page = 1,
                PageSize = 50,
            });

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.ListArchitectures(cancellationToken: CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ArchitectureIdentityListPage response = ok.Value.Should().BeOfType<ArchitectureIdentityListPage>().Subject;
        response.Items.Should().BeEmpty();
        response.Items.Should().NotContain(item => item.DisplayName == SecretDisplayName);
    }

    [Fact]
    public async Task GetInventoryBinding_WhenUnshared_Returns404()
    {
        _bindingService
            .Setup(service => service.TryGetBindingAsync(Scope, RestrictedArchitectureId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureInventoryBindingResponse
            {
                ArchitectureId = RestrictedArchitectureId,
                SnapshotId = Guid.NewGuid(),
            });

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.GetInventoryBinding(RestrictedArchitectureId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be((int)HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task AttachInventoryBinding_WhenUnshared_Returns404()
    {
        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.AttachInventoryBinding(
            RestrictedArchitectureId,
            new AttachArchitectureInventoryBindingRequest { SnapshotId = Guid.NewGuid() },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be((int)HttpStatusCode.NotFound);
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
            _restrictToSharesService.Object,
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
