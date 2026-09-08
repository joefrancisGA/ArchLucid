using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Application;
using ArchLucid.Application.Explanation;
using ArchLucid.ArtifactSynthesis.Docx;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.CareerArtifacts;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Services;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Provenance;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class DocxExportControllerCareerHonestyTests
{
    [SkippableFact]
    public async Task ExportRunDocx_returns_career_blocked_problem_when_trail_has_no_asserted_intake()
    {
        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();

        ManifestHashService manifestHashService = new();
        FeasibilityVerdict verdict = DocxExportControllerTestSupport.CreateFeasibilityVerdictWithoutTrail();
        ManifestDocument sealedManifest = DocxExportControllerTestSupport.CreateSealedExportManifest(
            runId,
            manifestId,
            verdict,
            manifestHashService);

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        Mock<IAuthorityQueryService> authority = new();
        DocxExportControllerTestSupport.SetupAuthorityForDocxExport(authority, runId, sealedManifest);

        Mock<IRunDetailQueryService> runDetailQuery = new();
        runDetailQuery
            .Setup(r => r.GetRunDetailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail
            {
                Run = new ArchitectureRun { RunId = runId.ToString("N") },
                AuthorityLifecyclePhase = AuthorityRunLifecyclePhase.Complete,
            });

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["PreCommitGovernance:PreCommitGateEnabled"] = "true",
            })
            .Build();

        DocxExportController sut = new(
            authority.Object,
            runDetailQuery.Object,
            Mock.Of<IArtifactQueryService>(),
            Mock.Of<IDocxExportService>(),
            Mock.Of<IComparisonService>(),
            Mock.Of<IExplanationService>(),
            Mock.Of<IProvenanceSnapshotRepository>(),
            scope.Object,
            manifestHashService,
            Mock.Of<IGraphSnapshotRepository>(),
            DocxExportControllerTestSupport.CreateAgentExecutionTraceRepository(),
            configuration,
            Mock.Of<IAuditService>(),
            NullLogger<DocxExportController>.Instance)
        {
            ControllerContext = AnalysisReportsControllerAuditTests.CreateControllerContext(),
        };

        IActionResult result = await sut.ExportRunDocx(runId, null, false, false, CancellationToken.None);

        ObjectResult blocked = result.Should().BeOfType<ObjectResult>().Subject;
        blocked.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            blocked.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Detail.Should().Contain("asserted intake");
        problem.Extensions["blockReasonCode"].Should().Be(CareerArtifactCompletenessValidator.AssertedEmptyCode);
    }
}
