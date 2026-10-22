using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.AgentRuntime.Evaluation.ReferenceCases;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests.Evaluation;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentEvaluationConfidencePipelineTests
{
    [Fact]
    public async Task EvaluateTraceSignalsAsync_applies_real_only_finding_coverage_to_real_result()
    {
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
            StructuralRejectBelow = 0,
            SemanticRejectBelow = 0,
            StructuralWarnBelow = 0,
            SemanticWarnBelow = 0,
            PilotStrictMinStructuralCompleteness = 0,
            PilotStrictMinSemanticScore = 0,
            PilotStrictMinEvidenceRefCount = 0,
            PilotStrictMinCitationCoverageRatio = 0.5,
        };

        AgentExecutionTrace trace = new()
        {
            TraceId = "trace-simulator",
            RunId = "run-1",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            ParseSucceeded = true,
            ParsedResultJson =
                """
                {"resultId":"result-1","taskId":"task-1","runId":"run-1","agentType":1,"claims":[],"evidenceRefs":[],"confidence":0.5,"findings":[{"findingId":"finding-1","severity":"High","description":"Long enough description text for semantic scoring.","enforcementTier":"PolicyViolation","evidenceRefs":[]}],"proposedChanges":null,"createdUtc":"2026-01-01T00:00:00Z","citations":[{"source":"ev-1"}]}
                """
        };

        AgentResult persistedResult = new()
        {
            TaskId = trace.TaskId,
            RunId = trace.RunId,
            AgentType = trace.AgentType,
            TaskStructuralExecutionMode = StructuralExecutionMode.Real
        };

        Mock<IAgentExecutionTraceRepository> traceRepository = new();
        Mock<IAgentEvidencePackageRepository> evidenceRepository = new();
        Mock<IAgentResultRepository> resultRepository = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        Mock<IAgentOutputQualityGateOptionsResolver> optionsResolver = new();
        Mock<IAgentOutputReferenceCaseCatalog> referenceCatalog = new();
        Mock<IAgentOutputEvaluationResultRepository> referenceResultRepository = new();
        Mock<IOptionsMonitor<AgentExecutionReferenceEvaluationOptions>> referenceOptions = new();
        Mock<IAgentOutputFaithfulnessEvaluator> faithfulnessEvaluator = new();

        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(scope);
        resultRepository
            .Setup(repository => repository.GetByRunIdAsync(
                It.IsAny<ScopeContext>(),
                trace.RunId,
                It.IsAny<CancellationToken>(),
                null,
                null))
            .ReturnsAsync([persistedResult]);
        evidenceRepository
            .Setup(repository => repository.GetByRunIdAsync(trace.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AgentEvidencePackage?)null);
        optionsResolver.Setup(resolver => resolver.Resolve(It.IsAny<CancellationToken>())).Returns(options);
        referenceOptions.SetupGet(monitor => monitor.CurrentValue)
            .Returns(new AgentExecutionReferenceEvaluationOptions { Enabled = false });
        referenceCatalog.SetupGet(catalog => catalog.Cases).Returns([]);

        AgentOutputReferenceCaseRunEvaluator referenceEvaluator = new(
            referenceOptions.Object,
            referenceCatalog.Object,
            new AgentOutputEvaluator(),
            new HeuristicOnlyAgentOutputSemanticEvaluator(new HeuristicAgentOutputSemanticEvaluator()),
            referenceResultRepository.Object,
            NullLogger<AgentOutputReferenceCaseRunEvaluator>.Instance);

        AgentEvaluationConfidencePipeline pipeline = new(
            traceRepository.Object,
            evidenceRepository.Object,
            resultRepository.Object,
            scopeProvider.Object,
            new AgentOutputEvaluator(),
            new HeuristicOnlyAgentOutputSemanticEvaluator(new HeuristicAgentOutputSemanticEvaluator()),
            new AgentOutputQualityGate(Options.Create(options)),
            optionsResolver.Object,
            referenceEvaluator,
            new AgentResultEvidenceFaithfulnessChecker(Options.Create(new AgentFaithfulnessOptions())),
            faithfulnessEvaluator.Object,
            Options.Create(new AgentOutputLlmFaithfulnessOptions()),
            Options.Create(new AgentExecutionOptions { Mode = "Real" }),
            new FindingConfidenceCalculator());

        (bool schemaPassed, bool referenceMatched) result =
            await pipeline.EvaluateTraceSignalsAsync(
                trace,
                evidence: null,
                new Dictionary<string, double?>(),
                CancellationToken.None,
                taskStructuralExecutionMode: null);

        result.schemaPassed.Should().BeFalse();
        result.referenceMatched.Should().BeFalse();
    }

    [Fact]
    public async Task TryEnrichCoreAsync_uses_latest_agent_result_execution_mode_for_duplicate_task_results()
    {
        const string runId = "run-duplicate-modes";
        const string taskId = "task-retried";
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        Mock<IAgentExecutionTraceRepository> traceRepository = new();
        Mock<IAgentEvidencePackageRepository> evidenceRepository = new();
        Mock<IAgentResultRepository> resultRepository = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        Mock<IAgentOutputQualityGateOptionsResolver> optionsResolver = new();
        Mock<IAgentOutputFaithfulnessEvaluator> faithfulnessEvaluator = new();
        Mock<IAgentOutputEvaluationResultRepository> referenceResultRepository = new();
        Mock<IAgentOutputReferenceCaseCatalog> referenceCatalog = new();
        Mock<IOptionsMonitor<AgentExecutionReferenceEvaluationOptions>> referenceOptions = new();
        referenceOptions.SetupGet(monitor => monitor.CurrentValue)
            .Returns(new AgentExecutionReferenceEvaluationOptions { Enabled = false });
        referenceCatalog.SetupGet(catalog => catalog.Cases).Returns([]);

        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(scope);
        traceRepository
            .Setup(repository => repository.GetByRunIdAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        evidenceRepository
            .Setup(repository => repository.GetByRunIdAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AgentEvidencePackage?)null);
        resultRepository
            .Setup(repository => repository.GetByRunIdAsync(
                scope,
                runId,
                It.IsAny<CancellationToken>(),
                null,
                null))
            .ReturnsAsync(
            [
                new AgentResult
                {
                    ResultId = "result-old",
                    TaskId = taskId,
                    RunId = runId,
                    CreatedUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    TaskStructuralExecutionMode = StructuralExecutionMode.Simulator
                },
                new AgentResult
                {
                    ResultId = "result-latest",
                    TaskId = taskId,
                    RunId = runId,
                    CreatedUtc = new DateTime(2026, 1, 1, 0, 1, 0, DateTimeKind.Utc),
                    TaskStructuralExecutionMode = StructuralExecutionMode.Real
                }
            ]);
        optionsResolver.Setup(resolver => resolver.Resolve(It.IsAny<CancellationToken>()))
            .Returns(new AgentOutputQualityGateOptions());
        referenceOptions.SetupGet(monitor => monitor.CurrentValue)
            .Returns(new AgentExecutionReferenceEvaluationOptions { Enabled = false });

        AgentOutputReferenceCaseRunEvaluator referenceEvaluator = new(
            referenceOptions.Object,
            referenceCatalog.Object,
            new AgentOutputEvaluator(),
            new HeuristicOnlyAgentOutputSemanticEvaluator(new HeuristicAgentOutputSemanticEvaluator()),
            referenceResultRepository.Object,
            NullLogger<AgentOutputReferenceCaseRunEvaluator>.Instance);

        AgentEvaluationConfidencePipeline pipeline = new(
            traceRepository.Object,
            evidenceRepository.Object,
            resultRepository.Object,
            scopeProvider.Object,
            new AgentOutputEvaluator(),
            new HeuristicOnlyAgentOutputSemanticEvaluator(new HeuristicAgentOutputSemanticEvaluator()),
            new AgentOutputQualityGate(Options.Create(new AgentOutputQualityGateOptions())),
            optionsResolver.Object,
            referenceEvaluator,
            new AgentResultEvidenceFaithfulnessChecker(Options.Create(new AgentFaithfulnessOptions())),
            faithfulnessEvaluator.Object,
            Options.Create(new AgentOutputLlmFaithfulnessOptions()),
            Options.Create(new AgentExecutionOptions { Mode = "Simulator" }),
            new FindingConfidenceCalculator());

        StructuralExecutionMode? capturedMode = null;

        await pipeline.TryEnrichCoreAsync(
            runId,
            (context, _) =>
            {
                capturedMode = context.StructuralExecutionModeByTaskId[taskId];
                return Task.CompletedTask;
            },
            CancellationToken.None);

        capturedMode.Should().Be(StructuralExecutionMode.Real);
    }

    [Theory]
    [InlineData("trace-abc-123", "trace-abc-123")]
    [InlineData("TRACE-ABC-123", "trace-abc-123")]
    public void TraceIdsLikelyMatch_returns_true_for_exact_ids(string persistedTraceId, string findingKey)
    {
        AgentEvaluationConfidencePipeline.TraceIdsLikelyMatch(persistedTraceId, findingKey).Should().BeTrue();
    }

    [Fact]
    public void TraceIdsLikelyMatch_returns_true_for_matching_32_character_prefix()
    {
        string prefix = new('a', 32);
        string persistedTraceId = prefix + "suffix-one";
        string findingKey = prefix + "suffix-two";

        AgentEvaluationConfidencePipeline.TraceIdsLikelyMatch(persistedTraceId, findingKey).Should().BeTrue();
    }

    [Theory]
    [InlineData("", "trace")]
    [InlineData("trace", "")]
    public void TraceIdsLikelyMatch_returns_false_for_empty_ids(string persistedTraceId, string findingKey)
    {
        AgentEvaluationConfidencePipeline.TraceIdsLikelyMatch(persistedTraceId, findingKey).Should().BeFalse();
    }

    [Fact]
    public void ResolveTraceForSnapshotFinding_uses_prefix_trace_id_match_before_engine_type_fallback()
    {
        const string sharedPrefix = "11111111111111111111111111111111";
        AgentExecutionTrace matchingTrace = new()
        {
            TraceId = sharedPrefix + "persisted",
            TaskId = "task-a",
            RunId = "run",
            AgentType = AgentType.Topology,
            ParseSucceeded = true,
            ParsedResultJson = "{}",
        };

        AgentExecutionTrace otherTopologyTrace = new()
        {
            TraceId = "trace-other",
            TaskId = "task-b",
            RunId = "run",
            AgentType = AgentType.Topology,
            ParseSucceeded = false,
            ParsedResultJson = null,
        };

        AgentEvaluationConfidenceRunContext context = new()
        {
            Scope = new ScopeContext
            {
                TenantId = Guid.Parse("10101010-1010-1010-1010-101010101010"),
                WorkspaceId = Guid.Parse("20202020-2020-2020-2020-202020202020"),
                ProjectId = Guid.Parse("30303030-3030-3030-3030-303030303030"),
            },
            LatestTraces = [matchingTrace, otherTopologyTrace],
            TraceByAgentType = new Dictionary<AgentType, AgentExecutionTrace>
            {
                [AgentType.Topology] = otherTopologyTrace,
            },
            TraceByTaskId = new Dictionary<string, AgentExecutionTrace>(StringComparer.OrdinalIgnoreCase)
            {
                [matchingTrace.TaskId] = matchingTrace,
                [otherTopologyTrace.TaskId] = otherTopologyTrace,
            },
            CalibratedConfidenceByTaskId = new Dictionary<string, double?>(StringComparer.Ordinal),
            StructuralExecutionModeByTaskId = new Dictionary<string, StructuralExecutionMode?>(
                StringComparer.OrdinalIgnoreCase),
        };

        Finding finding = new()
        {
            FindingId = "finding-prefix",
            EngineType = AgentType.Topology.ToString(),
            AgentExecutionTraceId = sharedPrefix + "finding-key",
        };

        AgentExecutionTrace? resolved =
            AgentEvaluationConfidencePipeline.ResolveTraceForSnapshotFinding(finding, context);

        resolved.Should().BeSameAs(matchingTrace);
    }
}
