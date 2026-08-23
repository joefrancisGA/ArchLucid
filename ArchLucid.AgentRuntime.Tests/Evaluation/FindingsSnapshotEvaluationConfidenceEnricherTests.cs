using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.AgentRuntime.Evaluation.ReferenceCases;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests.Evaluation;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingsSnapshotEvaluationConfidenceEnricherTests
{
    [Fact]
    public async Task TryEnrichAsync_uses_latest_trace_per_task_when_engine_type_fallback_applies()
    {
        Guid runGuid = Guid.Parse("40404040-4040-4040-4040-404040404040");
        const string runKey = "40404040404040404040404040404040";
        const string taskId = "task-topology-retry";
        string goodJson = LoadGoldenFixture("golden-agent-result-valid.json");
        DateTime utcNow = new(2026, 8, 19, 12, 0, 0, DateTimeKind.Utc);

        AgentExecutionTrace supersededTrace = new()
        {
            TraceId = "trace-superseded",
            TaskId = taskId,
            RunId = runKey,
            AgentType = AgentType.Topology,
            ParseSucceeded = false,
            ParsedResultJson = null,
            AttemptIndex = 1,
            CreatedUtc = utcNow.AddMinutes(-10),
        };

        AgentExecutionTrace latestTrace = new()
        {
            TraceId = "trace-latest",
            TaskId = taskId,
            RunId = runKey,
            AgentType = AgentType.Topology,
            ParseSucceeded = true,
            ParsedResultJson = goodJson,
            AttemptIndex = 2,
            CreatedUtc = utcNow,
        };

        Finding finding = new()
        {
            FindingId = "finding-topology",
            FindingType = "AgentArchitectureFinding-Topology",
            Category = "Security",
            EngineType = AgentType.Topology.ToString(),
            Severity = FindingSeverity.Error,
            Title = "Topology finding with explainability trace for confidence scoring.",
            Rationale = "Topology finding with explainability trace for confidence scoring.",
            Trace = new ExplainabilityTrace
            {
                RulesApplied = ["agent-Topology"],
                DecisionsTaken = ["Recorded architecture finding from Topology agent."],
                Notes = ["evidence:ev-1"],
                Citations = ["ev-1"],
            },
        };

        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = runGuid,
            Findings = [finding],
        };

        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("10101010-1010-1010-1010-101010101010"),
            WorkspaceId = Guid.Parse("20202020-2020-2020-2020-202020202020"),
            ProjectId = Guid.Parse("30303030-3030-3030-3030-303030303030"),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);

        Mock<IAgentExecutionTraceRepository> traceRepository = new();
        traceRepository
            .Setup(r => r.GetByRunIdAsync(scope, runKey, It.IsAny<CancellationToken>()))
            .ReturnsAsync([supersededTrace, latestTrace]);

        FindingsSnapshotEvaluationConfidenceEnricher sut = CreateSut(traceRepository.Object, scopeProvider.Object);

        await sut.TryEnrichAsync(snapshot, CancellationToken.None);

        finding.EvaluationConfidenceScore.Should().NotBeNull();
        finding.EvaluationConfidenceScore.Should().BeGreaterThan(44);
    }

    [Fact]
    public async Task TryEnrichAsync_matches_trace_by_id_when_multiple_topology_tasks_exist()
    {
        Guid runGuid = Guid.Parse("50505050-5050-5050-5050-505050505050");
        const string runKey = "50505050505050505050505050505050";
        const string taskPassing = "task-passing";
        const string taskUnparsed = "task-unparsed";
        string goodJson = LoadGoldenFixture("golden-agent-result-valid.json");

        AgentExecutionTrace passingTrace = new()
        {
            TraceId = "trace-passing",
            TaskId = taskPassing,
            RunId = runKey,
            AgentType = AgentType.Topology,
            ParseSucceeded = true,
            ParsedResultJson = goodJson,
        };

        AgentExecutionTrace unparsedTrace = new()
        {
            TraceId = "trace-unparsed",
            TaskId = taskUnparsed,
            RunId = runKey,
            AgentType = AgentType.Topology,
            ParseSucceeded = false,
            ParsedResultJson = null,
        };

        Finding passingFinding = CreateTopologyFinding("finding-passing", "trace-passing");
        Finding unparsedFinding = CreateTopologyFinding("finding-unparsed", "trace-unparsed");

        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = runGuid,
            Findings = [passingFinding, unparsedFinding],
        };

        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("10101010-1010-1010-1010-101010101010"),
            WorkspaceId = Guid.Parse("20202020-2020-2020-2020-202020202020"),
            ProjectId = Guid.Parse("30303030-3030-3030-3030-303030303030"),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);

        Mock<IAgentExecutionTraceRepository> traceRepository = new();
        traceRepository
            .Setup(r => r.GetByRunIdAsync(scope, runKey, It.IsAny<CancellationToken>()))
            .ReturnsAsync([passingTrace, unparsedTrace]);

        FindingsSnapshotEvaluationConfidenceEnricher sut = CreateSut(traceRepository.Object, scopeProvider.Object);

        await sut.TryEnrichAsync(snapshot, CancellationToken.None);

        passingFinding.EvaluationConfidenceScore.Should().NotBeNull();
        unparsedFinding.EvaluationConfidenceScore.Should().NotBeNull();
        unparsedFinding.EvaluationConfidenceScore.Should().BeLessThan(passingFinding.EvaluationConfidenceScore!.Value);
        unparsedFinding.EvaluationConfidenceScore.Should().BeLessThan(35);
    }

    private static Finding CreateTopologyFinding(string findingId, string traceId)
    {
        return new Finding
        {
            FindingId = findingId,
            FindingType = "AgentArchitectureFinding-Topology",
            Category = "Security",
            EngineType = AgentType.Topology.ToString(),
            Severity = FindingSeverity.Error,
            Title = "Topology finding with explainability trace for confidence scoring.",
            Rationale = "Topology finding with explainability trace for confidence scoring.",
            AgentExecutionTraceId = traceId,
            Trace = new ExplainabilityTrace
            {
                SourceAgentExecutionTraceId = traceId,
                RulesApplied = ["agent-Topology"],
                DecisionsTaken = ["Recorded architecture finding from Topology agent."],
                Notes = ["evidence:ev-1"],
                Citations = ["ev-1"],
            },
        };
    }

    private static FindingsSnapshotEvaluationConfidenceEnricher CreateSut(
        IAgentExecutionTraceRepository traceRepository,
        IScopeContextProvider scopeProvider)
    {
        AgentOutputQualityGateOptions gateOptions = new() { Enabled = true };

        Mock<IOptionsMonitor<AgentExecutionReferenceEvaluationOptions>> referenceOptions = new();
        referenceOptions.Setup(o => o.CurrentValue).Returns(new AgentExecutionReferenceEvaluationOptions { Enabled = false });

        HeuristicOnlyAgentOutputSemanticEvaluator semanticFacade = new(new HeuristicAgentOutputSemanticEvaluator());
        AgentOutputReferenceCaseRunEvaluator referenceEvaluator = new(
            referenceOptions.Object,
            new EmptyReferenceCatalog(),
            new AgentOutputEvaluator(),
            semanticFacade,
            new NoOpAgentOutputEvaluationResultRepository(),
            NullLogger<AgentOutputReferenceCaseRunEvaluator>.Instance);

        AgentEvaluationConfidencePipeline pipeline = new(
            traceRepository,
            new InMemoryAgentEvidencePackageRepository(),
            scopeProvider,
            new AgentOutputEvaluator(),
            semanticFacade,
            new AgentOutputQualityGate(Options.Create(gateOptions)),
            Options.Create(gateOptions),
            referenceEvaluator,
            new AgentResultEvidenceFaithfulnessChecker(Options.Create(new AgentFaithfulnessOptions())),
            new FindingConfidenceCalculator());

        return new FindingsSnapshotEvaluationConfidenceEnricher(
            pipeline,
            NullLogger<FindingsSnapshotEvaluationConfidenceEnricher>.Instance);
    }

    private static string LoadGoldenFixture(string fileName)
    {
        string path = Path.Combine(AppContext.BaseDirectory, "Fixtures", "GoldenAgentResults", fileName);

        return File.ReadAllText(path);
    }

    private sealed class EmptyReferenceCatalog : IAgentOutputReferenceCaseCatalog
    {
        public IReadOnlyList<AgentOutputReferenceCaseDefinition> Cases { get; } = [];
    }

    private sealed class NoOpAgentOutputEvaluationResultRepository : IAgentOutputEvaluationResultRepository
    {
        public Task AppendAsync(AgentOutputEvaluationResultRecord row, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;
    }
}
