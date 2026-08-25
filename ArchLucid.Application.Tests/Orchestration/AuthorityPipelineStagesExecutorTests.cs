using System.Diagnostics;
using System.Diagnostics.Metrics;

using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Contracts.Persistence.Ports;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Persistence.Artifacts;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Integration;
using ArchLucid.Contracts.Scoping;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Interfaces;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Cosmos;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using ArchLucid.Application.Runs.Orchestration.Pipeline;

using JetBrains.Annotations;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Orchestration;

/// <summary>
///     <see cref="AuthorityPipelineStagesExecutor" /> OTel span parenting, stage tags, histogram, and error propagation.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthorityPipelineStagesExecutorTests
{
    private static readonly string AuthorityRunSourceName = ArchLucidMeterNames.AuthorityRunActivitySource;

    [SkippableFact]
    public async Task ExecuteAfterRunPersistedAsync_creates_child_activities_under_run_activity()
    {
        _ = ArchLucidInstrumentation.AuthorityPipelineStageDurationMilliseconds;

        List<Activity> stopped = [];

        using ActivityListener listener = new();
        listener.ShouldListenTo = s => s.Name == AuthorityRunSourceName;
        listener.Sample = (ref _) => ActivitySamplingResult.AllDataAndRecorded;
        listener.ActivityStopped = stopped.Add;

        ActivitySource.AddActivityListener(listener);

        using Activity? parent = ArchLucidInstrumentation.AuthorityRun.StartActivity(
            "authority.run.test");

        parent.Should().NotBeNull();

        AuthorityPipelineStagesExecutorTestFactory.ExecutorFixture fixture = AuthorityPipelineStagesExecutorTestFactory.CreateExecutor();
        AuthorityPipelineStagesExecutor sut = fixture.Executor;
        AuthorityPipelineContext ctx = AuthorityPipelineStagesExecutorTestFactory.CreateContext(parent, Guid.NewGuid());

        await sut.ExecuteAfterRunPersistedAsync(ctx, CancellationToken.None);

        string[] expectedOps =
        [
            "authority.context_ingestion",
                "authority.graph",
                "authority.findings",
                "authority.decisioning",
                "authority.artifacts"
        ];

        string[] expectedStages =
        [
            "context_ingestion",
                "graph",
                "findings",
                "decisioning",
                "artifacts"
        ];

        foreach (string op in expectedOps)
        {
            stopped.Should().Contain(a => a.OperationName == op);
        }

        List<Activity> stages = stopped
            .Where(a => expectedOps.Contains(a.OperationName))
            .OrderBy(a => Array.IndexOf(expectedOps, a.OperationName))
            .ToList();

        stages.Should().HaveCount(expectedStages.Length);

        for (int i = 0; i < stages.Count; i++)
        {
            Activity child = stages[i];
            child.ParentId.Should().Be(parent.Id);
            child.GetTagItem("archlucid.run_id").Should().Be(ctx.Run.RunId.ToString("D"));
            child.GetTagItem("archlucid.stage.name").Should().Be(expectedStages[i]);
        }

    }

    [SkippableFact]
    public async Task ExecuteAfterRunPersistedAsync_records_orchestrator_state_transition_events()
    {
        List<Activity> stopped = [];

        using ActivityListener listener = new();
        listener.ShouldListenTo = s => s.Name == AuthorityRunSourceName;
        listener.Sample = (ref _) => ActivitySamplingResult.AllDataAndRecorded;
        listener.ActivityStopped = stopped.Add;

        ActivitySource.AddActivityListener(listener);

        using Activity? parent = ArchLucidInstrumentation.AuthorityRun.StartActivity("authority.run.test");
        parent.Should().NotBeNull();

        AuthorityPipelineStagesExecutorTestFactory.ExecutorFixture fixture = AuthorityPipelineStagesExecutorTestFactory.CreateExecutor();
        AuthorityPipelineStagesExecutor sut = fixture.Executor;
        AuthorityPipelineContext ctx = AuthorityPipelineStagesExecutorTestFactory.CreateContext(parent, Guid.NewGuid());

        await sut.ExecuteAfterRunPersistedAsync(ctx, CancellationToken.None);

        List<ActivityEvent> transitionEvents = stopped
            .SelectMany(a => a.Events)
            .Where(e => e.Name == "orchestrator.state_transition")
            .ToList();

        transitionEvents.Should().HaveCount(5);

        (string From, string To)[] expectedTransitions =
        [
            ("inline_authority_pipeline_stages", "context_ingestion"),
            ("context_ingestion", "graph"),
            ("graph", "findings"),
            ("findings", "decisioning"),
            ("decisioning", "artifacts"),
        ];

        for (int i = 0; i < expectedTransitions.Length; i++)
        {
            ActivityEvent evt = transitionEvents[i];
            (string from, string to) = expectedTransitions[i];

            evt.Tags.Should().Contain(t => t.Key == "from_state" && (string?)t.Value == from);
            evt.Tags.Should().Contain(t => t.Key == "to_state" && (string?)t.Value == to);
            evt.Tags.Should().Contain(t => t.Key == "archlucid.run_id" && (string?)t.Value == ctx.Run.RunId.ToString("D"));
        }
    }

    [SkippableFact]
    public async Task ExecuteAfterRunPersistedAsync_records_stage_duration_metrics()
    {
        _ = ArchLucidInstrumentation.AuthorityPipelineStageDurationMilliseconds;

        List<HistogramMeasurement> histograms = [];

        using MeterListener meterListener = new();
        meterListener.InstrumentPublished = (instrument, listener) =>
        {
            if (instrument.Meter.Name != ArchLucidMeterNames.Meter)
            {
                return;
            }

            if (instrument.Name != "archlucid_authority_pipeline_stage_duration_ms")
            {
                return;
            }

            listener.EnableMeasurementEvents(instrument);
        };

        meterListener.SetMeasurementEventCallback<double>((instrument, measurement, tags, _) =>
        {
            if (instrument.Name != "archlucid_authority_pipeline_stage_duration_ms")
            {
                return;
            }

            List<KeyValuePair<string, object?>> tagList = [];

            foreach (KeyValuePair<string, object?> t in tags)
            {
                tagList.Add(t);
            }

            histograms.Add(new HistogramMeasurement(measurement, tagList));
        });

        meterListener.Start();

        AuthorityPipelineStagesExecutorTestFactory.ExecutorFixture fixture = AuthorityPipelineStagesExecutorTestFactory.CreateExecutor();
        AuthorityPipelineStagesExecutor sut = fixture.Executor;
        AuthorityPipelineContext ctx = AuthorityPipelineStagesExecutorTestFactory.CreateContext(runId: Guid.NewGuid());

        await sut.ExecuteAfterRunPersistedAsync(ctx, CancellationToken.None);

        histograms.Should().HaveCount(5);

        string[] stages = ["context_ingestion", "graph", "findings", "decisioning", "artifacts"];

        foreach (string stage in stages)
        {
            histograms.Should().Contain(h =>
                h.Tags.Any(t => t.Key == "stage" && Equals(t.Value, stage))
                && h.Tags.Any(t => t.Key == "outcome" && Equals(t.Value, "success")));
        }
    }

    [SkippableFact]
    public async Task ExecuteAfterRunPersistedAsync_propagates_error_status_on_stage_failure()
    {
        _ = ArchLucidInstrumentation.AuthorityPipelineStageDurationMilliseconds;

        List<Activity> stopped = [];

        using ActivityListener activityListener = new();
        activityListener.ShouldListenTo = s => s.Name == AuthorityRunSourceName;
        activityListener.Sample = (ref _) => ActivitySamplingResult.AllDataAndRecorded;
        activityListener.ActivityStopped = stopped.Add;

        ActivitySource.AddActivityListener(activityListener);

        List<HistogramMeasurement> histograms = [];

        using MeterListener meterListener = new();
        meterListener.InstrumentPublished = (instrument, listener) =>
        {
            if (instrument.Meter.Name == ArchLucidInstrumentation.MeterName
                && instrument.Name == "archlucid_authority_pipeline_stage_duration_ms")
            {
                listener.EnableMeasurementEvents(instrument);
            }
        };

        meterListener.SetMeasurementEventCallback<double>((_, measurement, tags, _) =>
        {
            List<KeyValuePair<string, object?>> tagList = [];

            foreach (KeyValuePair<string, object?> t in tags)
            {
                tagList.Add(t);
            }

            histograms.Add(new HistogramMeasurement(measurement, tagList));
        });

        meterListener.Start();

        Mock<IContextIngestionService> ingest = new();
        ingest
            .Setup(s => s.IngestAsync(It.IsAny<ContextIngestionRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("ingest failed"));

        AuthorityPipelineStagesExecutorTestFactory.ExecutorFixture fixture =
            AuthorityPipelineStagesExecutorTestFactory.CreateExecutor(ingestMock: ingest);
        AuthorityPipelineStagesExecutor sut = fixture.Executor;
        AuthorityPipelineContext ctx = AuthorityPipelineStagesExecutorTestFactory.CreateContext(runId: Guid.NewGuid());

        Func<Task> act = async () => await sut.ExecuteAfterRunPersistedAsync(ctx, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("ingest failed");

        Activity? failed = stopped.LastOrDefault(a => a.OperationName == "authority.context_ingestion");
        failed.Should().NotBeNull();
        failed.Status.Should().Be(ActivityStatusCode.Error);
        failed.StatusDescription.Should().Contain("ingest failed");
        failed.GetTagItem("error.type").Should().Be("InvalidOperationException");

        histograms.Should().ContainSingle(h =>
            h.Tags.Any(t => t.Key == "stage" && Equals(t.Value, "context_ingestion"))
            && h.Tags.Any(t => t.Key == "outcome" && Equals(t.Value, "error")));

    }

    [SkippableFact]
    public async Task ExecuteAfterRunPersistedAsync_works_when_run_activity_is_null()
    {
        _ = ArchLucidInstrumentation.AuthorityPipelineStageDurationMilliseconds;

        AuthorityPipelineStagesExecutorTestFactory.ExecutorFixture fixture = AuthorityPipelineStagesExecutorTestFactory.CreateExecutor();
        AuthorityPipelineStagesExecutor sut = fixture.Executor;
        AuthorityPipelineContext ctx = AuthorityPipelineStagesExecutorTestFactory.CreateContext(null, Guid.NewGuid());

        Func<Task> act = async () => await sut.ExecuteAfterRunPersistedAsync(ctx, CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    [SkippableFact]
    public async Task ExecuteAfterRunPersistedAsync_aborts_decisioning_when_findings_generation_failed()
    {
        _ = ArchLucidInstrumentation.AuthorityPipelineStageDurationMilliseconds;

        DateTime utc = TimeProvider.System.UtcNowDateTime();
        AuthorityPipelineStagesExecutorTestFactory.ExecutorFixture fixture = AuthorityPipelineStagesExecutorTestFactory.CreateExecutor(
            configureFindings: s =>
            {
                s.GenerationStatus = FindingsSnapshotGenerationStatus.Failed;
                s.EngineFailures.Add(
                    new FindingEngineFailure
                    {
                        EngineType = "test",
                        Category = "Test",
                        ErrorMessage = "all engines failed",
                        ExceptionType = nameof(InvalidOperationException),
                        DurationMs = 1,
                        OccurredUtc = utc
                    });
            });

        AuthorityPipelineStagesExecutor sut = fixture.Executor;
        Mock<IDecisionEngine> decision = fixture.Decision;
        AuthorityPipelineContext ctx = AuthorityPipelineStagesExecutorTestFactory.CreateContext(runId: Guid.NewGuid());

        Func<Task> act = async () => await sut.ExecuteAfterRunPersistedAsync(ctx, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*failed for all engines*");

        decision.Verify(
            d => d.DecideAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<GraphSnapshot>(),
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task ExecuteAfterRunPersistedAsync_aborts_decisioning_when_findings_partial_and_halt_enabled()
    {
        _ = ArchLucidInstrumentation.AuthorityPipelineStageDurationMilliseconds;

        DateTime utc = TimeProvider.System.UtcNowDateTime();
        AuthorityPipelineStagesExecutorTestFactory.ExecutorFixture fixture = AuthorityPipelineStagesExecutorTestFactory.CreateExecutor(
            configureFindings: s =>
            {
                s.GenerationStatus = FindingsSnapshotGenerationStatus.PartiallyComplete;
                s.EngineFailures.Add(
                    new FindingEngineFailure
                    {
                        EngineType = "llm-engine",
                        Category = "Test",
                        ErrorMessage = "circuit",
                        ExceptionType = nameof(InvalidOperationException),
                        DurationMs = 1,
                        OccurredUtc = utc
                    });
                s.Findings.Add(
                    new Finding
                    {
                        FindingType = "RequirementFinding",
                        Category = "Requirement",
                        Title = "partial",
                        Rationale = "r",
                        EngineType = "requirement",
                        Severity = FindingSeverity.Info
                    });
            },
            authorityPipelineOptions: new AuthorityPipelineOptions { HaltOnPartialFindings = true });

        AuthorityPipelineStagesExecutor sut = fixture.Executor;
        Mock<IDecisionEngine> decision = fixture.Decision;
        AuthorityPipelineContext ctx = AuthorityPipelineStagesExecutorTestFactory.CreateContext(runId: Guid.NewGuid());

        Func<Task> act = async () => await sut.ExecuteAfterRunPersistedAsync(ctx, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*only partially complete*");

        decision.Verify(
            d => d.DecideAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<GraphSnapshot>(),
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task ExecuteAfterRunPersistedAsync_runs_decisioning_when_findings_partial_and_halt_disabled()
    {
        _ = ArchLucidInstrumentation.AuthorityPipelineStageDurationMilliseconds;

        DateTime utc = TimeProvider.System.UtcNowDateTime();
        AuthorityPipelineStagesExecutorTestFactory.ExecutorFixture fixture = AuthorityPipelineStagesExecutorTestFactory.CreateExecutor(
            configureFindings: s =>
            {
                s.GenerationStatus = FindingsSnapshotGenerationStatus.PartiallyComplete;
                s.EngineFailures.Add(
                    new FindingEngineFailure
                    {
                        EngineType = "llm-engine",
                        Category = "Test",
                        ErrorMessage = "circuit",
                        ExceptionType = nameof(InvalidOperationException),
                        DurationMs = 1,
                        OccurredUtc = utc
                    });
                s.Findings.Add(
                    new Finding
                    {
                        FindingType = "RequirementFinding",
                        Category = "Requirement",
                        Title = "partial",
                        Rationale = "r",
                        EngineType = "requirement",
                        Severity = FindingSeverity.Info
                    });
            },
            authorityPipelineOptions: new AuthorityPipelineOptions { HaltOnPartialFindings = false });

        AuthorityPipelineStagesExecutor sut = fixture.Executor;
        Mock<IDecisionEngine> decision = fixture.Decision;
        AuthorityPipelineContext ctx = AuthorityPipelineStagesExecutorTestFactory.CreateContext(runId: Guid.NewGuid());

        await sut.ExecuteAfterRunPersistedAsync(ctx, CancellationToken.None);

        decision.Verify(
            d => d.DecideAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<GraphSnapshot>(),
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task ExecuteAfterRunPersistedAsync_aborts_decisioning_when_security_engine_failed_even_if_halt_disabled()
    {
        _ = ArchLucidInstrumentation.AuthorityPipelineStageDurationMilliseconds;

        DateTime utc = TimeProvider.System.UtcNowDateTime();
        AuthorityPipelineStagesExecutorTestFactory.ExecutorFixture fixture = AuthorityPipelineStagesExecutorTestFactory.CreateExecutor(
            configureFindings: s =>
            {
                s.GenerationStatus = FindingsSnapshotGenerationStatus.PartiallyComplete;
                s.EngineFailures.Add(
                    new FindingEngineFailure
                    {
                        EngineType = "security-baseline",
                        Category = "Security",
                        ErrorMessage = "critical",
                        ExceptionType = nameof(InvalidOperationException),
                        DurationMs = 1,
                        OccurredUtc = utc
                    });
            },
            authorityPipelineOptions: new AuthorityPipelineOptions { HaltOnPartialFindings = false });

        AuthorityPipelineStagesExecutor sut = fixture.Executor;
        Mock<IDecisionEngine> decision = fixture.Decision;
        AuthorityPipelineContext ctx = AuthorityPipelineStagesExecutorTestFactory.CreateContext(runId: Guid.NewGuid());

        Func<Task> act = async () => await sut.ExecuteAfterRunPersistedAsync(ctx, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*only partially complete*");

        decision.Verify(
            d => d.DecideAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<GraphSnapshot>(),
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task ExecuteAfterRunPersistedAsync_skips_completed_stages_on_checkpoint_retry()
    {
        _ = ArchLucidInstrumentation.AuthorityPipelineStageSkippedCheckpointTotal;

        Guid runGuid = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();

        ContextSnapshot committedContext = new()
        {
            SnapshotId = contextId,
            RunId = runGuid,
            ProjectId = "p1",
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        GraphSnapshot committedGraph = new()
        {
            GraphSnapshotId = graphId,
            ContextSnapshotId = contextId,
            RunId = runGuid,
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        Mock<IContextIngestionService> ingest = new();
        Mock<IKnowledgeGraphService> kg = new();
        Mock<IContextSnapshotRepository> ctxRepo = new();
        ctxRepo
            .Setup(r => r.GetByIdAsync(It.IsAny<ReadScopeTriple>(), contextId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(committedContext);

        Mock<IGraphSnapshotRepository> graphRepo = new();
        graphRepo
            .Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), graphId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(committedGraph);

        AuthorityPipelineStagesExecutorTestFactory.ExecutorFixture fixture = AuthorityPipelineStagesExecutorTestFactory.CreateExecutor(
            ingestMock: ingest,
            contextSnapshotRepositoryMock: ctxRepo,
            graphSnapshotRepositoryMock: graphRepo,
            knowledgeGraphServiceMock: kg);
        AuthorityPipelineStagesExecutor sut = fixture.Executor;

        AuthorityPipelineContext ctx = AuthorityPipelineStagesExecutorTestFactory.CreateContext(runId: runGuid);
        ctx.Run.ContextSnapshotId = contextId;
        ctx.Run.GraphSnapshotId = graphId;

        await sut.ExecuteAfterRunPersistedAsync(ctx, CancellationToken.None);

        ingest.Verify(
            s => s.IngestAsync(It.IsAny<ContextIngestionRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
        kg.Verify(
            k => k.BuildSnapshotAsync(It.IsAny<ContextSnapshot>(), It.IsAny<CancellationToken>()),
            Times.Never);
        graphRepo.Verify(
            r => r.SaveAsync(It.IsAny<GraphSnapshot>(), It.IsAny<CancellationToken>(), null, null),
            Times.Never);

        ctx.ContextSnapshot!.SnapshotId.Should().Be(contextId);
        ctx.GraphSnapshot!.GraphSnapshotId.Should().Be(graphId);
    }

    [SkippableFact]
    public async Task ExecuteAfterRunPersistedAsync_when_artifact_synthesis_throws_logs_ArtifactSynthesisFailed_and_rethrows()
    {
        Guid runGuid = Guid.NewGuid();
        AuthorityPipelineStagesExecutorTestFactory.ExecutorFixture fixture = AuthorityPipelineStagesExecutorTestFactory.CreateExecutor(
            configureSynthesis: s =>
            {
                s.Setup(x => x.SynthesizeAsync(It.IsAny<ManifestDocument>(), It.IsAny<CancellationToken>()))
                    .ThrowsAsync(new InvalidOperationException("synthesis failed"));
                s.Setup(x => x.SynthesizeAsync(
                        It.IsAny<ManifestDocument>(),
                        It.IsAny<IReadOnlyList<TechnologyLedgerEntry>>(),
                        It.IsAny<CancellationToken>()))
                    .ThrowsAsync(new InvalidOperationException("synthesis failed"));
            });
        AuthorityPipelineStagesExecutor sut = fixture.Executor;
        Mock<IAuditService> audit = fixture.Audit;

        AuthorityPipelineContext ctx = AuthorityPipelineStagesExecutorTestFactory.CreateContext(runId: runGuid);

        Func<Task> act = async () => await sut.ExecuteAfterRunPersistedAsync(ctx, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("synthesis failed");

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.ArtifactSynthesisFailed
                    && e.RunId == runGuid
                    && e.ManifestId.HasValue
                    && e.ManifestId.Value != Guid.Empty),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private sealed record HistogramMeasurement([UsedImplicitly] double Value, List<KeyValuePair<string, object?>> Tags);
}
