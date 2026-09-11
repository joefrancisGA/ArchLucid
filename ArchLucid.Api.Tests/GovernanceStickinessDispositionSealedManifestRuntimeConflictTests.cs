using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.Governance.Stickiness;
using ArchLucid.Application.Roi;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

using MvcProblemDetails = Microsoft.AspNetCore.Mvc.ProblemDetails;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Wave-73 suggestion 867: finding disposition POST maps sealed-manifest <see cref="ConflictException" />
///     to OpenAPI **409** (not unhandled 500).
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GovernanceStickinessDispositionSealedManifestRuntimeConflictTests
{
    private const string SealedConflictMessage =
        "Governance disposition blocked because the committed golden manifest hash drifted.";

    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid RunId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private static readonly ConflictException SealedConflict = new(SealedConflictMessage);

    [Fact]
    public async Task RecordDisposition_maps_sealed_manifest_ConflictException_to_409()
    {
        Mock<IFindingInspectReadRepository> findingInspect = new(MockBehavior.Strict);
        findingInspect
            .Setup(repository => repository.GetInspectAsync(
                Scope,
                "finding-1",
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse
            {
                FindingId = "finding-1",
                RunId = RunId,
            });

        Mock<IFindingDispositionService> dispositionService = new(MockBehavior.Strict);
        dispositionService
            .Setup(service => service.RecordAsync(
                It.IsAny<RecordFindingDispositionRequest>(),
                Scope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);

        GovernanceStickinessController sut = BuildController(
            findingInspect.Object,
            dispositionService.Object);

        sut.ControllerContext.HttpContext.Request.Headers["Idempotency-Key"] = "disposition-idem-1";

        IActionResult action = await sut.RecordDisposition(
            "finding-1",
            new RecordFindingDispositionRequest
            {
                FindingId = "finding-1",
                RunId = RunId,
                Disposition = FindingDisposition.Accepted,
                Rationale = "Accepted for sealed-manifest runtime conflict proof.",
                TradeOffAcknowledgment = "Trade-offs acknowledged for sealed-manifest runtime conflict proof.",
            },
            CancellationToken.None);

        ObjectResult conflict = action.Should().BeOfType<ObjectResult>().Subject;
        conflict.StatusCode.Should().Be(StatusCodes.Status409Conflict);

        MvcProblemDetails problem = conflict.Value.Should().BeOfType<MvcProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.Conflict);
        problem.Detail.Should().Be(SealedConflictMessage);
    }

    private static GovernanceStickinessController BuildController(
        IFindingInspectReadRepository findingInspect,
        IFindingDispositionService dispositionService)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actor = new();
        actor.Setup(context => context.GetActorId()).Returns("reviewer@test");

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });
        tenants
            .Setup(repository => repository.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = Scope.WorkspaceId,
                    Name = "primary",
                },
            ]);

        IAuthorityQueryService authority = SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun();
        IManifestHashService manifestHash = SealedManifestHashTestSupport.CreateManifestHashService();
        IRunDetailQueryService runDetails =
            SealedManifestHashTestSupport.CreateRunDetailQueryServiceWithoutCommittedRuns();

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(repository => repository.GetByIdAsync(Scope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = RunId });

        GovernanceStickinessFacade facade = new(
            scopeProvider.Object,
            actor.Object,
            dispositionService,
            Mock.Of<IRiskExceptionService>(),
            Mock.Of<IArchitectureRiskRegisterService>(),
            Mock.Of<IArchitectureDecisionRegisterService>(),
            Mock.Of<IArchitectureReviewRecurrenceScheduleRepository>(),
            Mock.Of<IArchitectureReviewRecurrenceNextRunCalculator>(),
            runRepository.Object,
            Mock.Of<IFindingMergeConflictResolutionService>(),
            Mock.Of<IGovernanceDigestDecisionNeededComposer>(),
            Mock.Of<IReviewsAwaitingActionQueryService>(),
            Mock.Of<IRealizedValueAttestationService>(),
            Mock.Of<IAuditService>(),
            findingInspect,
            authority,
            manifestHash,
            runDetails);

        return new GovernanceStickinessController(
            facade,
            scopeProvider.Object,
            tenants.Object,
            Mock.Of<IArchitectureReviewRecurrenceNextRunCalculator>(),
            authority,
            manifestHash,
            runDetails,
            Mock.Of<IRiskExceptionService>(),
            findingInspect,
            Mock.Of<IArchitectureReviewRecurrenceScheduleRepository>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
