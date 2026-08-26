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
    public async Task GetManifestBundle_omits_evidence_when_run_is_out_of_scope()
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

        AgentEvidencePackage foreignEvidence = new()
        {
            EvidencePackageId = Guid.NewGuid().ToString("D"),
            RunId = foreignRunId.ToString("N"),
            RequestId = "req-foreign",
            SystemName = "secret-system",
            Environment = "prod",
            CloudProvider = "Azure",
        };

        Mock<IAgentEvidencePackageRepository> evidenceRepo = new();
        evidenceRepo
            .Setup(r => r.GetByRunIdAsync(foreignRunId.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(foreignEvidence);

        Mock<IManifestSummaryGenerator> summaryGenerator = new();
        summaryGenerator
            .Setup(g => g.GenerateMarkdown(manifest, null))
            .Returns("# summary without evidence");

        ManifestsController controller = CreateController(
            reader.Object,
            scopeProvider.Object,
            runs.Object,
            evidenceRepo.Object,
            summaryGenerator.Object);

        IActionResult action = await controller.GetManifestBundle(ManifestVersion, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ManifestBundleResponse body = ok.Value.Should().BeOfType<ManifestBundleResponse>().Subject;
        body.Summary.Should().Be("# summary without evidence");
        evidenceRepo.Verify(
            r => r.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
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
                Mock.Of<IArchitectureApplicationService>(),
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
