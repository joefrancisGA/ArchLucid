using System.Security.Claims;

using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Models.Runs;
using ArchLucid.Api.Support;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Findings.FindingVerification;
using ArchLucid.Application.Runs;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Coordination.Compare;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
/// FND-010 consumer adoption: page bundles must check architecture sharing
/// before protected run reads, and verify a pinned manifest before launching
/// manifest-derived artifact queries.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunDetailPageBundleShareAccessTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid ManifestId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    [Theory]
    [InlineData("critical")]
    [InlineData("timelines")]
    [InlineData("workspace")]
    public async Task Restricted_run_is_denied_before_any_page_bundle_data_read(string action)
    {
        Harness h = new();
        h.DenyRun(RunId);

        IActionResult result = action switch
        {
            "critical" => await h.Controller().GetCriticalPageBundle(RunId, CancellationToken.None),
            "timelines" => await h.Controller().GetTimelinesBundle(RunId, CancellationToken.None),
            "workspace" => await h.Controller().GetWorkspaceContextBundle(RunId, CancellationToken.None),
            _ => throw new InvalidOperationException(action),
        };

        result.Should().BeOfType<NotFoundResult>();
        h.Gate.Verify(g => g.EnsureRunReadAllowedAsync(
            It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(),
            Scope, RunId, It.IsAny<CancellationToken>()), Times.Once);
        h.Query.VerifyNoOtherCalls();
        h.Artifacts.VerifyNoOtherCalls();
        h.Verification.VerifyNoOtherCalls();
        h.Timeline.VerifyNoOtherCalls();
        h.RunRepository.VerifyNoOtherCalls();
        h.StageRepository.VerifyNoOtherCalls();
        h.PairFacade.VerifyNoOtherCalls();
        h.Compare.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Critical_bundle_missing_pinned_summary_fails_before_artifact_fanout()
    {
        Harness h = new();
        h.AllowRun(RunId);
        h.SetupBuyerDetail(ManifestId);
        h.Query.Setup(q => q.GetManifestSummaryAsync(
                Scope, ManifestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ManifestSummaryDto?)null);
        h.Query.Setup(q => q.GetRunDetailForManifestCompareAsync(
                Scope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunDetailDto?)null);

        IActionResult result = await h.Controller().GetCriticalPageBundle(RunId, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode
            .Should().Be(StatusCodes.Status409Conflict);
        h.Artifacts.VerifyNoOtherCalls();
        h.Verification.VerifyNoOtherCalls();
        h.Hash.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Critical_bundle_current_manifest_is_sealed_before_artifact_reads()
    {
        Harness h = new();
        h.AllowRun(RunId);
        h.SetupBuyerDetail(ManifestId);
        h.SetupPinnedManifest(ManifestId);
        h.SetupCriticalFanout(ManifestId);

        IActionResult response = await h.Controller().GetCriticalPageBundle(RunId, CancellationToken.None);

        RunDetailCriticalPageBundleResponse body = response.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeOfType<RunDetailCriticalPageBundleResponse>().Subject;
        body.BuyerSummary.Run.RunId.Should().Be(RunId);
        body.ManifestSummary.Should().NotBeNull();
        body.ManifestSummary!.ManifestId.Should().Be(ManifestId);
        h.Hash.Verify(x => x.ComputeHash(It.IsAny<ManifestDocument>()), Times.Once);
        h.Artifacts.Verify(x => x.ListArtifactsByManifestIdAsync(
            Scope, ManifestId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Critical_bundle_inconsistent_pinned_run_link_fails_before_artifact_reads()
    {
        Harness h = new();
        h.AllowRun(RunId);
        h.SetupBuyerDetail(ManifestId);
        h.SetupPinnedManifest(ManifestId, pinnedId: Guid.NewGuid());

        IActionResult response = await h.Controller().GetCriticalPageBundle(RunId, CancellationToken.None);

        response.Should().BeOfType<ObjectResult>().Which.StatusCode
            .Should().Be(StatusCodes.Status409Conflict);
        h.Artifacts.VerifyNoOtherCalls();
        h.Verification.VerifyNoOtherCalls();
        h.Hash.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Workspace_bundle_omits_restricted_project_runs_with_one_decision_per_architecture()
    {
        Harness h = new();
        h.AllowRun(RunId);
        Guid restrictedArchitecture = Guid.NewGuid();
        Guid visibleArchitecture = Guid.NewGuid();
        Guid firstRestricted = Guid.NewGuid();
        Guid secondRestricted = Guid.NewGuid();
        Guid visibleRun = Guid.NewGuid();
        h.SetupWorkspace(
            [
                Summary(RunId),
                Summary(firstRestricted, restrictedArchitecture),
                Summary(secondRestricted, restrictedArchitecture),
                Summary(visibleRun, visibleArchitecture),
                Summary(Guid.NewGuid()),
            ],
            prior: null);
        h.Gate.Setup(g => g.EnsureArchitectureReadAllowedAsync(
                It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(),
                Scope, restrictedArchitecture, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new NotFoundResult());
        h.Gate.Setup(g => g.EnsureArchitectureReadAllowedAsync(
                It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(),
                Scope, visibleArchitecture, It.IsAny<CancellationToken>()))
            .ReturnsAsync((IActionResult?)null);

        IActionResult response = await h.Controller().GetWorkspaceContextBundle(RunId, CancellationToken.None);

        RunDetailWorkspaceContextBundleResponse body = response.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeOfType<RunDetailWorkspaceContextBundleResponse>().Subject;
        body.RecentProjectRuns.Select(x => x.RunId)
            .Should().Contain(visibleRun)
            .And.NotContain(firstRestricted)
            .And.NotContain(secondRestricted);
        h.Gate.Verify(g => g.EnsureArchitectureReadAllowedAsync(
            It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(),
            Scope, restrictedArchitecture, It.IsAny<CancellationToken>()), Times.Once);
        h.Gate.Verify(g => g.EnsureArchitectureReadAllowedAsync(
            It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(),
            Scope, visibleArchitecture, It.IsAny<CancellationToken>()), Times.Once);
        h.PairFacade.VerifyNoOtherCalls();
        h.Compare.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Workspace_bundle_denied_prior_run_never_loads_comparison_or_exposes_prior_id()
    {
        Harness h = new();
        h.AllowRun(RunId);
        Guid priorRunId = Guid.NewGuid();
        h.DenyRun(priorRunId);
        h.SetupWorkspace([Summary(RunId)], Summary(priorRunId));

        IActionResult response = await h.Controller().GetWorkspaceContextBundle(RunId, CancellationToken.None);

        RunDetailWorkspaceContextBundleResponse body = response.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeOfType<RunDetailWorkspaceContextBundleResponse>().Subject;
        body.PriorCommittedRunId.Should().BeNull();
        body.PriorCommittedRunComparison.Should().BeNull();
        h.Gate.Verify(g => g.EnsureRunReadAllowedAsync(
            It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(),
            Scope, priorRunId, It.IsAny<CancellationToken>()), Times.Once);
        h.PairFacade.VerifyNoOtherCalls();
        h.Compare.VerifyNoOtherCalls();
    }

    private static RunSummaryDto Summary(Guid id, Guid? architectureId = null) => new()
    {
        RunId = id,
        ArchitectureId = architectureId,
        ProjectId = "project",
        CreatedUtc = DateTime.UnixEpoch,
    };

    private sealed class Harness
    {
        internal readonly Mock<IAuthorityQueryService> Query = new(MockBehavior.Strict);
        internal readonly Mock<IArchitectureShareAccessGate> Gate = new(MockBehavior.Strict);
        internal readonly Mock<IArtifactQueryService> Artifacts = new(MockBehavior.Strict);
        internal readonly Mock<IFindingVerificationReportQueryService> Verification = new(MockBehavior.Strict);
        internal readonly Mock<IRunPipelineAuditTimelineService> Timeline = new(MockBehavior.Strict);
        internal readonly Mock<IRunRepository> RunRepository = new(MockBehavior.Strict);
        internal readonly Mock<IRunStageOutcomesRepository> StageRepository = new(MockBehavior.Strict);
        internal readonly Mock<IAuthorityCompareService> Compare = new(MockBehavior.Strict);
        internal readonly Mock<ICompareRunsApplicationFacade> PairFacade = new(MockBehavior.Strict);
        internal readonly Mock<IManifestHashService> Hash = new(MockBehavior.Strict);
        private readonly Mock<IScopeContextProvider> scopes = new(MockBehavior.Strict);
        private readonly Mock<IAuthorityRunDetailOperatorEnricher> enricher = new(MockBehavior.Strict);
        private readonly Mock<IEffectiveAgentExecutionModeAccessor> executionMode = new(MockBehavior.Strict);

        internal Harness()
        {
            scopes.Setup(x => x.GetCurrentScope()).Returns(Scope);
            executionMode.Setup(x => x.GetEffectiveMode()).Returns("Simulator");
            enricher.Setup(x => x.EnrichBuyerSummaryAsync(
                    It.IsAny<RunDetailDto>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);
        }

        internal void AllowRun(Guid runId) => Gate.Setup(g => g.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(),
                Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((IActionResult?)null);

        internal void DenyRun(Guid runId) => Gate.Setup(g => g.EnsureRunReadAllowedAsync(
                It.IsAny<ControllerBase>(), It.IsAny<ClaimsPrincipal>(),
                Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new NotFoundResult());

        internal void SetupBuyerDetail(Guid? pinnedManifestId)
        {
            Query.Setup(q => q.GetRunDetailForBuyerSummaryAsync(
                    Scope, RunId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new RunDetailDto
                {
                    Run = new RunRecord
                    {
                        RunId = RunId,
                        ProjectId = "project",
                        GoldenManifestId = pinnedManifestId,
                    }
                });
        }

        internal void SetupPinnedManifest(Guid manifestId, Guid? pinnedId = null)
        {
            Guid storedId = pinnedId ?? manifestId;
            Query.Setup(q => q.GetManifestSummaryAsync(
                    Scope, manifestId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ManifestSummaryDto
                {
                    ManifestId = manifestId,
                    RunId = RunId,
                    ManifestHash = "sealed-good",
                    RuleSetId = "test",
                    RuleSetVersion = "1",
                    Status = "Committed",
                });
            Query.Setup(q => q.GetRunDetailForManifestCompareAsync(
                    Scope, RunId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new RunDetailDto
                {
                    Run = new RunRecord { RunId = RunId, GoldenManifestId = storedId },
                    GoldenManifest = new ManifestDocument
                    {
                        ManifestId = manifestId,
                        RunId = RunId,
                        TenantId = Scope.TenantId,
                        WorkspaceId = Scope.WorkspaceId,
                        ProjectId = Scope.ProjectId,
                        ManifestHash = "sealed-good",
                    },
                });
            Hash.Setup(h => h.ComputeHash(It.IsAny<ManifestDocument>())).Returns("sealed-good");
        }

        internal void SetupCriticalFanout(Guid manifestId)
        {
            Query.Setup(q => q.GetRunSummaryAsync(
                    Scope, RunId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(Summary(RunId));
            Artifacts.Setup(a => a.ListArtifactsByManifestIdAsync(
                    Scope, manifestId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(Array.Empty<ArtifactDescriptor>());
            Verification.Setup(a => a.ListArtifactDescriptorsByRunAsync(
                    Scope, RunId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(Array.Empty<ArtifactDescriptor>());
        }

        internal void SetupWorkspace(
            IReadOnlyList<RunSummaryDto> candidates,
            RunSummaryDto? prior)
        {
            Query.Setup(q => q.GetRunDetailAsync(
                    Scope, RunId, It.IsAny<CancellationToken>(), It.IsAny<bool>()))
                .ReturnsAsync(new RunDetailDto { Run = new RunRecord { RunId = RunId } });
            Query.Setup(q => q.GetRunSummaryAsync(
                    Scope, RunId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(Summary(RunId));
            Query.Setup(q => q.ListRunsByProjectAsync(
                    Scope, "project", 60, It.IsAny<CancellationToken>()))
                .ReturnsAsync(candidates);
            Query.Setup(q => q.GetPriorCommittedRunSummaryBeforeCurrentAsync(
                    Scope, RunId, "project", DateTime.UnixEpoch, It.IsAny<CancellationToken>()))
                .ReturnsAsync(prior);
        }

        internal RunDetailPageBundleController Controller() => new(
            Query.Object,
            enricher.Object,
            Artifacts.Object,
            Verification.Object,
            Timeline.Object,
            RunRepository.Object,
            StageRepository.Object,
            Compare.Object,
            PairFacade.Object,
            scopes.Object,
            Hash.Object,
            new ConfigurationBuilder().Build(),
            executionMode.Object,
            Gate.Object,
            Mock.Of<ILogger<RunDetailPageBundleController>>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
    }
}
