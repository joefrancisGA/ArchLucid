using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diagrams;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Summaries;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class ManifestsControllerEvidenceScopeTests
{
    private const string ManifestVersion = "golden-v1";

    private static readonly ScopeContext CallerScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task GetManifest_returns_not_found_when_workspace_missing()
    {
        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IUnifiedGoldenManifestReader> reader = new(MockBehavior.Strict);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = CallerScope.TenantId,
            WorkspaceId = foreignWorkspaceId,
            ProjectId = CallerScope.ProjectId,
        });

        ManifestsController controller = CreateController(
            reader.Object,
            scopeProvider.Object,
            Mock.Of<IRunRepository>(),
            Mock.Of<IAgentEvidencePackageRepository>(),
            Mock.Of<IManifestSummaryGenerator>(),
            TenantExistsRepository());

        IActionResult action = await controller.GetManifest(ManifestVersion, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        reader.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetManifest_returns_not_found_when_tenant_missing()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        GoldenManifest manifest = new()
        {
            RunId = runId.ToString("N"),
            SystemName = "payments",
            Metadata = new ManifestMetadata { ManifestVersion = ManifestVersion },
            Governance = new ManifestGovernance(),
        };

        Mock<IUnifiedGoldenManifestReader> reader = new();
        reader
            .Setup(r => r.GetByVersionAsync(ManifestVersion, It.IsAny<CancellationToken>()))
            .ReturnsAsync(manifest);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(CallerScope);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(CallerScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runId,
                GoldenManifestId = Guid.NewGuid(),
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed)
            });

        ManifestsController controller = CreateController(
            reader.Object,
            scopeProvider.Object,
            runs.Object,
            Mock.Of<IAgentEvidencePackageRepository>(),
            Mock.Of<IManifestSummaryGenerator>(),
            TenantMissingRepository());

        IActionResult action = await controller.GetManifest(ManifestVersion, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetManifestBundle_returns_not_found_when_tenant_missing()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        GoldenManifest manifest = new()
        {
            RunId = runId.ToString("N"),
            SystemName = "payments",
            Metadata = new ManifestMetadata { ManifestVersion = ManifestVersion },
            Governance = new ManifestGovernance(),
        };

        Mock<IUnifiedGoldenManifestReader> reader = new();
        reader
            .Setup(r => r.GetByVersionAsync(ManifestVersion, It.IsAny<CancellationToken>()))
            .ReturnsAsync(manifest);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(CallerScope);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(CallerScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runId,
                GoldenManifestId = Guid.NewGuid(),
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed)
            });

        Mock<IManifestSummaryGenerator> summary = new(MockBehavior.Strict);

        ManifestsController controller = CreateController(
            reader.Object,
            scopeProvider.Object,
            runs.Object,
            Mock.Of<IAgentEvidencePackageRepository>(),
            summary.Object,
            TenantMissingRepository());

        IActionResult action = await controller.GetManifestBundle(ManifestVersion, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        summary.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CompareManifests_returns_not_found_when_tenant_missing()
    {
        Mock<IUnifiedGoldenManifestReader> reader = new(MockBehavior.Strict);

        ManifestsController controller = CreateController(
            reader.Object,
            Mock.Of<IScopeContextProvider>(provider => provider.GetCurrentScope() == CallerScope),
            Mock.Of<IRunRepository>(),
            Mock.Of<IAgentEvidencePackageRepository>(),
            Mock.Of<IManifestSummaryGenerator>(),
            TenantMissingRepository());

        IActionResult action = await controller.CompareManifests(
            ManifestVersion,
            "golden-v2",
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        reader.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetManifestBundle_returns_not_found_when_run_is_out_of_scope()
    {
        Guid foreignRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        GoldenManifest manifest = new()
        {
            RunId = foreignRunId.ToString("N"),
            SystemName = "payments",
            Metadata = new ManifestMetadata { ManifestVersion = ManifestVersion },
            Governance = new ManifestGovernance(),
        };

        Mock<IUnifiedGoldenManifestReader> reader = new();
        reader
            .Setup(r => r.GetByVersionAsync(ManifestVersion, It.IsAny<CancellationToken>()))
            .ReturnsAsync(manifest);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(CallerScope);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(CallerScope, foreignRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        ManifestsController controller = CreateController(
            reader.Object,
            scopeProvider.Object,
            runs.Object,
            Mock.Of<IAgentEvidencePackageRepository>(),
            Mock.Of<IManifestSummaryGenerator>());

        IActionResult action = await controller.GetManifestBundle(ManifestVersion, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetManifest_returns_not_found_when_run_is_out_of_scope()
    {
        Guid foreignRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        GoldenManifest manifest = new()
        {
            RunId = foreignRunId.ToString("N"),
            SystemName = "payments",
            Metadata = new ManifestMetadata { ManifestVersion = ManifestVersion },
            Governance = new ManifestGovernance(),
        };

        Mock<IUnifiedGoldenManifestReader> reader = new();
        reader
            .Setup(r => r.GetByVersionAsync(ManifestVersion, It.IsAny<CancellationToken>()))
            .ReturnsAsync(manifest);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(CallerScope);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(CallerScope, foreignRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        ManifestsController controller = CreateController(
            reader.Object,
            scopeProvider.Object,
            runs.Object,
            Mock.Of<IAgentEvidencePackageRepository>(),
            Mock.Of<IManifestSummaryGenerator>());

        IActionResult action = await controller.GetManifest(ManifestVersion, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetManifest_accepts_padded_manifest_version_when_manifest_is_in_scope()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string paddedManifestVersion = $"  {ManifestVersion}  ";
        GoldenManifest manifest = new()
        {
            RunId = runId.ToString("N"),
            SystemName = "payments",
            Metadata = new ManifestMetadata { ManifestVersion = ManifestVersion },
            Governance = new ManifestGovernance(),
        };

        Mock<IUnifiedGoldenManifestReader> reader = new();
        reader
            .Setup(r => r.GetByVersionAsync(ManifestVersion, It.IsAny<CancellationToken>()))
            .ReturnsAsync(manifest);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(CallerScope);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(CallerScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runId,
                GoldenManifestId = Guid.NewGuid(),
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed)
            });

        ManifestsController controller = CreateController(
            reader.Object,
            scopeProvider.Object,
            runs.Object,
            Mock.Of<IAgentEvidencePackageRepository>(),
            Mock.Of<IManifestSummaryGenerator>());

        IActionResult action = await controller.GetManifest(paddedManifestVersion, CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetManifestBundle_accepts_padded_manifest_version_when_manifest_is_in_scope()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string paddedManifestVersion = $"  {ManifestVersion}  ";
        GoldenManifest manifest = new()
        {
            RunId = runId.ToString("N"),
            SystemName = "payments",
            Metadata = new ManifestMetadata { ManifestVersion = ManifestVersion },
            Governance = new ManifestGovernance(),
        };

        Mock<IUnifiedGoldenManifestReader> reader = new();
        reader
            .Setup(r => r.GetByVersionAsync(ManifestVersion, It.IsAny<CancellationToken>()))
            .ReturnsAsync(manifest);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(CallerScope);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(CallerScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runId,
                GoldenManifestId = Guid.NewGuid(),
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed)
            });

        Mock<IManifestSummaryGenerator> summaryGenerator = new();
        summaryGenerator
            .Setup(g => g.GenerateMarkdown(It.IsAny<GoldenManifest>(), It.IsAny<AgentEvidencePackage?>()))
            .Returns("summary");

        ManifestsController controller = CreateController(
            reader.Object,
            scopeProvider.Object,
            runs.Object,
            Mock.Of<IAgentEvidencePackageRepository>(),
            summaryGenerator.Object);

        IActionResult action = await controller.GetManifestBundle(paddedManifestVersion, CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
        reader.VerifyAll();
    }

    [Fact]
    public async Task CompareManifests_returns_not_found_when_manifest_run_is_out_of_scope()
    {
        Guid foreignRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        GoldenManifest manifest = new()
        {
            RunId = foreignRunId.ToString("N"),
            SystemName = "payments",
            Metadata = new ManifestMetadata { ManifestVersion = ManifestVersion },
            Governance = new ManifestGovernance(),
        };

        Mock<IUnifiedGoldenManifestReader> reader = new();
        reader
            .Setup(r => r.GetByVersionAsync(ManifestVersion, It.IsAny<CancellationToken>()))
            .ReturnsAsync(manifest);
        reader
            .Setup(r => r.GetByVersionAsync("golden-v2", It.IsAny<CancellationToken>()))
            .ReturnsAsync(manifest);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(CallerScope);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(CallerScope, foreignRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        ManifestsController controller = CreateController(
            reader.Object,
            scopeProvider.Object,
            runs.Object,
            Mock.Of<IAgentEvidencePackageRepository>(),
            Mock.Of<IManifestSummaryGenerator>());

        IActionResult action = await controller.CompareManifests(
            ManifestVersion,
            "golden-v2",
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    private static ITenantRepository TenantExistsRepository()
    {
        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(CallerScope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord
            {
                Id = CallerScope.TenantId,
                Name = "contoso",
            });
        tenants
            .Setup(repository => repository.ListWorkspacesAsync(CallerScope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = CallerScope.WorkspaceId,
                    Name = "primary",
                },
            ]);

        return tenants.Object;
    }

    private static ITenantRepository TenantMissingRepository() =>
        Mock.Of<ITenantRepository>(repository => repository.GetByIdAsync(
            CallerScope.TenantId,
            It.IsAny<CancellationToken>()) == Task.FromResult<TenantRecord?>(null));

    private static ManifestsController CreateController(
        IUnifiedGoldenManifestReader manifestReader,
        IScopeContextProvider scopeProvider,
        IRunRepository runRepository,
        IAgentEvidencePackageRepository evidenceRepository,
        IManifestSummaryGenerator summaryGenerator,
        ITenantRepository? tenantRepository = null)
    {
        Mock<IDiagramGenerator> diagramGenerator = new();
        diagramGenerator
            .Setup(g => g.GenerateMermaid(It.IsAny<GoldenManifest>()))
            .Returns("graph LR; A-->B");

        return new ManifestsController(
                manifestReader,
                Mock.Of<IManifestDiffService>(),
                Mock.Of<IManifestDiffSummaryFormatter>(),
                Mock.Of<IManifestDiffExportService>(),
                diagramGenerator.Object,
                summaryGenerator,
                Mock.Of<IManifestSummaryService>(),
                Mock.Of<IArchitectureExportService>(),
                evidenceRepository,
                Mock.Of<IManifestDiagramService>(),
                scopeProvider,
                runRepository,
                Mock.Of<IAuthorityQueryService>(),
                Mock.Of<IManifestHashService>(),
                Mock.Of<ICompareRunsApplicationFacade>(),
                tenantRepository ?? TenantExistsRepository())
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
            };
    }
}
