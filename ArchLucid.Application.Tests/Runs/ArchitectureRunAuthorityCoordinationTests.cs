using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Application.Tests.TestDoubles;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Application.Runs.Orchestration;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Runs;

/// <summary>
/// Tests for <see cref="ArchitectureRunAuthorityCoordination"/>.
/// </summary>
[Trait("Suite", "Core")]
public sealed class ArchitectureRunAuthorityCoordinationTests
{
    [SkippableFact]
    public async Task CreateRun_Should_CreateRunAndStarterTasks_When_RequestIsValid()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "REQ-001",
            SystemName = "TestSystem",
            Description = "Design a secure Azure system."
        };

        Mock<IRunRepository> runRepo = new();
        runRepo.Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        });

        ArchitectureRunAuthorityCoordination service = new(
            new FakeAuthorityRunOrchestrator(),
            runRepo.Object,
            scopeProvider.Object,
            new NoOpAzureExtractorPackageRepository(),
            NullLogger<ArchitectureRunAuthorityCoordination>.Instance);

        CoordinationResult result = await service.CreateRunAsync(request);

        Assert.True(result.Success);
        Assert.NotNull(result.Run);
        Assert.Equal(4, result.Tasks.Count);
        Assert.Contains(result.Tasks, t => t.AgentType == AgentType.Topology);
        Assert.Contains(result.Tasks, t => t.AgentType == AgentType.Cost);
        Assert.Contains(result.Tasks, t => t.AgentType == AgentType.Compliance);
    }

    [Fact]
    public async Task CreateRun_WithExtractorProvenance_mergesCostObjectiveAndExtractorSource()

    {
        Guid runGuid = Guid.Parse("A1C3E50D904444E58B44CC1122334401");

        DateTime utc = DateTime.SpecifyKind(new DateTime(2026, 5, 6, 1, 2, 3), DateTimeKind.Utc);

        ArchitectureRequest request = new()
        {
            RequestId = "REQ-002",
            SystemName = "TestSystem",
            Description = "Design a secure Azure system.",
            RequiredCapabilities = ["Basic compute"],
        };

        Mock<IRunRepository> runRepo = new();

        runRepo.Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        Guid packageId = Guid.Parse("BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB");

        Mock<IAzureExtractorPackageRepository> extractorRepo = new();

        extractorRepo
            .Setup(r => r.TryGetLatestProvenanceByRunIdAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new AzureExtractorPackageProvenance
                {
                    PackageId = packageId,
                    SchemaVersion = 1,
                    CollectionTimestampUtc = utc,
                    CreatedUtc = utc,
                    SubscriptionId = "sub",
                    OriginalFileName = "a.zip",
                });

        Mock<IAuthorityRunOrchestrator> orchestrator = new();

        orchestrator
            .Setup(o =>
                o.ExecuteAsync(It.IsAny<ContextIngestionRequest>(), It.IsAny<CancellationToken>(), It.IsAny<string>()))
            .ReturnsAsync(
                new RunRecord
                {
                    RunId = runGuid,
                    ProjectId = "proj",
                    Description = "",
                    CreatedUtc = utc,
                    ContextSnapshotId = Guid.NewGuid(),
                    GraphSnapshotId = Guid.NewGuid(),
                    FindingsSnapshotId = Guid.NewGuid(),
                    GoldenManifestId = Guid.NewGuid(),
                    DecisionTraceId = Guid.NewGuid(),
                    ArtifactBundleId = Guid.NewGuid(),
                });

        Mock<IScopeContextProvider> scopeProvider = new();

        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        });

        ArchitectureRunAuthorityCoordination service = new(
            orchestrator.Object,
            runRepo.Object,
            scopeProvider.Object,
            extractorRepo.Object,
            NullLogger<ArchitectureRunAuthorityCoordination>.Instance);

        CoordinationResult result = await service.CreateRunAsync(request);

        Assert.True(result.Success);

        AgentTask? cost = result.Tasks.SingleOrDefault(t => t.AgentType == AgentType.Cost);

        Assert.NotNull(cost);

        Assert.Contains("Inventory citation:", cost.Objective, StringComparison.Ordinal);

        Assert.Contains("azure-extractor-zip", cost.AllowedSources, StringComparer.Ordinal);
    }
}
