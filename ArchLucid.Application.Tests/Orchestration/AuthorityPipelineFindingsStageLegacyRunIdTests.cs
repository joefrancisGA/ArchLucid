using ArchLucid.Application.Analysis;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Application.Runs.Orchestration.Pipeline.Stages;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.TestSupport;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Orchestration;

[Trait("Category", "Unit")]
public sealed class AuthorityPipelineFindingsStageLegacyRunIdTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task CompareQuality_ExecuteAsync_merges_agent_results_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpper = canonicalRunId.ToUpperInvariant();
        Guid contextSnapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid graphSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        AgentResult legacyResult = new()
        {
            ResultId = "result-legacy-withheld",
            RunId = legacyUpper,
            TaskId = "task-compliance",
            AgentType = AgentType.Compliance,
            Claims = ["ok"],
            WithheldFindings =
            [
                new WithheldFindingSummary
                {
                    WithheldFindingId = "withheld-legacy-1",
                    Reason = WithheldFindingReasons.ProseOnlyEmission,
                    Title = "Legacy-keyed withheld finding",
                },
            ],
        };

        Mock<IAgentResultRepository> agentResults = new();
        agentResults
            .Setup(repository => repository.GetByRunIdAsync(TestScope, canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([legacyResult]);
        agentResults
            .Setup(repository => repository.GetByRunIdAsync(
                TestScope,
                It.Is<string>(id => id != canonicalRunId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        FindingsSnapshot? savedSnapshot = null;
        Mock<IAuthorityPipelineStagePersistence> persistence = new();
        persistence
            .Setup(p => p.SaveFindingsAsync(It.IsAny<FindingsSnapshot>(), It.IsAny<IArchLucidUnitOfWork>(), It.IsAny<CancellationToken>()))
            .Callback<FindingsSnapshot, IArchLucidUnitOfWork, CancellationToken>((snapshot, _, _) => savedSnapshot = snapshot)
            .Returns(Task.CompletedTask);
        persistence
            .Setup(p => p.UpdateRunAsync(It.IsAny<RunRecord>(), It.IsAny<IArchLucidUnitOfWork>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IFindingsOrchestrator> orchestrator = new();
        orchestrator
            .Setup(o => o.GenerateFindingsSnapshotAsync(
                runGuid,
                contextSnapshotId,
                It.IsAny<GraphSnapshot>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<FindingAnalysisContext?>()))
            .ReturnsAsync(new FindingsSnapshot
            {
                FindingsSnapshotId = Guid.NewGuid(),
                RunId = runGuid,
                GenerationStatus = FindingsSnapshotGenerationStatus.Generating,
            });

        Mock<IFindingsSnapshotEvaluationConfidenceEnricher> confidenceEnricher = new();
        confidenceEnricher
            .Setup(e => e.TryEnrichAsync(It.IsAny<FindingsSnapshot>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<IArchLucidUnitOfWork>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<IntegrationEventsOptions>> integrationEvents = new();
        integrationEvents.Setup(m => m.CurrentValue).Returns(new IntegrationEventsOptions());
        Mock<IOptionsMonitor<PublicSiteOptions>> publicSite = new();
        publicSite.Setup(m => m.CurrentValue).Returns(new PublicSiteOptions());

        await using IArchLucidUnitOfWork uow = await ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory().CreateAsync(CancellationToken.None);

        AuthorityPipelineContext context = new()
        {
            Run = new RunRecord { RunId = runGuid },
            Scope = TestScope,
            UnitOfWork = uow,
            Request = new ContextIngestionRequest(),
            ContextSnapshot = new ContextSnapshot { SnapshotId = contextSnapshotId, RunId = runGuid },
            GraphSnapshot = new GraphSnapshot { GraphSnapshotId = graphSnapshotId, RunId = runGuid, ContextSnapshotId = contextSnapshotId },
        };

        AuthorityPipelineFindingsStage sut = new(
            orchestrator.Object,
            confidenceEnricher.Object,
            NoOpInsightDensityLlmJudge.Instance,
            persistence.Object,
            audit.Object,
            Mock.Of<IIntegrationEventOutboxRepository>(),
            Mock.Of<IIntegrationEventPublisher>(),
            integrationEvents.Object,
            publicSite.Object,
            SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun(),
            SealedManifestHashTestSupport.CreateManifestHashService(),
            NullLogger<AuthorityPipelineFindingsStage>.Instance,
            agentResults.Object);

        await sut.ExecuteAsync(context, CancellationToken.None);

        savedSnapshot.Should().NotBeNull();
        savedSnapshot!.WithheldFindings.Should().ContainSingle(w => w.Title == "Legacy-keyed withheld finding");
        agentResults.Verify(
            repository => repository.GetByRunIdAsync(TestScope, canonicalRunId, It.IsAny<CancellationToken>()),
            Times.AtLeastOnce);
    }
}
