using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Support;
using System.Security.Claims;
using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Findings.FindingVerification;
using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Contracts.Architecture;
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
    public async Task DownloadRunExport_maps_package_builder_thrown_ConflictException_to_409()
    {
        const string lifecycleConflictMessage =
            "Compare/export blocked for run 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa': authority lifecycle phase is InProgress; pipeline must be Complete.";

        Mock<IRunExportPackageBuilder> builder = new(MockBehavior.Strict);
        builder
            .Setup(b => b.BuildAsync(Scope, RunId, null, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ConflictException(lifecycleConflictMessage));

        ArtifactExportController sut = BuildController(runExportPackageBuilder: builder.Object);

        IActionResult action = await sut.DownloadRunExport(RunId, CancellationToken.None);

        ObjectResult conflict = action.Should().BeOfType<ObjectResult>().Subject;
        conflict.StatusCode.Should().Be(StatusCodes.Status409Conflict);

        MvcProblemDetails problem = conflict.Value.Should().BeOfType<MvcProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.Conflict);
        problem.Detail.Should().Be(lifecycleConflictMessage);
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

    [Theory]
    [InlineData("decision-receipt")]
    [InlineData("terraform-advisory")]
    public async Task Restricted_run_is_denied_before_artifact_data_read_or_download(
        string endpoint)
    {
        Mock<IArchitectureShareAccessGate> sharing = new(MockBehavior.Strict);
        sharing.Setup(g => g.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(),
                Scope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new NotFoundResult());

        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        Mock<IDecisionReceiptService> receipts = new(MockBehavior.Strict);
        Mock<IArtifactPackagingService> packaging = new(MockBehavior.Strict);

        ArtifactExportController sut = BuildController(
            authority: authority.Object,
            decisionReceiptService: receipts.Object,
            artifactPackagingService: packaging.Object,
            architectureShareAccessGate: sharing.Object);

        IActionResult action = endpoint switch
        {
            "decision-receipt" => await sut.DownloadRunDecisionReceipt(
                RunId, CancellationToken.None),
            "terraform-advisory" => await sut.DownloadTerraformAdvisoryExport(
                RunId, CancellationToken.None),
            _ => throw new InvalidOperationException(endpoint),
        };

        action.Should().BeOfType<NotFoundResult>();
        sharing.Verify(g => g.EnsureRunReadAllowedAsync(
            It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(),
            Scope, RunId, It.IsAny<CancellationToken>()), Times.Once);
        authority.VerifyNoOtherCalls();
        receipts.VerifyNoOtherCalls();
        packaging.VerifyNoOtherCalls();
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
        problem.Type.Should().Be(ProblemTypes.DecisionReceiptSealedHashMismatch);
        problem.Detail.Should().Contain("sealed-hash verification");
    }

    [Fact]
    public async Task DownloadBundleForRun_returns_409_when_authority_lifecycle_not_complete()
    {
        Guid manifestId = Guid.NewGuid();
        RunDetailDto runDetail = new()
        {
            Run = new RunRecord
            {
                RunId = RunId,
                GoldenManifestId = manifestId,
                LegacyRunStatus = nameof(ArchitectureRunStatus.ReadyForCommit),
            },
            GoldenManifest = new ManifestDocument
            {
                ManifestId = manifestId,
                ManifestHash = SealedManifestHashTestSupport.DefaultHash,
            },
        };

        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        authority
            .Setup(service => service.GetRunDetailAsync(Scope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(runDetail);
        authority
            .Setup(service => service.GetRunDetailForManifestCompareAsync(
                Scope,
                RunId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(runDetail);

        Mock<IArtifactQueryService> artifacts = new(MockBehavior.Strict);

        ArtifactExportController sut = BuildController(
            authority: authority.Object,
            artifactQueryService: artifacts.Object);

        IActionResult action = await sut.DownloadBundleForRun(RunId, CancellationToken.None);

        AssertSealedManifestConflict409(action);
        artifacts.Verify(
            q => q.GetArtifactsByManifestIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
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

    [Fact]
    public async Task ListArtifactsForRun_returns_409_when_authority_lifecycle_not_complete()
    {
        Guid manifestId = Guid.NewGuid();
        ManifestDocument manifest = new()
        {
            ManifestId = manifestId,
            ManifestHash = SealedManifestHashTestSupport.DefaultHash,
        };

        RunDetailDto runDetail = new()
        {
            Run = new RunRecord
            {
                RunId = RunId,
                GoldenManifestId = manifestId,
                LegacyRunStatus = nameof(ArchLucid.Contracts.Common.ArchitectureRunStatus.ReadyForCommit),
            },
            GoldenManifest = manifest,
        };

        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        authority
            .Setup(service => service.GetRunDetailAsync(
                Scope,
                RunId,
                It.IsAny<CancellationToken>(),
                It.IsAny<bool>()))
            .ReturnsAsync(runDetail);
        authority
            .Setup(service => service.GetRunDetailForManifestCompareAsync(
                Scope,
                RunId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(runDetail);

        ArtifactExportController sut = BuildController(authority: authority.Object);

        IActionResult action = await sut.ListArtifactsForRun(RunId, CancellationToken.None);

        AssertSealedManifestConflict409(action);
    }

    [Fact]
    public async Task DownloadBundleForRun_maps_manifest_compare_ConflictException_to_409()
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

        IActionResult action = await sut.DownloadBundleForRun(RunId, CancellationToken.None);

        AssertSealedManifestConflict409(action);
    }

    [Fact]
    public async Task DownloadArtifactForRun_maps_manifest_compare_ConflictException_to_409()
    {
        Guid artifactId = Guid.Parse("22222222-2222-2222-2222-222222222222");

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

        IActionResult action = await sut.DownloadArtifactForRun(RunId, artifactId, CancellationToken.None);

        AssertSealedManifestConflict409(action);
    }

    [Theory]
    [InlineData("list-run")]
    [InlineData("bundle-run")]
    [InlineData("artifact-run")]
    [InlineData("list-manifest")]
    [InlineData("descriptor-manifest")]
    [InlineData("artifact-manifest")]
    [InlineData("bundle-manifest")]
    public async Task Restricted_architecture_denied_before_any_artifact_or_run_detail_read(
        string route)
    {
        Guid manifestId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        Guid artifactId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        bool byManifest = route.EndsWith("-manifest", StringComparison.Ordinal);
        Mock<IAuthorityQueryService> query = new(MockBehavior.Strict);

        // Manifest routes may resolve the scoped manifest-to-run identifier
        // only. No full manifest summary or payload read is allowed pre-gate.
        if (byManifest)
        {
            query.Setup(q => q.GetRunIdByManifestIdAsync(
                    Scope, manifestId, It.IsAny<CancellationToken>()))
                .ReturnsAsync((Guid?)RunId);
        }

        Mock<IArchitectureShareAccessGate> sharing = new(MockBehavior.Strict);
        sharing.Setup(g => g.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(),
                Scope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new NotFoundResult());

        Mock<IArtifactQueryService> artifacts = new(MockBehavior.Strict);
        Mock<IArtifactPackagingService> packaging = new(MockBehavior.Strict);

        ArtifactExportController sut = BuildController(
            authority: query.Object, artifactQueryService: artifacts.Object,
            artifactPackagingService: packaging.Object,
            architectureShareAccessGate: sharing.Object);

        IActionResult action = route switch
        {
            "list-run" => await sut.ListArtifactsForRun(RunId, CancellationToken.None),
            "bundle-run" => await sut.DownloadBundleForRun(RunId, CancellationToken.None),
            "artifact-run" => await sut.DownloadArtifactForRun(RunId, artifactId, CancellationToken.None),
            "list-manifest" => await sut.ListArtifacts(manifestId, CancellationToken.None),
            "descriptor-manifest" => await sut.GetArtifactDescriptor(manifestId, artifactId, CancellationToken.None),
            "artifact-manifest" => await sut.DownloadArtifact(manifestId, artifactId, CancellationToken.None),
            "bundle-manifest" => await sut.DownloadBundle(manifestId, CancellationToken.None),
            _ => throw new InvalidOperationException(route)
        };

        if (byManifest)
        {
            ObjectResult denied = action.Should().BeOfType<ObjectResult>().Subject;
            denied.StatusCode.Should().Be(StatusCodes.Status404NotFound);
            denied.Value?.ToString().Should().NotContain(RunId.ToString("D"));
            query.Verify(q => q.GetRunIdByManifestIdAsync(
                Scope, manifestId, It.IsAny<CancellationToken>()), Times.Once);
        }
        else
        {
            action.Should().BeOfType<NotFoundResult>();
        }

        sharing.Verify(g => g.EnsureRunReadAllowedAsync(
            It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(),
            Scope, RunId, It.IsAny<CancellationToken>()), Times.Once);
        query.VerifyNoOtherCalls();
        artifacts.VerifyNoOtherCalls();
        packaging.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("missing")]
    [InlineData("empty-run")]
    public async Task Manifest_artifact_lookup_rejects_missing_or_empty_scoped_run_reference(string variant)
    {
        Guid manifestId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        Mock<IAuthorityQueryService> query = new(MockBehavior.Strict);
        query.Setup(q => q.GetRunIdByManifestIdAsync(
                Scope, manifestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(variant == "empty-run" ? (Guid?)Guid.Empty : null);

        Mock<IArchitectureShareAccessGate> sharing = new(MockBehavior.Strict);
        ArtifactExportController sut = BuildController(
            authority: query.Object, architectureShareAccessGate: sharing.Object);

        IActionResult action = await sut.ListArtifacts(manifestId, CancellationToken.None);
        action.Should().BeOfType<ObjectResult>().Which.StatusCode
            .Should().Be(StatusCodes.Status404NotFound);
        query.Verify(q => q.GetRunIdByManifestIdAsync(
            Scope, manifestId, It.IsAny<CancellationToken>()), Times.Once);
        query.VerifyNoOtherCalls();
        sharing.VerifyNoOtherCalls();
    }

    private static ArtifactExportController BuildController(
        IAuthorityQueryService? authority = null,
        IRunExportPackageBuilder? runExportPackageBuilder = null,
        IRunExportLineageVerifier? runExportLineageVerifier = null,
        IManifestHashService? manifestHashService = null,
        IDecisionReceiptService? decisionReceiptService = null,
        IArtifactQueryService? artifactQueryService = null,
        IArtifactPackagingService? artifactPackagingService = null,
        IArchitectureShareAccessGate? architectureShareAccessGate = null)
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
            artifactQueryService ?? Mock.Of<IArtifactQueryService>(),
            authorityQueryService,
            artifactPackagingService ?? Mock.Of<IArtifactPackagingService>(),
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
            architectureShareAccessGate ?? PermissiveShareGate(),
            Mock.Of<IRunDetailQueryService>(),
            Mock.Of<IGraphSnapshotRepository>(),
            Mock.Of<IAgentExecutionTraceRepository>(),
            Mock.Of<ArchLucid.Persistence.Interfaces.IRunRepository>(),
            Mock.Of<IArchitectureInventoryBindingRepository>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
    private static IArchitectureShareAccessGate PermissiveShareGate()
    {
        Mock<IArchitectureShareAccessGate> sharing = new();
        sharing.Setup(g => g.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(),
                It.IsAny<ScopeContext>(), It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((IActionResult?)null);
        return sharing.Object;
    }

}
