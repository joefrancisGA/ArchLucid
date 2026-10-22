using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Runs;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AnalysisReportsControllerRunIdParityTests
{
    [Fact]
    public async Task AnalyzeRun_returns_not_found_for_whitespace_run_id_like_GetRun()
    {
        Mock<IRunRepository> runs = new();
        RunDetailQueryService runDetailQueryService = CreateRunDetailQueryService(runs);

        AnalysisReportsController controller = new(
            runDetailQueryService,
            Mock.Of<IArchitectureAnalysisService>(),
            Mock.Of<IArchitectureAnalysisExportService>(),
            Mock.Of<IArchitectureAnalysisDocxExportService>(),
            Mock.Of<IArchitectureAnalysisConsultingDocxExportService>(),
            Mock.Of<IConsultingDocxTemplateRecommendationService>(),
            Mock.Of<IConsultingDocxExportProfileSelector>(),
            Mock.Of<IRunExportAuditService>(),
            Mock.Of<IRunExportRecordRepository>(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            Mock.Of<IScopeContextProvider>(),
            Mock.Of<IBackgroundJobQueue>(),
            Mock.Of<IAuditService>(),
            NullLogger<AnalysisReportsController>.Instance)
        {
            ControllerContext = AnalysisReportsControllerAuditTests.CreateControllerContext()
        };

        IActionResult action = await controller.AnalyzeRun(
            "   ",
            request: null,
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        runs.Verify(
            r => r.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static RunDetailQueryService CreateRunDetailQueryService(Mock<IRunRepository> runs)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(new ScopeContext());

        return new RunDetailQueryService(
            runs.Object,
            scopeProvider.Object,
            Mock.Of<IAgentTaskRepository>(),
            Mock.Of<IAgentResultRepository>(),
            Mock.Of<IUnifiedGoldenManifestReader>(),
            Mock.Of<IDecisionTraceRepository>(),
            Mock.Of<IFindingRecordMuteRepository>(),
            Mock.Of<IAgentExecutionTraceRepository>(),
            Mock.Of<ILlmCostEstimator>(),
            new FindingTrustLabelMapper(),
            Mock.Of<IRunStageOutcomesRepository>(),
            new RunStateTransitionService(),
            NullLogger<RunDetailQueryService>.Instance);
    }
}
