using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class FinalizeReadinessControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task GetReadiness_returns_unified_readiness_from_service()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string runIdText = runId.ToString("D");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(repository => repository.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        FinalizeReadinessResult expected = new()
        {
            RunId = runIdText,
            ReadyToFinalize = false,
            BlockedReasonSummary = "1 open verify-hypothesis finding still need a recorded hypothesis outcome before finalize.",
            Blocks =
            [
                new FinalizeReadinessBlock
                {
                    Code = "scorecard",
                    Layer = FinalizeReadinessLayers.Scorecard,
                    Message =
                        "1 open verify-hypothesis finding still need a recorded hypothesis outcome before finalize.",
                },
            ],
            Checklist = new PreFinalizeChecklistResult
            {
                RunId = runIdText,
                ReadyToFinalize = true,
                Items = [],
                AdvisoryCount = 0,
                BlockingCount = 0,
                PreCommitGateEnabled = true,
            },
            Scorecard = new FinalizeQualityScorecardCountsDto { OpenVerifyHypothesisCount = 1 },
            ScorecardBlockingReasons =
            [
                "1 open verify-hypothesis finding still need a recorded hypothesis outcome before finalize.",
            ],
            FinalizeQualityGateEnabled = true,
        };

        Mock<IFinalizeReadinessService> readiness = new();
        readiness
            .Setup(service => service.BuildAsync(runIdText, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        GovernancePreCommitSimulationController sut = CreateController(
            runRepository: runs.Object,
            finalizeReadinessService: readiness.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult action = await sut.GetReadinessAsync(runIdText, null, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(expected);
    }

    [Fact]
    public async Task GetReadiness_returns_bad_request_for_malformed_run_id()
    {
        GovernancePreCommitSimulationController sut = CreateController(
            runRepository: Mock.Of<IRunRepository>(),
            finalizeReadinessService: Mock.Of<IFinalizeReadinessService>());
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult action = await sut.GetReadinessAsync("not-a-guid", null, CancellationToken.None);

        action.Should().BeOfType<ObjectResult>().Subject.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task GetReadiness_unions_acknowledged_assumption_ids_into_service_call()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string runIdText = runId.ToString("D");
        string[] acknowledgedIds = ["assumption-a", "assumption-b"];

        Mock<IRunRepository> runs = new();
        runs
            .Setup(repository => repository.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        Mock<IFinalizeReadinessService> readiness = new();
        readiness
            .Setup(service => service.BuildAsync(
                runIdText,
                It.Is<IReadOnlyList<string>?>(ids =>
                    ids != null
                    && ids.Count == 2
                    && ids.Contains("assumption-a")
                    && ids.Contains("assumption-b")),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FinalizeReadinessResult
            {
                RunId = runIdText,
                ReadyToFinalize = true,
                Blocks = [],
                Checklist = new PreFinalizeChecklistResult
                {
                    RunId = runIdText,
                    ReadyToFinalize = true,
                    Items = [],
                },
                Scorecard = new FinalizeQualityScorecardCountsDto(),
                ScorecardBlockingReasons = [],
                FinalizeQualityGateEnabled = true,
            });

        GovernancePreCommitSimulationController sut = CreateController(
            runRepository: runs.Object,
            finalizeReadinessService: readiness.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult action = await sut.GetReadinessAsync(runIdText, acknowledgedIds, CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
        readiness.Verify(
            service => service.BuildAsync(runIdText, acknowledgedIds, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task GetReadiness_returns_not_found_when_run_missing()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string runIdText = runId.ToString("D");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(repository => repository.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        GovernancePreCommitSimulationController sut = CreateController(
            runRepository: runs.Object,
            finalizeReadinessService: Mock.Of<IFinalizeReadinessService>());
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult action = await sut.GetReadinessAsync(runIdText, null, CancellationToken.None);

        action.Should().BeOfType<ObjectResult>().Subject.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    private static GovernancePreCommitSimulationController CreateController(
        IRunRepository runRepository,
        IFinalizeReadinessService finalizeReadinessService)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

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

        return new GovernancePreCommitSimulationController(
            Mock.Of<IPreCommitGovernanceGate>(),
            Mock.Of<IPreFinalizeChecklistService>(),
            finalizeReadinessService,
            Mock.Of<ArchLucid.Core.Audit.IAuditService>(),
            runRepository,
            scopeProvider.Object,
            tenants.Object,
            SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun(),
            SealedManifestHashTestSupport.CreateManifestHashService());
    }
}
