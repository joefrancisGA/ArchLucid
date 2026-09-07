using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Alerts;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Advisory.Learning;
using ArchLucid.Decisioning.Advisory.Models;
using ArchLucid.Decisioning.Advisory.Services;
using ArchLucid.Decisioning.Advisory.Workflow;
using ArchLucid.Persistence.Alerts.Simulation;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Persistence.Tests.Alerts;

[Trait("Category", "Unit")]
public sealed class AlertSimulationContextProviderTests
{
    private static IManifestHashService CreateSealedManifestHashMock()
    {
        Mock<IManifestHashService> manifestHash = new();
        manifestHash.Setup(m => m.ComputeHash(It.IsAny<ManifestDocument>())).Returns("sealed-hash");

        return manifestHash.Object;
    }

    [SkippableFact]
    public async Task GetContextsAsync_when_run_has_no_manifest_returns_empty()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(a => a.GetRunDetailAsync(
                It.IsAny<ScopeContext>(),
                runId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord
                {
                    RunId = runId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = projectId
                },
                GoldenManifest = null
            });

        Mock<IImprovementAdvisorService> advisor = new();
        Mock<IComparisonService> comparison = new();
        Mock<IRecommendationRepository> recommendations = new();
        Mock<IRecommendationLearningService> learning = new();

        AlertSimulationContextProvider provider = new(
            authority.Object,
            advisor.Object,
            comparison.Object,
            recommendations.Object,
            learning.Object,
            CreateSealedManifestHashMock());

        IReadOnlyList<AlertEvaluationContext> contexts = await provider.GetContextsAsync(
            tenantId,
            workspaceId,
            projectId,
            runId,
            null,
            5,
            "default",
            CancellationToken.None);

