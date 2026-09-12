using ArchLucid.Api.Controllers.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Application.Drafts;
using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Ask;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DraftRequestsControllerWorkLeaseTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid DraftId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    private readonly Mock<IScopeContextProvider> _scopeProvider = new();
    private readonly Mock<IActorContext> _actorContext = new();
    private readonly Mock<IDraftRequestService> _draftService = new();
    private readonly Mock<IDraftIntakeReasoningService> _reasoning = new();
    private readonly Mock<IDecisionReceiptService> _decisionReceipt = new();
    private readonly Mock<IAuditService> _audit = new();
    private readonly Mock<IArchitectureWorkLeaseService> _workLease = new();

    public DraftRequestsControllerWorkLeaseTests()
    {
        _scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(Scope);
        _actorContext.Setup(static a => a.GetActor()).Returns("op-display");
        _actorContext.Setup(static a => a.GetActorId()).Returns("platform-user:11111111-1111-1111-1111-111111111111");
    }

    [Fact]
    public async Task StealDraftWorkLease_Success_AuditsStolenEvent()
    {
        ArchitectureWorkLeaseResponse response = new()
        {
            DraftId = DraftId,
            ArchitectureId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            HolderUserId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            HeldByCaller = true,
        };

        _workLease
            .Setup(s => s.StealAsync(Scope, DraftId, It.IsAny<string>(), true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureWorkLeaseStealResult
            {
                Status = ArchitectureWorkLeaseStealStatus.Stolen,
                Response = response,
                PreviousHolderUserId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            });

        DraftRequestsController sut = BuildSut();

        IActionResult result = await sut.StealDraftWorkLease(DraftId, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(response);

        _audit.Verify(
            s => s.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.ArchitectureWorkLeaseStolen),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task AcquireDraftWorkLease_NotAuthorized_Returns404()
    {
        _workLease
            .Setup(s => s.AcquireAsync(Scope, DraftId, It.IsAny<string>(), true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureWorkLeaseAcquireResult { Status = ArchitectureWorkLeaseAcquireStatus.NotAuthorized });

        DraftRequestsController sut = BuildSut();

        IActionResult result = await sut.AcquireDraftWorkLease(DraftId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    private DraftRequestsController BuildSut() =>
        new(
            _scopeProvider.Object,
            _actorContext.Object,
            _draftService.Object,
            _reasoning.Object,
            _decisionReceipt.Object,
            _audit.Object,
            _workLease.Object,
            SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun(),
            SealedManifestHashTestSupport.CreateManifestHashService(),
            SealedManifestHashTestSupport.CreateRunDetailQueryServiceWithoutCommittedRuns(),
            Mock.Of<IPriorPackageSemanticMergeService>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
}
