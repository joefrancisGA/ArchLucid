using System.Diagnostics;

using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Application.Runs.Orchestration.Pipeline.Stages;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Artifacts;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Persistence.Ports;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integration;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Cosmos;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Orchestration;

internal static class AuthorityPipelineStagesExecutorTestFactory
{
    internal sealed record ExecutorFixture(
        AuthorityPipelineStagesExecutor Executor,
        Mock<IDecisionEngine> Decision,
        Mock<IAuditService> Audit,
        Mock<IContextIngestionService> Ingest,
        Mock<IKnowledgeGraphService> KnowledgeGraph);

    internal static ExecutorFixture CreateExecutor(
        Mock<IContextIngestionService>? ingestMock = null,
        Mock<IContextSnapshotRepository>? contextSnapshotRepositoryMock = null,
        Mock<IGraphSnapshotRepository>? graphSnapshotRepositoryMock = null,
        Mock<IKnowledgeGraphService>? knowledgeGraphServiceMock = null,
        Action<FindingsSnapshot>? configureFindings = null,
        AuthorityPipelineOptions? authorityPipelineOptions = null,
        Action<Mock<IArtifactSynthesisService>>? configureSynthesis = null)
    {
        Guid snapshotId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid findingsId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        Guid traceId = Guid.NewGuid();
        Guid bundleId = Guid.NewGuid();

        Mock<IRunRepository> runRepo = new();
        runRepo
            .Setup(r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        Mock<IContextIngestionService> ingest = ingestMock ?? new Mock<IContextIngestionService>();

        if (ingestMock is null)
        {
            ingest
                .Setup(s => s.IngestAsync(It.IsAny<ContextIngestionRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(
                    new ContextSnapshot
                    {
                        SnapshotId = snapshotId,
                        RunId = Guid.Empty,
                        ProjectId = "p1",
                        CreatedUtc = TimeProvider.System.UtcNowDateTime()
                    });
        }

        Mock<IContextSnapshotRepository> ctxRepo = contextSnapshotRepositoryMock ?? new Mock<IContextSnapshotRepository>();
        ctxRepo
            .Setup(r => r.GetLatestAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ContextSnapshot?)null);
        ctxRepo
            .Setup(r => r.SaveAsync(It.IsAny<ContextSnapshot>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        Mock<IKnowledgeGraphService> kg = knowledgeGraphServiceMock ?? new Mock<IKnowledgeGraphService>();

        if (knowledgeGraphServiceMock is null)
        {
            kg
                .Setup(k => k.BuildSnapshotAsync(It.IsAny<ContextSnapshot>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(
                    new GraphSnapshot
                    {
                        GraphSnapshotId = graphId,
                        ContextSnapshotId = snapshotId,
                        RunId = Guid.Empty,
                        CreatedUtc = TimeProvider.System.UtcNowDateTime()
                    });
        }

        Mock<IGraphSnapshotRepository> graphRepo = graphSnapshotRepositoryMock ?? new Mock<IGraphSnapshotRepository>();
        graphRepo
            .Setup(r => r.SaveAsync(It.IsAny<GraphSnapshot>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        Mock<IFindingsOrchestrator> findingsOrch = new();
        FindingsSnapshot findingsReturn = new()
        {
            FindingsSnapshotId = findingsId,
            RunId = Guid.Empty,
            ContextSnapshotId = snapshotId,
            GraphSnapshotId = graphId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        configureFindings?.Invoke(findingsReturn);

        findingsOrch
            .Setup(f => f.GenerateFindingsSnapshotAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<GraphSnapshot>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(findingsReturn);

        Mock<IFindingsSnapshotRepository> findingsRepo = new();
        findingsRepo
            .Setup(r => r.SaveAsync(It.IsAny<FindingsSnapshot>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        ManifestDocument manifest = new()
        {
            ManifestId = manifestId,
            RunId = Guid.Empty,
            ContextSnapshotId = snapshotId,
            GraphSnapshotId = graphId,
            FindingsSnapshotId = findingsId,
            DecisionTraceId = traceId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ManifestHash = "h",
            RuleSetId = "r",
            RuleSetVersion = "1",
            RuleSetHash = "rh"
        };

        DecisionTraceDto trace = RuleAuditTraceDto.From(
            new RuleAuditTracePayload { DecisionTraceId = traceId, RunId = Guid.Empty, CreatedUtc = TimeProvider.System.UtcNowDateTime() });

        Mock<IDecisionEngine> decision = new();
        decision
            .Setup(d => d.DecideAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<GraphSnapshot>(),
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((manifest, trace));

        Mock<IDecisionTraceRepository> traceRepo = new();
        traceRepo
            .Setup(r => r.SaveAsync(It.IsAny<DecisionTraceDto>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        Mock<IGoldenManifestRepository> manifestRepo = new();
        manifestRepo
            .Setup(r => r.SaveAsync(It.IsAny<ManifestDocument>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        SynthesizedArtifact oneArtifact = new()
        {
            ArtifactId = Guid.NewGuid(),
            Name = "n",
            ArtifactType = "t",
            Format = "json",
            Content = "{}",
            ContentHash = "x"
        };

        Mock<IArtifactSynthesisService> synth = new();
        synth
            .Setup(s => s.SynthesizeAsync(It.IsAny<ManifestDocument>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ArtifactBundle
                {
                    BundleId = bundleId,
                    RunId = Guid.Empty,
                    ManifestId = manifestId,
                    CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                    Artifacts = [oneArtifact],
                    Trace = new SynthesisTrace { TraceId = Guid.NewGuid() }
                });
        synth
            .Setup(s => s.SynthesizeAsync(
                It.IsAny<ManifestDocument>(),
                It.IsAny<IReadOnlyList<TechnologyLedgerEntry>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ArtifactBundle
                {
                    BundleId = bundleId,
                    RunId = Guid.Empty,
                    ManifestId = manifestId,
                    CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                    Artifacts = [oneArtifact],
                    Trace = new SynthesisTrace { TraceId = Guid.NewGuid() }
                });

        configureSynthesis?.Invoke(synth);

        Mock<IArtifactBundleRepository> bundleRepo = new();
        bundleRepo
            .Setup(r => r.SaveAsync(It.IsAny<ArtifactBundle>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IFindingsSnapshotEvaluationConfidenceEnricher> snapshotConfidence = new();
        snapshotConfidence
            .Setup(e => e.TryEnrichAsync(It.IsAny<FindingsSnapshot>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IRunStageOutcomesRepository> stageOutcomes = new();
        stageOutcomes
            .Setup(r => r.RecordStageStartedAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<DateTime>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection>(),
                It.IsAny<System.Data.IDbTransaction>()))
            .Returns(Task.CompletedTask);
        stageOutcomes
            .Setup(r => r.RecordStageCompletedAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<DateTime>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection>(),
                It.IsAny<System.Data.IDbTransaction>()))
            .Returns(Task.CompletedTask);

        Mock<IGraphSnapshotSqlAuthorityWriter> graphSqlWriter = new();
        graphSqlWriter
            .Setup(x => x.SaveAsync(
                It.IsAny<GraphSnapshot>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection>(),
                It.IsAny<System.Data.IDbTransaction>()))
            .Returns(Task.CompletedTask);

        Mock<ICosmosGraphSnapshotOutboxRepository> cosmosGraphOutbox = new();
        cosmosGraphOutbox
            .Setup(x => x.EnqueueAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<CosmosDbOptions>> cosmosDb = new();
        cosmosDb.SetupGet(m => m.CurrentValue).Returns(new CosmosDbOptions());

        Mock<IOptionsMonitor<AuthorityPipelineOptions>> apPipeline = new();
        apPipeline.Setup(m => m.CurrentValue).Returns(authorityPipelineOptions ?? new AuthorityPipelineOptions());

        Mock<ITechnologyLedgerRepository> ledgerRepo = new();
        ledgerRepo
            .Setup(r => r.GetByRunIdAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        IAuthorityPipelineStagePersistence stagePersistence = new AuthorityPipelineStagePersistence(
            runRepo.Object,
            ctxRepo.Object,
            graphRepo.Object,
            graphSqlWriter.Object,
            cosmosGraphOutbox.Object,
            findingsRepo.Object,
            traceRepo.Object,
            manifestRepo.Object,
            bundleRepo.Object,
            cosmosDb.Object);

        AuthorityPipelineStageContextHydrator hydrator = new(
            ctxRepo.Object,
            graphRepo.Object,
            findingsRepo.Object,
            traceRepo.Object,
            manifestRepo.Object,
            bundleRepo.Object);

        IOptionsMonitor<PublicSiteOptions> publicSiteOptions = CreatePublicSiteOptionsMonitor();
        IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions =
            ArchitectureRunExecuteOrchestratorTestFactory.CreateIntegrationEventsOptionsMonitor();

        AuthorityPipelineStagesExecutor executor = new(
            new AuthorityPipelineContextIngestionStage(
                ingest.Object,
                ctxRepo.Object,
                stagePersistence,
                NullLogger<AuthorityPipelineContextIngestionStage>.Instance),
            new AuthorityPipelineGraphStage(
                kg.Object,
                graphRepo.Object,
                stagePersistence,
                NullLogger<AuthorityPipelineGraphStage>.Instance),
            new AuthorityPipelineFindingsStage(
                findingsOrch.Object,
                snapshotConfidence.Object,
                stagePersistence,
                audit.Object,
                Mock.Of<IIntegrationEventOutboxRepository>(),
                Mock.Of<IIntegrationEventPublisher>(),
                integrationEventsOptions,
                publicSiteOptions,
                NullLogger<AuthorityPipelineFindingsStage>.Instance),
            new AuthorityPipelineDecisioningStage(
                decision.Object,
                stagePersistence,
                audit.Object,
                Mock.Of<ArchLucid.Application.ArchitectureIntelligence.IAuthorityClosedLoopStrengtheningPass>(),
                apPipeline.Object,
                NullLogger<AuthorityPipelineDecisioningStage>.Instance),
            new AuthorityPipelineArtifactsStage(
                ledgerRepo.Object,
                synth.Object,
                stagePersistence,
                audit.Object,
                NullLogger<AuthorityPipelineArtifactsStage>.Instance),
            hydrator,
            stageOutcomes.Object,
            NullLogger<AuthorityPipelineStagesExecutor>.Instance);

        return new ExecutorFixture(executor, decision, audit, ingest, kg);
    }

    internal static AuthorityPipelineContext CreateContext(Activity? runActivity = null, Guid? runId = null)
    {
        Guid rid = runId ?? Guid.NewGuid();
        RunRecord run = new()
        {
            RunId = rid,
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ScopeProjectId = Guid.NewGuid(),
            ProjectId = "p1",
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        Mock<IArchLucidUnitOfWork> uow = new();
        uow.SetupGet(x => x.SupportsExternalTransaction).Returns(false);

        return new AuthorityPipelineContext
        {
            Run = run,
            Request = new ContextIngestionRequest { RunId = rid, ProjectId = "p1" },
            UnitOfWork = uow.Object,
            Scope = new ScopeContext
            {
                TenantId = run.TenantId,
                WorkspaceId = run.WorkspaceId,
                ProjectId = run.ScopeProjectId
            },
            RunActivity = runActivity
        };
    }

    internal static IOptionsMonitor<CosmosDbOptions> CreateCosmosDbOptionsMonitor()
    {
        Mock<IOptionsMonitor<CosmosDbOptions>> cosmosDb = new();
        cosmosDb.SetupGet(m => m.CurrentValue).Returns(new CosmosDbOptions());

        return cosmosDb.Object;
    }

    private static IOptionsMonitor<PublicSiteOptions> CreatePublicSiteOptionsMonitor()
    {
        Mock<IOptionsMonitor<PublicSiteOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new PublicSiteOptions());

        return options.Object;
    }
}