        contexts.Should().BeEmpty();
        advisor.Verify(
            a => a.GeneratePlanAsync(
                It.IsAny<ManifestDocument>(),
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        advisor.Verify(
            a => a.GeneratePlanAsync(
                It.IsAny<ManifestDocument>(),
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<ComparisonResult>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetContextsAsync_when_authority_returns_foreign_tenant_run_returns_empty()
    {
        Guid callerTenantId = Guid.NewGuid();
        Guid foreignTenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(a => a.GetRunDetailAsync(
                It.IsAny<ScopeContext>(),
                runId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord
                {
                    RunId = runId,
                    TenantId = foreignTenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = projectId
                },
                GoldenManifest = new ManifestDocument
                {
                    RunId = runId,
                    FindingsSnapshotId = Guid.NewGuid(),
                    CreatedUtc = DateTime.UtcNow
                },
                FindingsSnapshot = new FindingsSnapshot
                {
                    RunId = runId,
                    FindingsSnapshotId = Guid.NewGuid(),
                    Findings =
                    [
                        new Finding
                        {
                            FindingId = "foreign-finding",
                            Title = "Should not enter caller simulation context",
                        }
                    ]
                }
            });

        Mock<IImprovementAdvisorService> advisor = new();
        Mock<IComparisonService> comparison = new();
        Mock<IRecommendationRepository> recommendations = new();
        Mock<IRecommendationLearningService> learning = new();

        AlertSimulationContextProvider provider = new(
            authority.Object,
            advisor.Object,
            comparison.Object,
            recommendations.Object,
            learning.Object,
            CreateSealedManifestHashMock());

        IReadOnlyList<AlertEvaluationContext> contexts = await provider.GetContextsAsync(
            callerTenantId,
            workspaceId,
            projectId,
            runId,
            null,
            5,
            "default",
            CancellationToken.None);

        contexts.Should().BeEmpty();
        advisor.Verify(
            a => a.GeneratePlanAsync(
                It.IsAny<ManifestDocument>(),
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetContextsAsync_when_authority_returns_foreign_workspace_run_returns_empty()
    {
        Guid tenantId = Guid.NewGuid();
        Guid callerWorkspaceId = Guid.NewGuid();
        Guid foreignWorkspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(a => a.GetRunDetailAsync(
                It.IsAny<ScopeContext>(),
                runId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord
                {
                    RunId = runId,
                    TenantId = tenantId,
                    WorkspaceId = foreignWorkspaceId,
                    ScopeProjectId = projectId
                },
                GoldenManifest = new ManifestDocument
                {
                    RunId = runId,
                    FindingsSnapshotId = Guid.NewGuid(),
                    CreatedUtc = DateTime.UtcNow
                },
                FindingsSnapshot = new FindingsSnapshot
                {
                    RunId = runId,
                    FindingsSnapshotId = Guid.NewGuid(),
                    Findings =
                    [
                        new Finding
                        {
                            FindingId = "foreign-workspace-finding",
                            Title = "Should not enter caller simulation context",
                        }
                    ]
                }
            });

        Mock<IImprovementAdvisorService> advisor = new();
        Mock<IComparisonService> comparison = new();
        Mock<IRecommendationRepository> recommendations = new();
        Mock<IRecommendationLearningService> learning = new();

        AlertSimulationContextProvider provider = new(
            authority.Object,
            advisor.Object,
            comparison.Object,
            recommendations.Object,
            learning.Object,
            CreateSealedManifestHashMock());

        IReadOnlyList<AlertEvaluationContext> contexts = await provider.GetContextsAsync(
            tenantId,
            callerWorkspaceId,
            projectId,
            runId,
            null,
            5,
            "default",
            CancellationToken.None);

        contexts.Should().BeEmpty();
        advisor.Verify(
            a => a.GeneratePlanAsync(
                It.IsAny<ManifestDocument>(),
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetContextsAsync_when_findings_snapshot_run_id_empty_returns_empty()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(a => a.GetRunDetailAsync(
                It.IsAny<ScopeContext>(),
                runId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord
                {
                    RunId = runId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = projectId
                },
                GoldenManifest = new ManifestDocument
                {
                    RunId = runId,
                    FindingsSnapshotId = Guid.NewGuid(),
                    CreatedUtc = DateTime.UtcNow,
                    ManifestHash = "sealed-hash",
                },
                FindingsSnapshot = new FindingsSnapshot
                {
                    RunId = Guid.Empty,
                    FindingsSnapshotId = Guid.NewGuid(),
                    Findings =
                    [
                        new Finding
                        {
                            FindingId = "unscoped-finding",
                            Title = "Should not enter caller simulation context",
                        }
                    ]
                }
            });

        Mock<IImprovementAdvisorService> advisor = new();
        Mock<IComparisonService> comparison = new();
        Mock<IRecommendationRepository> recommendations = new();
        Mock<IRecommendationLearningService> learning = new();

        AlertSimulationContextProvider provider = new(
            authority.Object,
            advisor.Object,
            comparison.Object,
            recommendations.Object,
            learning.Object,
            CreateSealedManifestHashMock());

        IReadOnlyList<AlertEvaluationContext> contexts = await provider.GetContextsAsync(
            tenantId,
            workspaceId,
            projectId,
            runId,
            null,
            5,
            "default",
            CancellationToken.None);

        contexts.Should().BeEmpty();
        advisor.Verify(
            a => a.GeneratePlanAsync(
                It.IsAny<ManifestDocument>(),
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetContextsAsync_when_findings_snapshot_id_mismatches_golden_manifest_returns_empty()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid manifestFindingsSnapshotId = Guid.NewGuid();
        Guid foreignFindingsSnapshotId = Guid.NewGuid();

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(a => a.GetRunDetailAsync(
                It.IsAny<ScopeContext>(),
                runId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord
                {
                    RunId = runId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = projectId
                },
                GoldenManifest = new ManifestDocument
                {
                    RunId = runId,
                    FindingsSnapshotId = manifestFindingsSnapshotId,
                    CreatedUtc = DateTime.UtcNow,
                    ManifestHash = "sealed-hash",
                },
                FindingsSnapshot = new FindingsSnapshot
                {
                    RunId = runId,
                    FindingsSnapshotId = foreignFindingsSnapshotId,
                    Findings =
                    [
                        new Finding
                        {
                            FindingId = "cross-linked-finding",
                            Title = "Should not enter caller simulation context",
                        }
                    ]
                }
            });

        Mock<IImprovementAdvisorService> advisor = new();
        Mock<IComparisonService> comparison = new();
        Mock<IRecommendationRepository> recommendations = new();
        Mock<IRecommendationLearningService> learning = new();

        AlertSimulationContextProvider provider = new(
            authority.Object,
            advisor.Object,
            comparison.Object,
            recommendations.Object,
            learning.Object,
            CreateSealedManifestHashMock());

        IReadOnlyList<AlertEvaluationContext> contexts = await provider.GetContextsAsync(
            tenantId,
            workspaceId,
            projectId,
            runId,
            null,
            5,
            "default",
            CancellationToken.None);

        contexts.Should().BeEmpty();
        advisor.Verify(
            a => a.GeneratePlanAsync(
                It.IsAny<ManifestDocument>(),
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetContextsAsync_when_golden_manifest_run_id_mismatches_requested_run_returns_empty()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid manifestRunId = Guid.NewGuid();

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(a => a.GetRunDetailAsync(
                It.IsAny<ScopeContext>(),
                runId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord
                {
                    RunId = runId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = projectId
                },
                GoldenManifest = new ManifestDocument
                {
                    RunId = manifestRunId,
                    FindingsSnapshotId = Guid.NewGuid(),
                    CreatedUtc = DateTime.UtcNow
                },
                FindingsSnapshot = new FindingsSnapshot
                {
                    RunId = manifestRunId,
                    FindingsSnapshotId = Guid.NewGuid(),
                    Findings = []
                }
            });

        Mock<IImprovementAdvisorService> advisor = new();
        Mock<IComparisonService> comparison = new();
        Mock<IRecommendationRepository> recommendations = new();
        Mock<IRecommendationLearningService> learning = new();

        AlertSimulationContextProvider provider = new(
            authority.Object,
            advisor.Object,
            comparison.Object,
            recommendations.Object,
            learning.Object,
            CreateSealedManifestHashMock());

        IReadOnlyList<AlertEvaluationContext> contexts = await provider.GetContextsAsync(
            tenantId,
            workspaceId,
            projectId,
            runId,
            null,
            5,
            "default",
            CancellationToken.None);

        contexts.Should().BeEmpty();
        advisor.Verify(
            a => a.GeneratePlanAsync(
                It.IsAny<ManifestDocument>(),
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetContextsAsync_when_compared_to_findings_snapshot_mismatches_compares_manifests_only_with_primary_findings()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid comparedToRunId = Guid.NewGuid();
        Guid primaryFindingsSnapshotId = Guid.NewGuid();
        Guid comparedManifestFindingsSnapshotId = Guid.NewGuid();
        Guid foreignComparedFindingsSnapshotId = Guid.NewGuid();

        ManifestDocument primaryManifest = new()
        {
            RunId = runId,
            FindingsSnapshotId = primaryFindingsSnapshotId,
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            ManifestHash = "sealed-hash",
        };

        FindingsSnapshot primaryFindings = new()
        {
            RunId = runId,
            FindingsSnapshotId = primaryFindingsSnapshotId,
            ContextSnapshotId = primaryManifest.ContextSnapshotId,
            GraphSnapshotId = primaryManifest.GraphSnapshotId,
            Findings =
            [
                new Finding
                {
                    FindingId = "primary-finding",
                    Title = "Primary run finding",
                }
            ]
        };

        ManifestDocument comparedManifest = new()
        {
            RunId = comparedToRunId,
            FindingsSnapshotId = comparedManifestFindingsSnapshotId,
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            ManifestHash = "sealed-hash",
        };

        FindingsSnapshot comparedFindingsWithMismatchedSnapshotId = new()
        {
            RunId = comparedToRunId,
            FindingsSnapshotId = foreignComparedFindingsSnapshotId,
            Findings =
            [
                new Finding
                {
                    FindingId = "compared-foreign-finding",
                    Title = "Compared run findings are not passed to the advisor",
                }
            ]
        };

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(a => a.GetRunDetailAsync(
                It.IsAny<ScopeContext>(),
                runId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord
                {
                    RunId = runId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = projectId
                },
                GoldenManifest = primaryManifest,
                FindingsSnapshot = primaryFindings
            });

        authority
            .Setup(a => a.GetRunDetailAsync(
                It.IsAny<ScopeContext>(),
                comparedToRunId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord
                {
                    RunId = comparedToRunId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = projectId
                },
                GoldenManifest = comparedManifest,
                FindingsSnapshot = comparedFindingsWithMismatchedSnapshotId
            });

        ComparisonResult comparisonResult = new()
        {
            BaseRunId = comparedToRunId,
            TargetRunId = runId,
        };

        FindingsSnapshot? capturedFindings = null;

        Mock<ArchLucid.Core.Persistence.Ports.IImprovementAdvisorService> advisor = new();
        advisor
            .Setup(a => a.GeneratePlanAsync(
                It.IsAny<ManifestDocument>(),
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<ComparisonResult>(),
                It.IsAny<CancellationToken>()))
            .Callback<ManifestDocument, FindingsSnapshot, ComparisonResult, CancellationToken>(
                (_, findings, _, _) => capturedFindings = findings)
            .ReturnsAsync(new ArchLucid.Contracts.Advisory.Models.ImprovementPlan());

        Mock<IComparisonService> comparison = new();
        comparison
            .Setup(c => c.Compare(comparedManifest, primaryManifest))
            .Returns(comparisonResult);

        Mock<IRecommendationRepository> recommendations = new();
        recommendations
            .Setup(r => r.ListByRunAsync(tenantId, workspaceId, projectId, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<RecommendationRecord>());

        Mock<IRecommendationLearningService> learning = new();
        learning
            .Setup(l => l.GetLatestProfileAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RecommendationLearningProfile?)null);

        AlertSimulationContextProvider provider = new(
            authority.Object,
            advisor.Object,
            comparison.Object,
            recommendations.Object,
            learning.Object,
            CreateSealedManifestHashMock());

        IReadOnlyList<AlertEvaluationContext> contexts = await provider.GetContextsAsync(
            tenantId,
            workspaceId,
            projectId,
            runId,
            comparedToRunId,
            5,
            "default",
            CancellationToken.None);

        contexts.Should().ContainSingle();
        contexts[0].ComparedToRunId.Should().Be(comparedToRunId);
        comparison.Verify(c => c.Compare(comparedManifest, primaryManifest), Times.Once);
        advisor.Verify(
            a => a.GeneratePlanAsync(
                It.IsAny<ManifestDocument>(),
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<ComparisonResult>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
        advisor.Verify(
            a => a.GeneratePlanAsync(
                It.IsAny<ManifestDocument>(),
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        capturedFindings.Should().NotBeNull();
        capturedFindings!.FindingsSnapshotId.Should().Be(primaryFindingsSnapshotId);
        capturedFindings.Findings.Should().ContainSingle(f => f.FindingId == "primary-finding");
    }

    [Fact]
    public async Task GetContextsAsync_recent_run_batch_skips_runs_with_sealed_hash_failure_without_throwing()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid badHashRunId = Guid.NewGuid();
        Guid goodHashRunId = Guid.NewGuid();
        Guid badFindingsSnapshotId = Guid.NewGuid();
        Guid goodFindingsSnapshotId = Guid.NewGuid();
        Guid badContextSnapshotId = Guid.NewGuid();
        Guid badGraphSnapshotId = Guid.NewGuid();
        Guid goodContextSnapshotId = Guid.NewGuid();
        Guid goodGraphSnapshotId = Guid.NewGuid();

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(a => a.ListRunsByProjectAsync(
                It.IsAny<ScopeContext>(),
                "default",
                2,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RunSummaryDto { RunId = badHashRunId, CreatedUtc = DateTime.UtcNow.AddHours(-1) },
                new RunSummaryDto { RunId = goodHashRunId, CreatedUtc = DateTime.UtcNow },
            ]);

        authority
            .Setup(a => a.GetRunDetailAsync(
                It.IsAny<ScopeContext>(),
                badHashRunId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord
                {
                    RunId = badHashRunId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = projectId
                },
                GoldenManifest = new ManifestDocument
                {
                    RunId = badHashRunId,
                    FindingsSnapshotId = badFindingsSnapshotId,
                    ContextSnapshotId = badContextSnapshotId,
                    GraphSnapshotId = badGraphSnapshotId,
                    CreatedUtc = DateTime.UtcNow,
                    ManifestHash = "tampered-hash",
                },
                FindingsSnapshot = new FindingsSnapshot
                {
                    RunId = badHashRunId,
                    FindingsSnapshotId = badFindingsSnapshotId,
                    ContextSnapshotId = badContextSnapshotId,
                    GraphSnapshotId = badGraphSnapshotId,
                    Findings = []
                }
            });

        authority
            .Setup(a => a.GetRunDetailAsync(
                It.IsAny<ScopeContext>(),
                goodHashRunId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord
                {
                    RunId = goodHashRunId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = projectId
                },
                GoldenManifest = new ManifestDocument
                {
                    RunId = goodHashRunId,
                    FindingsSnapshotId = goodFindingsSnapshotId,
                    ContextSnapshotId = goodContextSnapshotId,
                    GraphSnapshotId = goodGraphSnapshotId,
                    CreatedUtc = DateTime.UtcNow,
                    ManifestHash = "sealed-hash",
                },
                FindingsSnapshot = new FindingsSnapshot
                {
                    RunId = goodHashRunId,
                    FindingsSnapshotId = goodFindingsSnapshotId,
                    ContextSnapshotId = goodContextSnapshotId,
                    GraphSnapshotId = goodGraphSnapshotId,
                    Findings = []
                }
            });

        Mock<IImprovementAdvisorService> advisor = new();
        advisor
            .Setup(a => a.GeneratePlanAsync(
                It.IsAny<ManifestDocument>(),
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ImprovementPlan());

        Mock<IComparisonService> comparison = new();
        Mock<IRecommendationRepository> recommendations = new();
        recommendations
            .Setup(r => r.ListByRunAsync(
                tenantId,
                workspaceId,
                projectId,
                goodHashRunId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<RecommendationRecord>());

        Mock<IRecommendationLearningService> learning = new();

        AlertSimulationContextProvider provider = new(
            authority.Object,
            advisor.Object,
            comparison.Object,
            recommendations.Object,
            learning.Object,
            CreateSealedManifestHashMock());

        IReadOnlyList<AlertEvaluationContext> contexts = await provider.GetContextsAsync(
            tenantId,
            workspaceId,
            projectId,
            runId: null,
            comparedToRunId: null,
            recentRunCount: 2,
            runProjectSlug: "default",
            CancellationToken.None);

        contexts.Should().ContainSingle();
        contexts[0].RunId.Should().Be(goodHashRunId);
    }
}
