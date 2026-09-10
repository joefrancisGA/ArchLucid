using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.Controllers.Architecture;
using ArchLucid.Api.Support;
using ArchLucid.Api.Tests.Support;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitecturesControllerInventoryBindingTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid ArchitectureId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid SnapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    private readonly Mock<IScopeContextProvider> _scopeProvider = new();
    private readonly Mock<IActorContext> _actorContext = new();
    private readonly Mock<IAuditService> _auditService = new();
    private readonly ArchitectureInventoryBindingAuditSupport _bindingAuditSupport;
    private readonly Mock<IArchitectureIdentityService> _identityService = new();
    private readonly Mock<IArchitectureInventoryBindingService> _bindingService = new();
    private readonly Mock<IArchitectureRestrictToSharesService> _restrictToSharesService = new();
    private readonly Mock<IArchitectureShareAccessService> _shareAccessService = new();
    private readonly Mock<IArchitectureShareAccessGate> _shareAccessGate = ArchitectureShareAccessGateTestDefaults.CreatePermissiveGate();
    private readonly Mock<IAuthenticatedPlatformUserResolver> _platformUserResolver = new();
    private readonly Mock<IArchitectureSealDeltaService> _sealDeltaService = new();
    private readonly Mock<IRunRepository> _runRepository = new();
    private readonly Mock<IGoldenManifestRepository> _goldenManifestRepository = new();

    public ArchitecturesControllerInventoryBindingTests()
    {
        _scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(Scope);
        _actorContext.Setup(static a => a.GetActor()).Returns("actor@example.com");
        _bindingAuditSupport = new ArchitectureInventoryBindingAuditSupport(
            _auditService.Object,
            NullLogger<ArchitectureInventoryBindingAuditSupport>.Instance);
    }

    [Fact]
    public async Task GetInventoryBinding_ArchitectureNotFound_Returns404()
    {
        _bindingService
            .Setup(s => s.TryGetBindingAsync(Scope, ArchitectureId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureInventoryBindingResponse?)null);

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.GetInventoryBinding(ArchitectureId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetInventoryBinding_Unbound_Returns200WithIsBoundFalse()
    {
        ArchitectureInventoryBindingResponse response = new()
        {
            ArchitectureId = ArchitectureId,
            IsBound = false,
        };

        _bindingService
            .Setup(s => s.TryGetBindingAsync(Scope, ArchitectureId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(response);

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.GetInventoryBinding(ArchitectureId, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(response);
    }

    [Fact]
    public async Task AttachInventoryBinding_SnapshotNotFound_Returns404()
    {
        _bindingService
            .Setup(s => s.AttachAsync(
                Scope,
                ArchitectureId,
                SnapshotId,
                "actor@example.com",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureInventoryBindingAttachResult.SnapshotNotFound());

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.AttachInventoryBinding(
            ArchitectureId,
            new AttachArchitectureInventoryBindingRequest { SnapshotId = SnapshotId },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task AttachInventoryBinding_Success_Returns200AndAudits()
    {
        ArchitectureInventoryBindingResponse response = new()
        {
            ArchitectureId = ArchitectureId,
            IsBound = true,
            SnapshotId = SnapshotId,
            BoundBy = "actor@example.com",
            BoundUtc = DateTime.UtcNow,
        };

        _bindingService
            .Setup(s => s.AttachAsync(
                Scope,
                ArchitectureId,
                SnapshotId,
                "actor@example.com",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureInventoryBindingAttachResult.Success(response));

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.AttachInventoryBinding(
            ArchitectureId,
            new AttachArchitectureInventoryBindingRequest { SnapshotId = SnapshotId },
            CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(response);

        _auditService.Verify(
            s => s.LogAsync(It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.ArchitectureInventorySnapshotBound), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task DetachInventoryBinding_Success_AuditsDetach()
    {
        ArchitectureInventoryBindingResponse bound = new()
        {
            ArchitectureId = ArchitectureId,
            IsBound = true,
            SnapshotId = SnapshotId,
        };

        _bindingService
            .Setup(s => s.TryGetBindingAsync(Scope, ArchitectureId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(bound);
        _bindingService
            .Setup(s => s.TryDetachAsync(Scope, ArchitectureId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.DetachInventoryBinding(ArchitectureId, CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();

        _auditService.Verify(
            s => s.LogAsync(It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.ArchitectureInventorySnapshotDetached), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task AttachInventoryBinding_AuditFailure_PropagatesWithoutSilentBind()
    {
        ArchitectureInventoryBindingResponse response = new()
        {
            ArchitectureId = ArchitectureId,
            IsBound = true,
            SnapshotId = SnapshotId,
        };

        _bindingService
            .Setup(s => s.AttachAsync(
                Scope,
                ArchitectureId,
                SnapshotId,
                "actor@example.com",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureInventoryBindingAttachResult.Success(response));

        _auditService
            .Setup(s => s.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("audit store unavailable"));

        ArchitecturesController sut = BuildSut();

        Func<Task> act = () => sut.AttachInventoryBinding(
            ArchitectureId,
            new AttachArchitectureInventoryBindingRequest { SnapshotId = SnapshotId },
            CancellationToken.None);

        await act.Should().ThrowAsync<DurableAuditWriteFailedException>();
    }

    [Fact]
    public async Task DetachInventoryBinding_ArchitectureNotFound_Returns404()
    {
        _bindingService
            .Setup(s => s.TryGetBindingAsync(Scope, ArchitectureId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureInventoryBindingResponse?)null);

        ArchitecturesController sut = BuildSut();

        IActionResult result = await sut.DetachInventoryBinding(ArchitectureId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public void AttachInventoryBinding_RequiresExecuteAuthority()
    {
        AuthorizeAttribute? attribute = typeof(ArchitecturesController)
            .GetMethod(nameof(ArchitecturesController.AttachInventoryBinding))
            ?.GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
            .Cast<AuthorizeAttribute>()
            .FirstOrDefault();

        attribute.Should().NotBeNull();
        attribute!.Policy.Should().Be(ArchLucid.Core.Authorization.ArchLucidPolicies.ExecuteAuthority);
    }

    [Fact]
    public void DetachInventoryBinding_RequiresExecuteAuthority()
    {
        AuthorizeAttribute? attribute = typeof(ArchitecturesController)
            .GetMethod(nameof(ArchitecturesController.DetachInventoryBinding))
            ?.GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
            .Cast<AuthorizeAttribute>()
            .FirstOrDefault();

        attribute.Should().NotBeNull();
        attribute!.Policy.Should().Be(ArchLucid.Core.Authorization.ArchLucidPolicies.ExecuteAuthority);
    }

    private ArchitecturesController BuildSut() =>
        new(
            _scopeProvider.Object,
            _actorContext.Object,
            _identityService.Object,
            _bindingService.Object,
            _bindingAuditSupport,
            _restrictToSharesService.Object,
            _shareAccessService.Object,
            _shareAccessGate.Object,
            _platformUserResolver.Object,
            _sealDeltaService.Object,
            _auditService.Object,
            _runRepository.Object,
            _goldenManifestRepository.Object,
            SealedManifestHashTestSupport.CreateManifestHashService(),
            SealedManifestHashTestSupport.CreateRunDetailQueryServiceWithoutCommittedRuns(),
            SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
}
