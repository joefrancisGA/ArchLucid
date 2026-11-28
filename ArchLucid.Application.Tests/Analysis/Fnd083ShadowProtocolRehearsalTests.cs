using System.Linq.Expressions;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Application.Runs.Orchestration.Pipeline.Stages;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Persistence.Ports;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Persistence.Graph;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class Fnd083ShadowProtocolRehearsalTests
{
    [Fact]
    public async Task Authority_shadow_emits_decisions_without_changing_versioned_checkpoints_or_publish_order()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        Guid[] ids = Enumerable.Range(0, 5).Select(_ => Guid.NewGuid()).ToArray();
        List<(string Stage, string Version, string Output)> legacy = await Run(false);
        List<(string Stage, string Version, string Output)> shadow = await Run(true);
        Assert.Equal(legacy, shadow);
        Assert.Equal(["context_ingestion", "graph", "findings", "seal_and_publish"], shadow.Select(x => x.Stage));

        async Task<List<(string Stage, string Version, string Output)>> Run(bool observe)
        {
            RunRecord run = new() { RunId = ids[0] };
            FakeTimeProvider clock = new();
            using var budget = new AnalysisExecutionBudget(new(), clock, TimeSpan.FromMinutes(5), CancellationToken.None);
            var (store, writes) = Checkpoints(authority: true);
            var log = new DecisionLogger<AuthorityRecoveryPipeline>();
            var tx = new Mock<IArchLucidUnitOfWork>();
            int commits = 0;
            tx.Setup(u => u.CommitAsync(It.IsAny<CancellationToken>())).Callback(() => commits++)
                .Returns(Task.CompletedTask);
            var factory = new Mock<IArchLucidUnitOfWorkFactory>();
            factory.Setup(u => u.CreateAsync(It.IsAny<CancellationToken>())).ReturnsAsync(tx.Object);
            var opts = Monitor(new AnalysisStageExecutionOptions
            {
                EnableDurableAuthorityRecovery = true, EnableDependencyAwareAnalysisReuse = true,
                ObserveAnalyticalDependencyGraph = observe,
            });
            AuthorityPipelineContext context = new()
            {
                Run = run, Scope = scope, Request = new ContextIngestionRequest(), UnitOfWork = tx.Object,
                ExecutionBudget = budget, UsesDurableRecovery = true,
            };
            AuthorityPipelineStageContextHydrator hydrator = new(
                Mock.Of<IContextSnapshotRepository>(), Mock.Of<IGraphSnapshotRepository>(),
                Mock.Of<IFindingsSnapshotRepository>(), Mock.Of<IDecisionTraceRepository>(),
                Mock.Of<IGoldenManifestRepository>(), Mock.Of<IArtifactBundleRepository>());
            AuthorityPipelineStagesExecutor executor = new(
                Stage<IAuthorityPipelineContextIngestionStage>(s => s.ExecuteAsync(context, It.IsAny<CancellationToken>()),
                    () => run.ContextSnapshotId = ids[1]),
                Stage<IAuthorityPipelineGraphStage>(s => s.ExecuteAsync(context, It.IsAny<CancellationToken>()),
                    () => run.GraphSnapshotId = ids[2]),
                Stage<IAuthorityPipelineFindingsStage>(s => s.ExecuteAsync(context, It.IsAny<CancellationToken>()), () =>
                {
                    run.FindingsSnapshotId = ids[3];
                    context.FindingsSnapshot = new() { GenerationStatus = FindingsSnapshotGenerationStatus.Complete };
                }),
                Mock.Of<IAuthorityPipelineDecisioningStage>(),
                Stage<IAuthorityPipelineArtifactsStage>(s => s.ExecuteAsync(context, It.IsAny<CancellationToken>()),
                    () => run.GoldenManifestId = ids[4]),
                hydrator, Mock.Of<IRunGovernanceScopePinService>(), Mock.Of<IRunStageOutcomesRepository>(),
                NullLogger<AuthorityPipelineStagesExecutor>.Instance);
            var prepare = 0;
            var publish = 0;
            var recovery = new AuthorityRecoveryPipeline(store.Object, factory.Object, executor, opts,
                clock, log, Monitor(new IntegrationEventsOptions()), new AnalysisDependencyConfiguration(new ConfigurationBuilder().Build()));

            await recovery.ExecuteAsync(context,
                (uow, _) => { Assert.Same(tx.Object, uow); prepare++; return Task.CompletedTask; },
                async (uow, ct) => { Assert.Same(tx.Object, uow); publish++; await uow.CommitAsync(ct); return run; },
                CancellationToken.None);

            Assert.Equal(1, prepare);
            Assert.Equal(1, publish);
            Assert.Equal(4, commits);
            Assert.Equal(observe ? 4 : 0, log.Decisions.Count);
            Assert.All(log.Decisions, d => Assert.Equal("shadow", d.Mode));
            return writes;
        }
    }

    [Theory]
    [InlineData("full_recompute")]
    [InlineData("carry_forward")]
    public async Task SecureNow_shadow_keeps_legacy_checkpoint_versions_and_redelivery(string route)
    {
        SecureNowAnalysisRecoveryJob job = new()
        {
            TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid(),
            SnapshotId = Guid.NewGuid(), InputVersion = new string('A', 64),
        };
        Assert.Equal(await Run(false), await Run(true));

        async Task<List<(string Stage, string Version, string Output)>> Run(bool observe)
        {
            var (store, writes) = Checkpoints(authority: false);
            var log = new DecisionLogger<SecureNowRecoverySession>();
            FakeTimeProvider clock = new();
            int effects = 0;
            string[] stages = (route == "carry_forward" ? AnalysisDependencyGraphs.SecureCarry : AnalysisDependencyGraphs.SecureFull)
                .Order.Where(s => s != AnalysisDependencyGraphs.Plan && s != AnalysisDependencyGraphs.Job).ToArray();

            for (int delivery = 0; delivery < 2; delivery++)
            {
                SecureNowRecoverySession session = new(store.Object, job, 3, clock, log, CancellationToken.None,
                    versioned: true, useGraph: false, observeGraph: observe);
                Assert.Equal(route, await session.PinPlanAsync("test-plan", route, CancellationToken.None));

                foreach (string stage in stages)
                {
                    Assert.Equal(stage, await session.ExecuteAsync(stage, _ =>
                    {
                        effects++;
                        return Task.FromResult(stage);
                    }, null, CancellationToken.None));
                }
            }

            Assert.Equal(stages.Length, effects);
            Assert.Equal(stages.Length + 1, writes.Count);
            Assert.Equal(observe ? 2 * (stages.Length + 1) : 0, log.Decisions.Count);
            Assert.All(log.Decisions, d => Assert.Equal("shadow", d.Mode));

            if (observe)
                Assert.All(log.Decisions.Skip(stages.Length + 1), d => Assert.True(d.LegacyReuse));
            return writes;
        }
    }

    private static (Mock<IAnalysisRecoveryRepository>, List<(string Stage, string Version, string Output)>) Checkpoints(bool authority)
    {
        Dictionary<AnalysisRecoveryStageKey, AnalysisRecoveryClaim> saved = [];
        List<(string Stage, string Version, string Output)> writes = [];
        Mock<IAnalysisRecoveryRepository> store = new(MockBehavior.Strict);
        store.Setup(s => s.ReadAsync(It.IsAny<AnalysisRecoveryStageKey>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AnalysisRecoveryStageKey key, CancellationToken _) => saved.GetValueOrDefault(key));
        var capture = authority
            ? store.Setup(s => s.ClaimForAuthorityInputsAsync(It.IsAny<AnalysisRecoveryStageKey>(), It.IsAny<string>(), It.IsAny<Guid>(), 30, 3, It.IsAny<CancellationToken>()))
            : store.Setup(s => s.ClaimAsync(It.IsAny<AnalysisRecoveryStageKey>(), It.IsAny<string>(), It.IsAny<Guid>(), 30, 3, It.IsAny<CancellationToken>()));
        capture.ReturnsAsync((AnalysisRecoveryStageKey key, string version, Guid owner, int _, int _, CancellationToken _) =>
        {
            if (saved.TryGetValue(key, out AnalysisRecoveryClaim? cached))
                return cached;
            var claim = new AnalysisRecoveryClaim { State = "running", InputVersion = version, Owner = owner, Attempts = 1, Fence = 1 };
            saved.Add(key, claim);
            return claim;
        });
        store.Setup(s => s.CompleteAsync(It.IsAny<AnalysisRecoveryStageKey>(), It.IsAny<Guid>(), 1, It.IsAny<string>(),
                It.IsAny<IArchLucidUnitOfWork?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AnalysisRecoveryStageKey key, Guid owner, long fence, string output, IArchLucidUnitOfWork? tx, CancellationToken _) =>
            {
                Assert.Equal(authority, tx is not null);
                var claim = saved[key];
                Assert.Equal(owner, claim.Owner);
                writes.Add((key.Stage, claim.InputVersion, output));
                saved[key] = new() { State = "succeeded", InputVersion = claim.InputVersion, ResultReference = output, Attempts = 1, Fence = fence };
                return true;
            });
        store.Setup(s => s.IsCurrentAsync(It.IsAny<AnalysisRecoveryStageKey>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<IArchLucidUnitOfWork>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AnalysisRecoveryStageKey key, string version, string output, IArchLucidUnitOfWork _, CancellationToken _) =>
                saved[key].InputVersion == version && saved[key].ResultReference == output);
        return (store, writes);
    }

    private static IOptionsMonitor<T> Monitor<T>(T value)
    {
        var options = new Mock<IOptionsMonitor<T>>();
        options.SetupGet(o => o.CurrentValue).Returns(value);
        return options.Object;
    }

    private static T Stage<T>(Expression<Func<T, Task>> execute, Action body) where T : class
    {
        Mock<T> stage = new(MockBehavior.Strict);
        stage.Setup(execute).Returns(() =>
        {
            body();
            return Task.CompletedTask;
        });
        return stage.Object;
    }

    private sealed class DecisionLogger<T> : ILogger<T>
    {
        public List<(string Mode, bool LegacyReuse)> Decisions { get; } = [];
        public bool IsEnabled(LogLevel logLevel) => true;
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public void Log<TState>(LogLevel level, EventId id, TState state, Exception? ex, Func<TState, Exception?, string> formatter)
        {
            if (state is IEnumerable<KeyValuePair<string, object?>> values)
            {
                var fields = values.ToDictionary();

                if (fields.TryGetValue("Mode", out object? mode) && fields.TryGetValue("LegacyReuse", out object? reuse))
                    Decisions.Add(((string)mode!, (bool)reuse!));
            }
        }
    }
}
