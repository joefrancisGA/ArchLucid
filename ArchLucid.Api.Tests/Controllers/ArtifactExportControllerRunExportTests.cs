using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Contracts;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Coordination.Export;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests.Controllers;

[Trait("Category", "Unit")]
public sealed class ArtifactExportControllerRunExportTests
{
    private const string ValidDestination =
        "https://acct.blob.core.windows.net/exports/archlucid.zip?sv=2022-11-02&ss=b&srt=sco&sp=w&se=2099-01-01T00:00:00Z&sig=placeholder";

    [Fact]
    public async Task PushRunExportToBlob_returns_400_when_destination_is_rejected()
    {
        ArtifactExportController sut = CreateController(
            out _,
            out _,
            out Mock<IRunExportBlobPushOutboxRepository> outbox);

        IActionResult result = await sut.PushRunExportToBlob(
            Guid.NewGuid(),
            new RunExportBlobPushRequest { DestinationSasUrl = "https://127.0.0.1/evil?sas=token" },
            CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        outbox.Verify(
            o => o.EnqueueAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task DownloadTerraformAdvisoryExport_returns_404_when_run_has_no_committed_manifest()
    {
        Guid runId = Guid.NewGuid();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        Mock<IArtifactPackagingService> packaging = new();
        packaging
            .Setup(p => p.BuildTerraformAdvisoryPlaceholderExport(It.IsAny<Guid>()))
            .Returns(new ArtifactPackage
            {
                Content = [0x50, 0x4b],
                ContentType = "application/zip",
                PackageFileName = "terraform.zip"
            });

        ArtifactExportController sut = CreateController(
            out Mock<IAuthorityQueryService> authority,
            out Mock<IAuditService> audit,
            out _,
            scope,
            artifactPackagingService: packaging.Object);

        authority
            .Setup(q => q.GetRunDetailAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord { RunId = runId },
                GoldenManifest = null
            });

        IActionResult result = await sut.DownloadTerraformAdvisoryExport(runId, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        packaging.Verify(p => p.BuildTerraformAdvisoryPlaceholderExport(It.IsAny<Guid>()), Times.Never);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateTerraformPr_returns_404_when_run_has_no_committed_manifest()
    {
        Guid runId = Guid.NewGuid();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        Mock<IArtifactPackagingService> packaging = new();
        packaging
            .Setup(p => p.BuildTerraformAdvisoryPlaceholderExport(It.IsAny<Guid>()))
            .Returns(new ArtifactPackage
            {
                Content = [0x50, 0x4b],
                ContentType = "application/zip",
                PackageFileName = "terraform.zip"
            });

        Mock<ITerraformGitHubPrService> terraformPr = new();

        ArtifactExportController sut = CreateController(
            out Mock<IAuthorityQueryService> authority,
            out _,
            out _,
            scope,
            artifactPackagingService: packaging.Object,
            terraformGitHubPrService: terraformPr.Object);

        authority
            .Setup(q => q.GetRunDetailAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord { RunId = runId },
                GoldenManifest = null
            });

        IActionResult result = await sut.CreateTerraformPr(runId, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        packaging.Verify(p => p.BuildTerraformAdvisoryPlaceholderExport(It.IsAny<Guid>()), Times.Never);
        terraformPr.Verify(
            t => t.CreatePrAsync(It.IsAny<Guid>(), It.IsAny<byte[]>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PushRunExportToBlob_returns_409_when_authority_lifecycle_not_complete()
    {
        Guid runId = Guid.NewGuid();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        ArtifactExportController sut = CreateController(
            out Mock<IAuthorityQueryService> authority,
            out Mock<IAuditService> audit,
            out Mock<IRunExportBlobPushOutboxRepository> outbox,
            scope);

        authority
            .Setup(q => q.GetRunDetailAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord
                {
                    RunId = runId,
                    GoldenManifestId = Guid.NewGuid(),
                    LegacyRunStatus = nameof(ArchitectureRunStatus.ReadyForCommit),
                },
                GoldenManifest = new ManifestDocument { ManifestId = Guid.NewGuid() },
            });

        IActionResult result = await sut.PushRunExportToBlob(
            runId,
            new RunExportBlobPushRequest { DestinationSasUrl = ValidDestination },
            CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        outbox.Verify(
            o => o.EnqueueAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PushRunExportToBlob_enqueues_and_returns_202_when_run_is_exportable()
    {
        Guid runId = Guid.NewGuid();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        ArtifactExportController sut = CreateController(
            out Mock<IAuthorityQueryService> authority,
            out Mock<IAuditService> audit,
            out Mock<IRunExportBlobPushOutboxRepository> outbox,
            scope);

        authority
            .Setup(q => q.GetRunDetailAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord
                {
                    RunId = runId,
                    GoldenManifestId = Guid.NewGuid(),
                    LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                },
                GoldenManifest = new ManifestDocument { ManifestId = Guid.NewGuid() }
            });

        IActionResult result = await sut.PushRunExportToBlob(
            runId,
            new RunExportBlobPushRequest { DestinationSasUrl = ValidDestination },
            CancellationToken.None);

        result.Should().BeOfType<AcceptedResult>();
        outbox.Verify(
            o => o.EnqueueAsync(
                runId,
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                ValidDestination,
                It.IsAny<CancellationToken>()),
            Times.Once);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.RunExportBlobPushQueued && e.RunId == runId),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task DownloadRunExport_emits_RunExported_and_returns_zip()
    {
        Guid runId = Guid.NewGuid();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        Mock<IRunExportPackageBuilder> builder = new();
        builder
            .Setup(b => b.BuildAsync(scope, runId, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunExportPackageResult.Success(
                [0x50, 0x4b],
                "application/zip",
                "export.zip",
                Guid.NewGuid()));

        ArtifactExportController sut = CreateController(
            out _,
            out Mock<IAuditService> audit,
            out _,
            scope,
            builder.Object);

        IActionResult result = await sut.DownloadRunExport(runId, CancellationToken.None);

        FileContentResult file = result.Should().BeOfType<FileContentResult>().Subject;
        file.ContentType.Should().Be("application/zip");
        file.FileContents.Should().Equal([0x50, 0x4b]);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.RunExported && e.RunId == runId),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task VerifyRunExportLineage_returns_404_when_run_missing()
    {
        Guid runId = Guid.NewGuid();
        Mock<IRunExportLineageVerifier> verifier = new();
        verifier
            .Setup(v => v.VerifyAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunExportLineageVerificationResult?)null);

        ArtifactExportController sut = CreateController(
            out _,
            out _,
            out _,
            runExportLineageVerifier: verifier.Object);

        IActionResult result = await sut.VerifyRunExportLineage(runId, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task VerifyRunExportLineage_returns_200_with_status_body()
    {
        Guid runId = Guid.NewGuid();
        RunExportLineageVerificationResult verification = new()
        {
            Status = RunExportLineageVerificationStatus.Match,
            RunId = runId,
            ManifestId = Guid.NewGuid(),
            CommittedHash = "ABC",
            RecomputedHash = "ABC"
        };

        Mock<IRunExportLineageVerifier> verifier = new();
        verifier
            .Setup(v => v.VerifyAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(verification);

        ArtifactExportController sut = CreateController(
            out _,
            out _,
            out _,
            runExportLineageVerifier: verifier.Object);

        IActionResult result = await sut.VerifyRunExportLineage(runId, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        RunExportLineageVerificationResponse body = ok.Value.Should().BeOfType<RunExportLineageVerificationResponse>().Subject;
        body.Status.Should().Be("Match");
        body.CommittedManifestHash.Should().Be("ABC");
    }

    private static ArtifactExportController CreateController(
        out Mock<IAuthorityQueryService> authority,
        out Mock<IAuditService> audit,
        out Mock<IRunExportBlobPushOutboxRepository> outbox,
        ScopeContext? scope = null,
        IRunExportPackageBuilder? runExportPackageBuilder = null,
        IRunExportLineageVerifier? runExportLineageVerifier = null,
        IArtifactPackagingService? artifactPackagingService = null,
        ITerraformGitHubPrService? terraformGitHubPrService = null)
    {
        authority = new Mock<IAuthorityQueryService>();
        audit = new Mock<IAuditService>();
        outbox = new Mock<IRunExportBlobPushOutboxRepository>();
        runExportPackageBuilder ??= Mock.Of<IRunExportPackageBuilder>();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope ?? new ScopeContext
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        });
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        outbox
            .Setup(o => o.EnqueueAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["ArchLucid:MermaidCli:Enabled"] = "false" })
            .Build();

        ArtifactExportController controller = new(
            Mock.Of<IArtifactQueryService>(),
            authority.Object,
            artifactPackagingService ?? Mock.Of<IArtifactPackagingService>(),
            scopeProvider.Object,
            audit.Object,
            Mock.Of<ArchLucid.Core.Diagrams.IDiagramImageRenderer>(),
            configuration,
            terraformGitHubPrService ?? Mock.Of<ITerraformGitHubPrService>(),
            runExportPackageBuilder,
            outbox.Object,
            runExportLineageVerifier ?? Mock.Of<IRunExportLineageVerifier>(),
            Mock.Of<ArchLucid.Application.Exports.IDecisionReceiptService>(),
            Mock.Of<IManifestHashService>(),
            Mock.Of<IBrandedDiagramExportService>());

        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        return controller;
    }
}
