using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Application;
using ArchLucid.Application.Diagrams;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Summaries;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Decisioning.Interfaces;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ManifestsControllerTests
{
    private const string LeftVersion = "v1";
    private const string RightVersion = "v2";
    private const string ManifestVersion = "golden-v1";

    private static GoldenManifest CreateManifest(string version, string systemName = "payments")
    {
        return new GoldenManifest
        {
            RunId = Guid.NewGuid().ToString("N"),
            SystemName = systemName,
            Metadata = new ManifestMetadata { ManifestVersion = version },
            Governance = new ManifestGovernance()
        };
    }

    private static ManifestsController CreateController(
        IArchitectureApplicationService? architectureService = null,
        IUnifiedGoldenManifestReader? manifestReader = null,
        IManifestDiffService? manifestDiffService = null)
    {
        GoldenManifest left = CreateManifest(LeftVersion);
        GoldenManifest right = CreateManifest(RightVersion, "payments-v2");
        ManifestDiffResult diff = new()
        {
            LeftManifestVersion = LeftVersion,
            RightManifestVersion = RightVersion,
            AddedServices = ["svc-b"]
        };

        Mock<IUnifiedGoldenManifestReader> reader = new();
        reader
            .Setup(r => r.GetByVersionAsync(LeftVersion, It.IsAny<CancellationToken>()))
            .ReturnsAsync(left);
        reader
            .Setup(r => r.GetByVersionAsync(RightVersion, It.IsAny<CancellationToken>()))
            .ReturnsAsync(right);
        reader
            .Setup(r => r.GetByVersionAsync(ManifestVersion, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateManifest(ManifestVersion));
        reader
            .Setup(r => r.GetByVersionAsync(It.IsNotIn(LeftVersion, RightVersion, ManifestVersion),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((GoldenManifest?)null);

        Mock<IArchitectureApplicationService> architecture = new();
        architecture
            .Setup(s => s.GetManifestAsync(ManifestVersion, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateManifest(ManifestVersion));
        architecture
            .Setup(s => s.GetManifestAsync(It.IsNotIn(ManifestVersion), It.IsAny<CancellationToken>()))
            .ReturnsAsync((GoldenManifest?)null);

        Mock<IManifestDiffService> diffService = new();
        diffService.Setup(s => s.Compare(left, right)).Returns(diff);

        Mock<IManifestDiffSummaryFormatter> summaryFormatter = new();
        summaryFormatter
            .Setup(f => f.FormatMarkdown(diff))
            .Returns("# diff summary");

        Mock<IManifestDiffExportService> exportService = new();
        exportService
            .Setup(e => e.GenerateMarkdownExport(left, right, diff, "# diff summary"))
            .Returns("# export");

        Mock<IDiagramGenerator> diagramGenerator = new();
        diagramGenerator
            .Setup(g => g.GenerateMermaid(It.IsAny<GoldenManifest>()))
            .Returns("graph LR; A-->B");

        Mock<IManifestSummaryGenerator> summaryGenerator = new();
        summaryGenerator
            .Setup(g => g.GenerateMarkdown(It.IsAny<GoldenManifest>(), It.IsAny<AgentEvidencePackage?>()))
            .Returns("# evidence summary");

        Mock<IManifestSummaryService> manifestSummaryService = new();
        manifestSummaryService
            .Setup(s => s.GenerateMarkdown(It.IsAny<GoldenManifest>(), It.IsAny<ManifestSummaryOptions>()))
            .Returns("# markdown summary");

        Mock<IArchitectureExportService> architectureExport = new();
        architectureExport
            .Setup(e => e.GenerateMarkdownPackage(
                It.IsAny<GoldenManifest>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<AgentEvidencePackage?>()))
            .Returns("# package");

        Mock<IAgentEvidencePackageRepository> evidenceRepo = new();
        evidenceRepo
            .Setup(r => r.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AgentEvidencePackage?)null);

        Mock<IManifestDiagramService> diagramService = new();
        diagramService
            .Setup(s => s.GenerateMermaid(It.IsAny<GoldenManifest>(), It.IsAny<ManifestDiagramOptions>()))
            .Returns("graph TB; S-->D");

        return new ManifestsController(
                architectureService ?? architecture.Object,
                manifestReader ?? reader.Object,
                manifestDiffService ?? diffService.Object,
                summaryFormatter.Object,
                exportService.Object,
                diagramGenerator.Object,
                summaryGenerator.Object,
                manifestSummaryService.Object,
                architectureExport.Object,
                evidenceRepo.Object,
                diagramService.Object)
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
            };
    }

    [Fact]
    public async Task CompareManifests_returns_bad_request_when_left_version_missing()
    {
        ManifestsController controller = CreateController();

        IActionResult action =
            await controller.CompareManifests("", RightVersion, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task CompareManifests_returns_ok_with_diff_when_both_manifests_exist()
    {
        ManifestsController controller = CreateController();

        IActionResult action =
            await controller.CompareManifests(LeftVersion, RightVersion, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ArchLucid.Api.Models.ManifestCompareResponse body =
            ok.Value.Should().BeOfType<ArchLucid.Api.Models.ManifestCompareResponse>().Subject;
        body.Diff.AddedServices.Should().Contain("svc-b");
    }

    [Fact]
    public async Task GetManifest_returns_not_found_when_manifest_missing()
    {
        ManifestsController controller = CreateController();

        IActionResult action = await controller.GetManifest("missing", CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetManifest_returns_ok_when_manifest_exists()
    {
        ManifestsController controller = CreateController();

        IActionResult action = await controller.GetManifest(ManifestVersion, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        GoldenManifest body = ok.Value.Should().BeOfType<GoldenManifest>().Subject;
        body.Metadata.ManifestVersion.Should().Be(ManifestVersion);
    }

    [Fact]
    public async Task GetManifestSummary_returns_bad_request_for_unknown_format()
    {
        ManifestsController controller = CreateController();

        IActionResult action = await controller.GetManifestSummary(
            ManifestVersion,
            format: "xml",
            cancellationToken: CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task GetManifestSummary_returns_json_payload_when_format_json()
    {
        ManifestsController controller = CreateController();

        IActionResult action = await controller.GetManifestSummary(
            ManifestVersion,
            format: "json",
            cancellationToken: CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ManifestSummaryJsonResponse body = ok.Value.Should().BeOfType<ManifestSummaryJsonResponse>().Subject;
        body.ManifestVersion.Should().Be(ManifestVersion);
        body.SystemName.Should().Be("payments");
    }

    [Fact]
    public async Task GetManifestDiagramV2_returns_mermaid_content()
    {
        ManifestsController controller = CreateController();

        IActionResult action =
            await controller.GetManifestDiagramV2(ManifestVersion, cancellationToken: CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ManifestDiagramResponse body = ok.Value.Should().BeOfType<ManifestDiagramResponse>().Subject;
        body.Content.Should().Be("graph TB; S-->D");
    }
}
