using System.Security.Claims;

using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Controllers.Pilots;
using ArchLucid.Api.Controllers.Roi;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Common;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.Governance.Stickiness;
using ArchLucid.Application.Pilots;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using MvcProblemDetails = Microsoft.AspNetCore.Mvc.ProblemDetails;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Wave-73 suggestions 861–866: pilot pack, ROI board-pack, analysis report, and risk-exception mutations map
///     runtime <see cref="ConflictException" /> to OpenAPI **409**.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class Wave73SealedManifestRuntimeConflictTests
{
    private const string SealedConflictMessage =
        "Wave-73 sealed-manifest hash drift blocks this architecture review mutation.";

    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid RunId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private static readonly ConflictException SealedConflict = new(SealedConflictMessage);

    private static void AssertSealedManifestConflict409(IActionResult action)
    {
        ObjectResult conflict = action.Should().BeOfType<ObjectResult>().Subject;
        conflict.StatusCode.Should().Be(StatusCodes.Status409Conflict);

        MvcProblemDetails problem = conflict.Value.Should().BeOfType<MvcProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.Conflict);
        problem.Detail.Should().Be(SealedConflictMessage);
    }

    [Fact]
    public async Task GetSponsorProofPackZip_maps_service_ConflictException_to_409()
    {
        Mock<IPilotsApplicationService> pilots = new(MockBehavior.Strict);
        pilots
            .Setup(service => service.TryBuildSponsorProofPackZipAsync(
                RunId.ToString("D"),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);

        PilotsController sut = BuildPilotsController(pilots);

        IActionResult action = await sut.GetSponsorProofPackZip(RunId.ToString("D"), CancellationToken.None);

        AssertSealedManifestConflict409(action);
    }

    [Fact]
    public async Task GetExecutiveReviewPacket_maps_service_ConflictException_to_409()
    {
        Mock<IPilotsApplicationService> pilots = new(MockBehavior.Strict);
        pilots
            .Setup(service => service.TryBuildExecutiveReviewPacketMarkdownAsync(
                RunId.ToString("D"),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);

        PilotsController sut = BuildPilotsController(pilots);

        IActionResult action = await sut.GetExecutiveReviewPacket(RunId.ToString("D"), CancellationToken.None);

        AssertSealedManifestConflict409(action);
    }

    [Fact]
    public async Task GetFirstValueReport_maps_service_ConflictException_to_409()
    {
        Mock<IPilotsApplicationService> pilots = new(MockBehavior.Strict);
        pilots
            .Setup(service => service.TryBuildFirstValueReportMarkdownAsync(
                RunId.ToString("D"),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);

        PilotsController sut = BuildPilotsController(pilots);

        IActionResult action = await sut.GetFirstValueReport(RunId.ToString("D"), CancellationToken.None);

        AssertSealedManifestConflict409(action);
    }

    [Fact]
    public async Task GetSponsorReportBoardPackAsync_maps_exporter_ConflictException_to_409()
    {
        Mock<ISponsorRoiBoardPackExporter> boardPackExporter = new(MockBehavior.Strict);
        boardPackExporter
            .Setup(exporter => exporter.ExportAsync(
                SponsorRoiBoardPackFormat.Markdown,
                It.IsAny<string?>(),
                false,
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);

        RoiController sut = BuildRoiController(boardPackExporter);

        IActionResult action = await sut.GetSponsorReportBoardPackAsync(
            format: "md",
            generateNarrative: false,
            CancellationToken.None);

        AssertSealedManifestConflict409(action);
    }

    [Fact]
    public async Task AnalyzeRun_maps_service_ConflictException_to_409()
    {
        Mock<IRunDetailQueryService> runDetails = new(MockBehavior.Strict);
        runDetails
            .Setup(service => service.GetRunDetailAsync(RunId.ToString("D"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail
            {
                Run = new ArchitectureRun { RunId = RunId.ToString("D") },
            });

        Mock<IArchitectureAnalysisService> analysis = new(MockBehavior.Strict);
        analysis
            .Setup(service => service.BuildAsync(It.IsAny<ArchitectureAnalysisRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);

        AnalysisReportsController sut = BuildAnalysisReportsController(runDetails.Object, analysis.Object);

        IActionResult action = await sut.AnalyzeRun(RunId.ToString("D"), request: null, CancellationToken.None);

        AssertSealedManifestConflict409(action);
    }

    [Fact]
    public async Task CreateRiskException_maps_service_ConflictException_to_409()
    {
        const string findingId = "finding-risk-exception-1";

        Mock<IFindingInspectReadRepository> findingInspect = new(MockBehavior.Strict);
        findingInspect
            .Setup(repository => repository.GetInspectAsync(
                Scope,
                findingId,
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingInspectReadOptions?>()))
            .ReturnsAsync(new FindingInspectResponse
            {
                FindingId = findingId,
                RunId = RunId,
            });

        Mock<IRiskExceptionService> riskExceptions = new(MockBehavior.Strict);
        riskExceptions
            .Setup(service => service.CreateAsync(
                It.IsAny<CreateRiskExceptionRequest>(),
                Scope,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);

        GovernanceStickinessController sut = BuildGovernanceStickinessController(
            findingInspect.Object,
            riskExceptions.Object);

        IActionResult action = await sut.CreateRiskException(
            new CreateRiskExceptionRequest
            {
                FindingId = findingId,
                RunId = RunId,
                OwnerUserId = "owner@test",
                Rationale = "Risk exception for wave-73 sealed-manifest runtime conflict proof.",
                EvidenceRef = "artifact://evidence/1",
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
            },
            CancellationToken.None);

        AssertSealedManifestConflict409(action);
    }

    private static PilotsController BuildPilotsController(Mock<IPilotsApplicationService> pilots)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static provider => provider.GetCurrentScope()).Returns(Scope);

        return new PilotsController(
            pilots.Object,
            scopeProvider.Object,
            SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun(),
            SealedManifestHashTestSupport.CreateRunDetailQueryServiceWithoutCommittedRuns(),
            SealedManifestHashTestSupport.CreateManifestHashService())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }

    private static RoiController BuildRoiController(Mock<ISponsorRoiBoardPackExporter> boardPackExporter)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static provider => provider.GetCurrentScope()).Returns(Scope);

        DefaultHttpContext httpContext = new();
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim(ClaimTypes.Name, "operator@test")],
            authenticationType: "test"));

        return new RoiController(
            RoiControllerTestSupport.CreateEmptySummaryService(),
            boardPackExporter.Object,
            Mock.Of<IAuditService>(),
            scopeProvider.Object,
            Mock.Of<IComplianceDriftTrendService>(),
            SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun(),
            SealedManifestHashTestSupport.CreateManifestHashService(),
            Mock.Of<ITenantRepository>(),
            Mock.Of<IScimUserRepository>(),
            RoiControllerTestSupport.CreateRunCollector(Scope))
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext },
        };
    }

    private static AnalysisReportsController BuildAnalysisReportsController(
        IRunDetailQueryService runDetailQueryService,
        IArchitectureAnalysisService architectureAnalysisService)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static provider => provider.GetCurrentScope()).Returns(Scope);

        return new AnalysisReportsController(
            runDetailQueryService,
            architectureAnalysisService,
            Mock.Of<IArchitectureAnalysisExportService>(),
            Mock.Of<IArchitectureAnalysisDocxExportService>(),
            Mock.Of<IArchitectureAnalysisConsultingDocxExportService>(),
            Mock.Of<IConsultingDocxTemplateRecommendationService>(),
            Mock.Of<IConsultingDocxExportProfileSelector>(),
            Mock.Of<IRunExportAuditService>(),
            Mock.Of<IRunExportRecordRepository>(),
            SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun(),
            SealedManifestHashTestSupport.CreateManifestHashService(),
            scopeProvider.Object,
            Mock.Of<IBackgroundJobQueue>(),
            Mock.Of<IAuditService>(),
            NullLogger<AnalysisReportsController>.Instance)
        {
            ControllerContext = AnalysisReportsControllerAuditTests.CreateControllerContext(),
        };
    }

    private static GovernanceStickinessController BuildGovernanceStickinessController(
        IFindingInspectReadRepository findingInspect,
        IRiskExceptionService riskExceptionService)
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
            Mock.Of<IFindingDispositionService>(),
            riskExceptionService,
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
            riskExceptionService,
            findingInspect,
            Mock.Of<IArchitectureReviewRecurrenceScheduleRepository>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
