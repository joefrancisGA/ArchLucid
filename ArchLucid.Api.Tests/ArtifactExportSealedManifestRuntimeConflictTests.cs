using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Findings.FindingVerification;
using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Application.Runs;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Coordination.Export;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

using Moq;

using MvcProblemDetails = Microsoft.AspNetCore.Mvc.ProblemDetails;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Runtime proof that artifact export paths map sealed-manifest <see cref="ConflictException" /> to OpenAPI **409**
///     (package builder, lineage verifier, manifest compare, and decision-receipt export guards).
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArtifactExportSealedManifestRuntimeConflictTests
{
    private const string SealedConflictMessage =
        "Wave artifact-export sealed-manifest hash drift blocks this run export mutation.";

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
        problem.Detail.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task DownloadRunExport_maps_manifest_compare_ConflictException_to_409()
    {
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        authority
            .Setup(service => service.GetRunDetailForManifestCompareAsync(
                Scope,
                RunId,
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);

        ArtifactExportController sut = BuildController(authority: authority.Object);

        IActionResult action = await sut.DownloadRunExport(RunId, CancellationToken.None);

        AssertSealedManifestConflict409(action);
    }

    [Fact]
    public async Task DownloadRunExport_maps_package_builder_conflict_to_409()
    {
        const string builderConflictMessage =
            "Run export package builder blocked export because sealed manifest lineage diverged.";

        Mock<IRunExportPackageBuilder> builder = new(MockBehavior.Strict);
        builder
            .Setup(b => b.BuildAsync(Scope, RunId, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunExportPackageResult.Conflict(builderConflictMessage, ProblemTypes.Conflict));

        ArtifactExportController sut = BuildController(runExportPackageBuilder: builder.Object);

        IActionResult action = await sut.DownloadRunExport(RunId, CancellationToken.None);

        ObjectResult conflict = action.Should().BeOfType<ObjectResult>().Subject;
        conflict.StatusCode.Should().Be(StatusCodes.Status409Conflict);

        MvcProblemDetails problem = conflict.Value.Should().BeOfType<MvcProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.Conflict);
        problem.Detail.Should().Be(builderConflictMessage);
    }

    [Fact]
    public async Task VerifyRunExportLineage_maps_verifier_ConflictException_to_409()
    {
        Mock<IRunExportLineageVerifier> verifier = new(MockBehavior.Strict);
        verifier
            .Setup(v => v.VerifyAsync(Scope, RunId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);

        ArtifactExportController sut = BuildController(runExportLineageVerifier: verifier.Object);

        IActionResult action = await sut.VerifyRunExportLineage(RunId, CancellationToken.None);

        AssertSealedManifestConflict409(action);
    }

    [Fact]
    public async Task DownloadTerraformAdvisoryExport_maps_sealed_hash_drift_to_409()
    {
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        authority
            .Setup(service => service.GetRunDetailAsync(Scope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord { RunId = RunId },
                GoldenManifest = new ManifestDocument
                {
                    ManifestId = Guid.NewGuid(),
                    ManifestHash = "stored-hash",
                },
            });

        Mock<IManifestHashService> manifestHash = new(MockBehavior.Strict);
        manifestHash
            .Setup(service => service.ComputeHash(It.IsAny<ManifestDocument>()))
            .Returns("recomputed-hash");

        ArtifactExportController sut = BuildController(
            authority: authority.Object,
            manifestHashService: manifestHash.Object);

        IActionResult action = await sut.DownloadTerraformAdvisoryExport(RunId, CancellationToken.None);

        AssertSealedManifestConflict409(action);
    }

    [Fact]
    public async Task DownloadRunDecisionReceipt_maps_sealed_hash_mismatch_outcome_to_409()
    {
        Mock<IDecisionReceiptService> decisionReceipt = new(MockBehavior.Strict);
        decisionReceipt
            .Setup(service => service.BuildForRunAsync(Scope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DecisionReceiptRunBuildResult
            {
                Outcome = DecisionReceiptRunBuildOutcome.SealedHashMismatch,
            });

        ArtifactExportController sut = BuildController(decisionReceiptService: decisionReceipt.Object);

        IActionResult action = await sut.DownloadRunDecisionReceipt(RunId, CancellationToken.None);

        ObjectResult conflict = action.Should().BeOfType<ObjectResult>().Subject;
        conflict.StatusCode.Should().Be(StatusCodes.Status409Conflict);

        MvcProblemDetails problem = conflict.Value.Should().BeOfType<MvcProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.Conflict);
        problem.Detail.Should().Contain("sealed-hash verification");
    }

    [Fact]
    public async Task ListArtifactsForRun_maps_manifest_compare_ConflictException_to_409()
    {
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        authority
            .Setup(service => service.GetRunDetailAsync(Scope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord
                {
                    RunId = RunId,
                    GoldenManifestId = Guid.NewGuid(),
                },
                GoldenManifest = new ManifestDocument
                {
                    ManifestId = Guid.NewGuid(),
                    ManifestHash = SealedManifestHashTestSupport.DefaultHash,
                },
            });
        authority
            .Setup(service => service.GetRunDetailForManifestCompareAsync(
                Scope,
                RunId,
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(SealedConflict);

        ArtifactExportController sut = BuildController(authority: authority.Object);

        IActionResult action = await sut.ListArtifactsForRun(RunId, CancellationToken.None);

        AssertSealedManifestConflict409(action);
    }

    private static ArtifactExportController BuildController(
        IAuthorityQueryService? authority = null,
        IRunExportPackageBuilder? runExportPackageBuilder = null,
        IRunExportLineageVerifier? runExportLineageVerifier = null,
        IManifestHashService? manifestHashService = null,
        IDecisionReceiptService? decisionReceiptService = null)
    {
        IAuthorityQueryService authorityQueryService =
            authority ?? SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun();

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ArchLucid:MermaidCli:Enabled"] = "false",
            })
            .Build();

        return new ArtifactExportController(
            Mock.Of<IArtifactQueryService>(),
            authorityQueryService,
            Mock.Of<IArtifactPackagingService>(),
            scopeProvider.Object,
            audit.Object,
            Mock.Of<ArchLucid.Core.Diagrams.IDiagramImageRenderer>(),
            configuration,
            Mock.Of<ITerraformGitHubPrService>(),
            runExportPackageBuilder ?? Mock.Of<IRunExportPackageBuilder>(),
            Mock.Of<IRunExportBlobPushOutboxRepository>(),
            runExportLineageVerifier ?? Mock.Of<IRunExportLineageVerifier>(),
            decisionReceiptService ?? Mock.Of<IDecisionReceiptService>(),
            manifestHashService ?? SealedManifestHashTestSupport.CreateManifestHashService(),
            Mock.Of<IBrandedDiagramExportService>(),
            Mock.Of<IFindingVerificationReportQueryService>(),
            Mock.Of<ArchLucid.Api.Support.IArchitectureShareAccessGate>(),
            Mock.Of<IRunDetailQueryService>(),
            Mock.Of<IGraphSnapshotRepository>(),
            Mock.Of<IAgentExecutionTraceRepository>(),
            Mock.Of<ArchLucid.Persistence.Interfaces.IRunRepository>(),
            Mock.Of<IArchitectureInventoryBindingRepository>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
