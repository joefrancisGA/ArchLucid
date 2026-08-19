using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Alerts;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Advisory.Learning;
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
            learning.Object);

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
            learning.Object);

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
}
