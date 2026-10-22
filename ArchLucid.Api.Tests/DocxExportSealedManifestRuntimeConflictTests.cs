using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Explanation;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Services;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Provenance;
using ArchLucid.Persistence.Queries;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using MvcProblemDetails = Microsoft.AspNetCore.Mvc.ProblemDetails;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Runtime proof that DOCX export paths map sealed-manifest <see cref="ConflictException" /> to OpenAPI **409**.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DocxExportSealedManifestRuntimeConflictTests
{
    private const string SealedConflictMessage =
        "Wave DOCX export sealed-manifest hash drift blocks this architecture review mutation.";

    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid RunId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private static readonly ConflictException SealedConflict = new(SealedConflictMessage);

    [Fact]
    public async Task ExportRunDocx_maps_lifecycle_incomplete_to_409()
    {
        Guid manifestId = Guid.NewGuid();
        ManifestHashService manifestHashService = new();
        ManifestDocument sealedManifest = DocxExportControllerTestSupport.CreateSealedExportManifest(
            RunId,
            manifestId,
            DocxExportControllerTestSupport.CreateFeasibilityVerdictWithTrail(),
            manifestHashService);

        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        DocxExportControllerTestSupport.SetupAuthorityForDocxExport(
            authority,
            RunId,
            sealedManifest);

        Mock<IRunDetailQueryService> runDetailQuery = new(MockBehavior.Strict);
        runDetailQuery
            .Setup(service => service.GetRunDetailAsync(RunId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail
            {
                Run = new ArchitectureRun
                {
                    RunId = RunId.ToString("N"),
                    Status = ArchitectureRunStatus.ReadyForCommit,
                },
                AuthorityLifecyclePhase = AuthorityRunLifecyclePhase.InProgress,
            });

        DocxExportController sut = BuildController(authority.Object, runDetailQuery.Object, manifestHashService);

        IActionResult action = await sut.ExportRunDocx(RunId, null, false, false, CancellationToken.None);

        AssertSealedManifestConflict409(action);
    }

    [Fact]
    public async Task ExportRunDocx_maps_compare_run_sealed_manifest_conflict_to_409()
    {
        Guid compareRunId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid manifestId = Guid.NewGuid();
        ManifestHashService manifestHashService = new();
        ManifestDocument sealedManifest = DocxExportControllerTestSupport.CreateSealedExportManifest(
            RunId,
            manifestId,
            DocxExportControllerTestSupport.CreateFeasibilityVerdictWithTrail(),
            manifestHashService);

        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        DocxExportControllerTestSupport.SetupAuthorityForDocxExport(
            authority,
            RunId,
            sealedManifest);
        authority
            .Setup(service => service.GetRunDetailAsync(Scope, compareRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord { RunId = compareRunId },
                GoldenManifest = sealedManifest,
            });
        authority
            .Setup(service => service.GetRunDetailForManifestCompareAsync(
                Scope,
                compareRunId,
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);

        Mock<IRunDetailQueryService> runDetailQuery = new(MockBehavior.Strict);
        runDetailQuery
            .Setup(service => service.GetRunDetailAsync(RunId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail
            {
                Run = new ArchitectureRun
                {
                    RunId = RunId.ToString("N"),
                    ContextSnapshotId = "ctx",
                    GraphSnapshotId = Guid.NewGuid(),
                    FindingsSnapshotId = Guid.NewGuid(),
                },
                AuthorityLifecyclePhase = AuthorityRunLifecyclePhase.Complete,
            });
        runDetailQuery
            .Setup(service => service.GetRunDetailAsync(compareRunId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail
            {
                Run = new ArchitectureRun
                {
                    RunId = compareRunId.ToString("N"),
                    ContextSnapshotId = "ctx-compare",
                    GraphSnapshotId = Guid.NewGuid(),
                    FindingsSnapshotId = Guid.NewGuid(),
                },
                AuthorityLifecyclePhase = AuthorityRunLifecyclePhase.Complete,
            });

        DocxExportController sut = BuildController(authority.Object, runDetailQuery.Object, manifestHashService);

        IActionResult action = await sut.ExportRunDocx(
            RunId,
            compareRunId,
            false,
            false,
            CancellationToken.None);

        AssertSealedManifestConflict409(action);
    }

    private static void AssertSealedManifestConflict409(IActionResult action)
    {
        ObjectResult conflict = action.Should().BeOfType<ObjectResult>().Subject;
        conflict.StatusCode.Should().Be(StatusCodes.Status409Conflict);

        MvcProblemDetails problem = conflict.Value.Should().BeOfType<MvcProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.Conflict);
        problem.Detail.Should().NotBeNullOrWhiteSpace();
    }

    private static DocxExportController BuildController(
        IAuthorityQueryService authority,
        IRunDetailQueryService runDetailQuery,
        IManifestHashService manifestHashService)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static provider => provider.GetCurrentScope()).Returns(Scope);

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["PreCommitGovernance:PreCommitGateEnabled"] = "true",
            })
            .Build();

        return new DocxExportController(
            authority,
            runDetailQuery,
            Mock.Of<IArtifactQueryService>(),
            Mock.Of<ArchLucid.ArtifactSynthesis.Docx.IDocxExportService>(),
            Mock.Of<IComparisonService>(),
            Mock.Of<IExplanationService>(),
            Mock.Of<IProvenanceSnapshotRepository>(),
            scopeProvider.Object,
            manifestHashService,
            Mock.Of<IGraphSnapshotRepository>(),
            DocxExportControllerTestSupport.CreateAgentExecutionTraceRepository(),
            configuration,
            Mock.Of<IAuditService>(),
            NullLogger<DocxExportController>.Instance,
            Mock.Of<ArchLucid.Persistence.Interfaces.IRunRepository>(),
            Mock.Of<IArchitectureInventoryBindingRepository>())
        {
            ControllerContext = AnalysisReportsControllerAuditTests.CreateControllerContext(),
        };
    }
}
