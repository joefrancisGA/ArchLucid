using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Application;
using ArchLucid.Application.Diagrams;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Summaries;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

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

    private static ManifestsController CreateController(
        IUnifiedGoldenManifestReader manifestReader,
        IScopeContextProvider scopeProvider,
        IRunRepository runRepository,
        IAgentEvidencePackageRepository evidenceRepository,
        IManifestSummaryGenerator summaryGenerator)
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
                runRepository)
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
            };
    }
}
