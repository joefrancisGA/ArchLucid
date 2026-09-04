using ArchLucid.Application.Analysis;
using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Diagrams;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Summaries;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Manifest;
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
[Trait("Suite", "Core")]
public sealed class ManifestsControllerTests
{
    private const string LeftVersion = "v1";
    private const string RightVersion = "v2";
    private const string ManifestVersion = "golden-v1";

    private static readonly ScopeContext CallerScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

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
        IUnifiedGoldenManifestReader? manifestReader = null,
        IManifestDiffService? manifestDiffService = null,
        ITenantRepository? tenantRepository = null)
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

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(CallerScope);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(CallerScope, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext _, Guid runId, CancellationToken _) => new RunRecord
            {
                RunId = runId,
                TenantId = CallerScope.TenantId,
                WorkspaceId = CallerScope.WorkspaceId,
                ScopeProjectId = CallerScope.ProjectId,
                GoldenManifestId = Guid.NewGuid(),
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            });

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(q => q.GetRunDetailForManifestCompareAsync(
                CallerScope,
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext _, Guid runId, CancellationToken _) => new RunDetailDto
            {
                Run = new RunRecord { RunId = runId },
                GoldenManifest = new ManifestDocument
                {
                    RunId = runId,
                    CommittedArtifactInventory =
                    [
                        new ArchLucid.Core.Manifest.Sections.CommittedArtifactInventoryEntry
                        {
                            ArtifactName = "decision-trace",
                            ContentHashSha256 = "ABC123",
                        },
                    ],
                },
            });

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

        ITenantRepository tenantRepo = tenantRepository ?? tenants.Object;

        Mock<ICompareRunsApplicationFacade> compareFacade = new();
        compareFacade
            .Setup(f => f.CompareManifestVersionsAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string leftVersion, string rightVersion, CancellationToken _) =>
            {
                string normalizedLeft = leftVersion.Trim();
                string normalizedRight = rightVersion.Trim();

                if (normalizedLeft == LeftVersion && normalizedRight == RightVersion)
                {
                    return new VersionManifestCompareLoadResult
                    {
                        Outcome = ManifestCompareLoadOutcome.Success,
                        Left = left,
                        Right = right,
                    };
                }

                return new VersionManifestCompareLoadResult
                {
                    Outcome = ManifestCompareLoadOutcome.BaseManifestNotFound,
                    VersionLabel = normalizedLeft,
                };
            });

        return new ManifestsController(
                manifestReader ?? reader.Object,
                manifestDiffService ?? diffService.Object,
                summaryFormatter.Object,
                exportService.Object,
                diagramGenerator.Object,
                summaryGenerator.Object,
                manifestSummaryService.Object,
                architectureExport.Object,
                evidenceRepo.Object,
                diagramService.Object,
                scopeProvider.Object,
                runs.Object,
                authority.Object,
                Mock.Of<IManifestHashService>(),
                compareFacade.Object,
                tenantRepo)
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
    public async Task CompareManifests_returns_bad_request_when_left_version_exceeds_max_length()
    {
        string overlongLeftVersion = new string('v', GovernanceRequestValidationRules.ManifestVersionMaxLength + 1);
        ManifestsController controller = CreateController();

        IActionResult action =
            await controller.CompareManifests(overlongLeftVersion, RightVersion, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task CompareManifests_returns_bad_request_when_left_version_exceeds_max_length_and_tenant_missing()
    {
        string overlongLeftVersion = new string('v', GovernanceRequestValidationRules.ManifestVersionMaxLength + 1);
        ManifestsController controller = CreateController(tenantRepository: TenantMissingRepository());

        IActionResult action =
            await controller.CompareManifests(overlongLeftVersion, RightVersion, CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task GetManifest_returns_bad_request_when_manifest_version_exceeds_max_length()
    {
        string overlongVersion = new string('v', GovernanceRequestValidationRules.ManifestVersionMaxLength + 1);
        ManifestsController controller = CreateController();

        IActionResult action = await controller.GetManifest(overlongVersion, CancellationToken.None);

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
    public async Task CompareManifests_returns_ok_with_diff_when_query_params_are_padded()
    {
        string paddedLeftVersion = $"  {LeftVersion}  ";
        string paddedRightVersion = $"  {RightVersion}  ";
        ManifestsController controller = CreateController();

        IActionResult action = await controller.CompareManifests(
            paddedLeftVersion,
            paddedRightVersion,
            CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ArchLucid.Api.Models.ManifestCompareResponse body =
            ok.Value.Should().BeOfType<ArchLucid.Api.Models.ManifestCompareResponse>().Subject;
        body.LeftManifest.Metadata.ManifestVersion.Should().Be(LeftVersion);
        body.RightManifest.Metadata.ManifestVersion.Should().Be(RightVersion);
        body.Diff.AddedServices.Should().Contain("svc-b");
    }

    [Fact]
    public async Task CompareManifestsSummary_returns_trimmed_manifest_versions_when_query_params_are_padded()
    {
        string paddedLeftVersion = $"  {LeftVersion}  ";
        string paddedRightVersion = $"  {RightVersion}  ";
        ManifestsController controller = CreateController();

        IActionResult action = await controller.CompareManifestsSummary(
            paddedLeftVersion,
            paddedRightVersion,
            CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ArchLucid.Api.Models.ManifestCompareSummaryResponse body =
            ok.Value.Should().BeOfType<ArchLucid.Api.Models.ManifestCompareSummaryResponse>().Subject;
        body.LeftManifestVersion.Should().Be(LeftVersion);
        body.RightManifestVersion.Should().Be(RightVersion);
        body.Diff.LeftManifestVersion.Should().Be(LeftVersion);
        body.Diff.RightManifestVersion.Should().Be(RightVersion);
    }

    [Fact]
    public async Task CompareManifestsExport_returns_trimmed_manifest_versions_when_query_params_are_padded()
    {
        string paddedLeftVersion = $"  {LeftVersion}  ";
        string paddedRightVersion = $"  {RightVersion}  ";
        ManifestsController controller = CreateController();

        IActionResult action = await controller.CompareManifestsExport(
            paddedLeftVersion,
            paddedRightVersion,
            CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ArchLucid.Api.Models.ManifestCompareExportResponse body =
            ok.Value.Should().BeOfType<ArchLucid.Api.Models.ManifestCompareExportResponse>().Subject;
        body.LeftManifestVersion.Should().Be(LeftVersion);
        body.RightManifestVersion.Should().Be(RightVersion);
        body.FileName.Should().Be($"compare_{LeftVersion}_to_{RightVersion}.md");
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
    public async Task GetManifestSummary_returns_bad_request_when_max_relationships_is_zero()
    {
        ManifestsController controller = CreateController();

        IActionResult action = await controller.GetManifestSummary(
            ManifestVersion,
            maxRelationships: 0,
            cancellationToken: CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
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
    public async Task GetManifestSummary_returns_bad_request_when_max_relationships_is_zero_and_tenant_missing()
    {
        Mock<IUnifiedGoldenManifestReader> reader = new(MockBehavior.Strict);

        ManifestsController controller = CreateController(
            manifestReader: reader.Object,
            tenantRepository: TenantMissingRepository());

        IActionResult action = await controller.GetManifestSummary(
            ManifestVersion,
            maxRelationships: 0,
            cancellationToken: CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        reader.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetManifestSummary_returns_bad_request_for_unknown_format_and_tenant_missing()
    {
        Mock<IUnifiedGoldenManifestReader> reader = new(MockBehavior.Strict);

        ManifestsController controller = CreateController(
            manifestReader: reader.Object,
            tenantRepository: TenantMissingRepository());

        IActionResult action = await controller.GetManifestSummary(
            ManifestVersion,
            format: "xml",
            cancellationToken: CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        reader.VerifyNoOtherCalls();
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
    public async Task GetManifestSummary_json_caps_relationships_at_default_max_when_query_param_omitted()
    {
        GoldenManifest manifest = CreateManifest(ManifestVersion);

        for (int i = 0; i < ManifestSummaryLimits.MaxRelationships + 1; i++)
        {
            manifest.Relationships.Add(new ManifestRelationship
            {
                SourceId = $"svc-{i}",
                TargetId = $"ds-{i}",
                RelationshipType = RelationshipType.Calls,
            });
        }

        Mock<IUnifiedGoldenManifestReader> reader = new();
        reader
            .Setup(r => r.GetByVersionAsync(ManifestVersion, It.IsAny<CancellationToken>()))
            .ReturnsAsync(manifest);

        ManifestsController controller = CreateController(manifestReader: reader.Object);

        IActionResult action = await controller.GetManifestSummary(
            ManifestVersion,
            format: "json",
            cancellationToken: CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ManifestSummaryJsonResponse body = ok.Value.Should().BeOfType<ManifestSummaryJsonResponse>().Subject;
        body.RelationshipCount.Should().Be(ManifestSummaryLimits.MaxRelationships + 1);
        body.Relationships.Should().HaveCount(ManifestSummaryLimits.MaxRelationships);
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

    [Fact]
    public async Task GetManifestDiagramV2_returns_trimmed_manifest_version_when_route_is_padded()
    {
        string paddedManifestVersion = $"  {ManifestVersion}  ";
        ManifestsController controller = CreateController();

        IActionResult action = await controller.GetManifestDiagramV2(
            paddedManifestVersion,
            cancellationToken: CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ManifestDiagramResponse body = ok.Value.Should().BeOfType<ManifestDiagramResponse>().Subject;
        body.ManifestVersion.Should().Be(ManifestVersion);
    }

    [Fact]
    public async Task GetManifestExport_returns_trimmed_manifest_version_when_route_is_padded()
    {
        string paddedManifestVersion = $"  {ManifestVersion}  ";
        ManifestsController controller = CreateController();

        IActionResult action = await controller.GetManifestExport(paddedManifestVersion, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ArchLucid.Api.Models.ManifestExportContentResponse body =
            ok.Value.Should().BeOfType<ArchLucid.Api.Models.ManifestExportContentResponse>().Subject;
        body.ManifestVersion.Should().Be(ManifestVersion);
    }

    private static ITenantRepository TenantMissingRepository() =>
        Mock.Of<ITenantRepository>(repository => repository.GetByIdAsync(
            CallerScope.TenantId,
            It.IsAny<CancellationToken>()) == Task.FromResult<TenantRecord?>(null));
}
