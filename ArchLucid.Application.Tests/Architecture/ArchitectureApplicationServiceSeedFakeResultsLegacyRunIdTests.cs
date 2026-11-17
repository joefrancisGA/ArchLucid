using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Common;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureApplicationServiceSeedFakeResultsLegacyRunIdTests
{
    [Fact]
    public async Task CompareQuality_SeedFakeResultsAsync_skips_evidence_package_create_when_package_uses_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpper = canonicalRunId.ToUpperInvariant();

        ArchitectureRun run = new()
        {
            RunId = canonicalRunId,
            RequestId = "req-seed-fake",
            Status = ArchitectureRunStatus.TasksGenerated,
        };

        ArchitectureRequest request = new()
        {
            RequestId = "req-seed-fake",
            Description = "Seed fake results test",
            SystemName = "TestSystem",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
        };

        List<AgentTask> tasks =
        [
            new()
            {
                TaskId = "task-topology",
                RunId = canonicalRunId,
                AgentType = AgentType.Topology,
                Status = AgentTaskStatus.Created,
            },
            new()
            {
                TaskId = "task-cost",
                RunId = canonicalRunId,
                AgentType = AgentType.Cost,
                Status = AgentTaskStatus.Created,
            },
            new()
            {
                TaskId = "task-compliance",
                RunId = canonicalRunId,
                AgentType = AgentType.Compliance,
                Status = AgentTaskStatus.Created,
            },
            new()
            {
                TaskId = "task-critic",
                RunId = canonicalRunId,
                AgentType = AgentType.Critic,
                Status = AgentTaskStatus.Created,
            },
        ];

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(service => service.GetRunDetailAsync(canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail
            {
                Run = run,
                Tasks = tasks,
                Results = [],
            });

        Mock<IArchitectureRequestRepository> requestRepository = new();
        requestRepository
            .Setup(repository => repository.GetByIdAsync(request.RequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);

        AgentEvidencePackage legacyPackage = new()
        {
            EvidencePackageId = "pkg-legacy-seed",
            RunId = legacyUpper,
            RequestId = request.RequestId,
            SystemName = request.SystemName,
            Environment = request.Environment,
            CloudProvider = request.CloudProvider.ToString(),
            CreatedUtc = DateTime.UtcNow,
        };

        Mock<IAgentEvidencePackageRepository> evidencePackages = new();
        evidencePackages
            .Setup(repository => repository.GetByRunIdAsync(canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(legacyPackage);
        evidencePackages
            .Setup(repository => repository.GetByRunIdAsync(
                It.Is<string>(id => id != canonicalRunId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((AgentEvidencePackage?)null);

        Mock<IEvidenceBuilder> evidenceBuilder = new();
        evidenceBuilder
            .Setup(builder => builder.BuildAsync(It.IsAny<string>(), It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AgentEvidencePackage { EvidencePackageId = "should-not-build" });

        Mock<IAgentResultRepository> results = new();
        results
            .Setup(repository => repository.CreateManyAsync(It.IsAny<IReadOnlyList<AgentResult>>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        });

        Mock<IAgentArchitectureFindingConfidenceEnricher> enricher = new();
        enricher
            .Setup(e => e.TryEnrichRunAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ArchitectureApplicationService sut = new(
            runDetail.Object,
            results.Object,
            Mock.Of<IUnifiedGoldenManifestReader>(),
            requestRepository.Object,
            evidencePackages.Object,
            evidenceBuilder.Object,
            ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory(),
            Mock.Of<IRunRepository>(),
            scopeProvider.Object,
            new ConfigurationBuilder().Build(),
            Mock.Of<IAuditService>(),
            Mock.Of<IActorContext>(),
            enricher.Object,
            new RunStateTransitionService(),
            Mock.Of<ILogger<ArchitectureApplicationService>>());

        SeedFakeResultsResult seedResult = await sut.SeedFakeResultsAsync(canonicalRunId);

        seedResult.Success.Should().BeTrue();
        seedResult.ResultCount.Should().Be(4);
        evidencePackages.Verify(
            repository => repository.CreateAsync(It.IsAny<AgentEvidencePackage>(), It.IsAny<CancellationToken>()),
            Times.Never);
        evidenceBuilder.Verify(
            builder => builder.BuildAsync(It.IsAny<string>(), It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
