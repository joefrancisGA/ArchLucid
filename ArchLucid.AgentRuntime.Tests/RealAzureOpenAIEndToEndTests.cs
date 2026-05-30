using System.Text.Json;

using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Capabilities.Cost;
using CapabilitiesCostAgentHandler = ArchLucid.Capabilities.Cost.CostAgentHandler;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;

using ArchLucid.AgentRuntime.Tests.Support;

using ArchLucid.Decisioning.Merge;
using ArchLucid.Decisioning.Validation;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Application.Runs.Orchestration;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

/// <summary>
///     Optional live Azure OpenAI integration: set <c>ARCHLUCID_REAL_AOAI_TEST_ENDPOINT</c> and
///     <c>ARCHLUCID_REAL_AOAI_TEST_KEY</c>. Optional <c>ARCHLUCID_REAL_AOAI_TEST_DEPLOYMENT</c> (defaults to
///     <c>gpt-4o</c>). When <c>ARCHLUCID_REAL_LLM_RUN_METRICS_JSON</c> is set to an absolute path (done by
///     <c>scripts/Invoke-RealLlmEvidenceGate.ps1</c>), a camelCase metrics JSON file is written after the test passes.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
[Trait("Category", "Slow")]
// ReSharper disable once InconsistentNaming
public sealed class RealAzureOpenAIEndToEndTests
{
    private static bool HasLiveAzureOpenAiCredentials()
    {
        return RealLiveAoaiTestConfiguration.TryGetLiveCredentials(out _);
    }

    [SkippableFact]
    public async Task Live_pipeline_topology_compliance_cost_merge_produces_non_empty_manifest()
    {
        Skip.IfNot(HasLiveAzureOpenAiCredentials(),
            "Set ARCHLUCID_REAL_AOAI_TEST_ENDPOINT and ARCHLUCID_REAL_AOAI_TEST_KEY.");

        using CancellationTokenSource deadline = new(TimeSpan.FromSeconds(120));
        CancellationToken cancellationToken = deadline.Token;

        RealLiveAoaiTestConfiguration.LiveCredentials live =
            RealLiveAoaiTestConfiguration.TryGetLiveCredentials(out RealLiveAoaiTestConfiguration.LiveCredentials creds)
                ? creds
                : throw new InvalidOperationException("Live credentials required.");

        string endpoint = live.Endpoint;
        string apiKey = live.ApiKey;
        string deployment = live.Deployment;

        AzureOpenAiCompletionClient completion = new(
            endpoint,
            apiKey,
            deployment,
            AzureOpenAiCompletionClient.DefaultMaxCompletionTokens);

        AgentResultParser parser = new();
        LiveAoaiTraceSpy traceSpy = new();
        IAgentSystemPromptCatalog promptCatalog = AgentPromptCatalogTestFactory.Create();

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(
            new ScopeContext
            {
                TenantId = ScopeIds.DefaultTenant,
                WorkspaceId = ScopeIds.DefaultWorkspace,
                ProjectId = ScopeIds.DefaultProject
            });

        IOptionsMonitor<AgentSchemaRemediationOptions> schemaRemediation =
            AgentSchemaRemediationOptionsMonitorTestFactory.Create(maxCompletionAttempts: 3);

        TopologyAgentHandler topology = new(
            AgentTierCompletionRouterTestFactory.CreatePassThrough(completion),
            SchemaRemediationCompletionClientTestFactory.Create(completion),
            parser,
            traceSpy,
            promptCatalog,
            audit.Object,
            scopeProvider.Object,
            ComplianceAgentHandlerTestDependencies.CreateEmptyRetrievalQueryService(),
            ComplianceAgentHandlerTestDependencies.CreateNoOpGroundingTraceWriter(),
            schemaRemediation,
            ComplianceAgentHandlerTestDependencies.CreateTopologyNullLogger());

        ComplianceAgentHandler compliance = new(
            AgentTierCompletionRouterTestFactory.CreatePassThrough(completion),
            SchemaRemediationCompletionClientTestFactory.Create(completion),
            parser,
            traceSpy,
            promptCatalog,
            audit.Object,
            scopeProvider.Object,
            ComplianceAgentHandlerTestDependencies.CreateEmptyRetrievalQueryService(),
            ComplianceAgentHandlerTestDependencies.CreateCitationFormatter(),
            ComplianceAgentHandlerTestDependencies.CreateNoOpGroundingTraceWriter(),
            schemaRemediation,
            ComplianceAgentHandlerTestDependencies.CreateNullLogger());

        CapabilitiesCostAgentHandler cost = new();

        CriticAgentHandler critic = new(
            AgentTierCompletionRouterTestFactory.CreatePassThrough(completion),
            SchemaRemediationCompletionClientTestFactory.Create(completion),
            parser,
            traceSpy,
            promptCatalog,
            audit.Object,
            scopeProvider.Object,
            schemaRemediation);

        IOptions<AgentExecutionResilienceOptions> resilience = Options.Create(
            new AgentExecutionResilienceOptions { MaxConcurrentHandlers = 0, PerHandlerTimeoutSeconds = 0 });

        RealAgentExecutor executor = new(
            [topology, compliance, cost, critic],
            NullLogger<RealAgentExecutor>.Instance,
            new MixedModePromptMonitor(new AgentPromptCatalogOptions()),
            new FixedScopeProviderForLiveAoai(),
            new AgentHandlerConcurrencyGate(resilience),
            resilience,
            Options.Create(new StagedCriticAgentOptions()),
            Options.Create(new AgentOutputQualityGateOptions()),
            new NoOpPromptRedactor(),
            new FixedValueOptionsMonitor<ArchLucidLlmOptions>(new ArchLucidLlmOptions()),
            new InMemoryAgentResultRepository());

        ArchitectureRequest request = new()
        {
            RequestId = "real-aoai-" + Guid.NewGuid().ToString("N"),
            SystemName = "ContosoRetailWeb",
            Description =
                "Design a 3-tier web application on Azure with SQL backend, Redis cache, and App Service frontend "
                + "(minimum ten characters for agent context).",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Constraints =
            [
                "Prefer managed services",
                "Private endpoints for data tiers"
            ],
            RequiredCapabilities =
            [
                "Azure SQL",
                "Azure Cache for Redis",
                "App Service"
            ]
        };

        Mock<IRunRepository> runRepo = new();
        runRepo.Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        ArchitectureRunAuthorityCoordination coordinator = new(
            new FakeAuthorityRunOrchestratorForLiveAoai(),
            runRepo.Object,
            scopeProvider.Object,
            new NoOpAzureExtractorPackageRepository(),
            new RunStateTransitionService(),
            NullLogger<ArchitectureRunAuthorityCoordination>.Instance);

        CoordinationResult coordination = await coordinator.CreateRunAsync(request, cancellationToken);

        coordination.Success.Should().BeTrue();

        string runId = coordination.Run.RunId;

        foreach (AgentTask task in coordination.Tasks)
        {
            task.RunId = runId;
        }

        AgentEvidencePackage evidence = new()
        {
            RunId = runId,
            RequestId = request.RequestId,
            SystemName = request.SystemName,
            Environment = request.Environment,
            CloudProvider = request.CloudProvider.ToString(),
            Request = new RequestEvidence
            {
                Description = request.Description,
                Constraints = request.Constraints.ToList(),
                RequiredCapabilities = request.RequiredCapabilities.ToList(),
                Assumptions = request.Assumptions.ToList()
            }
        };

        IReadOnlyList<AgentResult> results =
            await executor.ExecuteAsync(runId, request, evidence, coordination.Tasks, cancellationToken);

        results.Should().HaveCount(4);

        foreach (AgentResult r in results)
        {
            AssertLiveAgentResultHasSubstance(r);
        }

        SchemaValidationService validationService = new(
            NullLogger<SchemaValidationService>.Instance,
            Options.Create(new SchemaValidationOptions()));

        DecisionEngineService engine = new(validationService);
        DecisionMergeResult merge = engine.MergeResults(runId, request, "v1", results, [], []);

        bool anyCitation = traceSpy.RawResponses.Any(static s => s.Contains("evidenceRefs", StringComparison.Ordinal));
        anyCitation.Should().BeTrue("trace should include evidence references for explainability");

        TryWriteRealLlmRunMetricsJson(
            traceSpy,
            merge,
            results,
            deployment,
            anyCitation,
            RealLiveAoaiEvidenceProfiles.FullPipeline);

        merge.Success.Should().BeTrue();
        merge.Manifest.Services.Count.Should().BeGreaterThan(0);
        merge.Decisions.Count.Should().BeGreaterThan(0);
    }

    /// <summary>
    ///     Focused live smoke: one Topology agent call against Azure OpenAI. Used by
    ///     <c>scripts/Invoke-RealLlmEvidenceGate.ps1</c> for assessment improvement #1 evidence capture.
    /// </summary>
    [SkippableFact]
    public async Task Live_topology_agent_only_produces_valid_agent_result()
    {
        Skip.IfNot(HasLiveAzureOpenAiCredentials(),
            "Set ARCHLUCID_REAL_AOAI_TEST_ENDPOINT and ARCHLUCID_REAL_AOAI_TEST_KEY.");

        using CancellationTokenSource deadline = new(TimeSpan.FromSeconds(120));
        CancellationToken cancellationToken = deadline.Token;

        RealLiveAoaiTestConfiguration.LiveCredentials live =
            RealLiveAoaiTestConfiguration.TryGetLiveCredentials(out RealLiveAoaiTestConfiguration.LiveCredentials creds)
                ? creds
                : throw new InvalidOperationException("Live credentials required.");

        string endpoint = live.Endpoint;
        string apiKey = live.ApiKey;
        string deployment = live.Deployment;

        AzureOpenAiCompletionClient completion = new(
            endpoint,
            apiKey,
            deployment,
            AzureOpenAiCompletionClient.DefaultMaxCompletionTokens);

        AgentResultParser parser = new();
        LiveAoaiTraceSpy traceSpy = new();
        IAgentSystemPromptCatalog promptCatalog = AgentPromptCatalogTestFactory.Create();

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(
            new ScopeContext
            {
                TenantId = ScopeIds.DefaultTenant,
                WorkspaceId = ScopeIds.DefaultWorkspace,
                ProjectId = ScopeIds.DefaultProject
            });

        IOptionsMonitor<AgentSchemaRemediationOptions> schemaRemediation =
            AgentSchemaRemediationOptionsMonitorTestFactory.Create(maxCompletionAttempts: 3);

        TopologyAgentHandler topology = new(
            AgentTierCompletionRouterTestFactory.CreatePassThrough(completion),
            SchemaRemediationCompletionClientTestFactory.Create(completion),
            parser,
            traceSpy,
            promptCatalog,
            audit.Object,
            scopeProvider.Object,
            ComplianceAgentHandlerTestDependencies.CreateEmptyRetrievalQueryService(),
            ComplianceAgentHandlerTestDependencies.CreateNoOpGroundingTraceWriter(),
            schemaRemediation,
            ComplianceAgentHandlerTestDependencies.CreateTopologyNullLogger());

        string runId = Guid.NewGuid().ToString("N");
        string taskId = Guid.NewGuid().ToString("N");

        ArchitectureRequest request = new()
        {
            RequestId = "real-aoai-topology-" + Guid.NewGuid().ToString("N"),
            SystemName = "ContosoRetailWeb",
            Description =
                "Design a 3-tier web application on Azure with SQL backend, Redis cache, and App Service frontend.",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Constraints = ["Prefer managed services", "Private endpoints for data tiers"],
            RequiredCapabilities = ["Azure SQL", "Azure Cache for Redis", "App Service"]
        };

        AgentEvidencePackage evidence = new()
        {
            RunId = runId,
            RequestId = request.RequestId,
            SystemName = request.SystemName,
            Environment = request.Environment,
            CloudProvider = request.CloudProvider.ToString(),
            Request = new RequestEvidence
            {
                Description = request.Description,
                Constraints = request.Constraints.ToList(),
                RequiredCapabilities = request.RequiredCapabilities.ToList(),
                Assumptions = request.Assumptions.ToList()
            }
        };

        AgentTask task = new()
        {
            TaskId = taskId,
            RunId = runId,
            AgentType = AgentType.Topology,
            AgentTypeKey = AgentTypeKeys.Topology
        };

        AgentResult result = await topology.ExecuteAsync(runId, request, evidence, task, cancellationToken);

        bool anyCitation = traceSpy.RawResponses.Any(static s => s.Contains("evidenceRefs", StringComparison.Ordinal));
        AssertLiveTopologySmokeResult(result, anyCitation);

        SchemaValidationService validationService = new(
            NullLogger<SchemaValidationService>.Instance,
            Options.Create(new SchemaValidationOptions()));

        DecisionEngineService engine = new(validationService);
        DecisionMergeResult merge = engine.MergeResults(runId, request, "v1", [result], [], []);

        // Topology-only smoke: require parsed real LLM output; merge may stay partial without full proposedChanges.
        TryWriteRealLlmRunMetricsJson(
            traceSpy,
            merge,
            [result],
            deployment,
            anyCitation,
            RealLiveAoaiEvidenceProfiles.TopologyOnly);
    }

    private static void AssertLiveAgentResultHasSubstance(AgentResult result)
    {
        int topologyItems = (result.ProposedChanges?.AddedServices.Count ?? 0)
            + (result.ProposedChanges?.AddedDatastores.Count ?? 0)
            + (result.ProposedChanges?.AddedRelationships.Count ?? 0);

        (result.Claims.Count > 0 || result.Findings.Count > 0 || topologyItems > 0)
            .Should()
            .BeTrue("live AgentResult should include claims, findings, or topology proposal items");
    }

    private static void AssertLiveTopologySmokeResult(AgentResult result, bool evidenceRefsInTrace)
    {
        AssertLiveAgentResultHasSubstance(result);

        bool hasEvidenceRefs = result.EvidenceRefs.Count > 0 || evidenceRefsInTrace;

        hasEvidenceRefs.Should().BeTrue("topology smoke should surface evidence references in result or trace");
    }

    /// <summary>
    ///     Computes a USD cost estimate from raw token counts using per-million rates sourced from environment variables
    ///     (<c>ARCHLUCID_REAL_LLM_INPUT_RATE_USD_PER_M</c>, <c>ARCHLUCID_REAL_LLM_OUTPUT_RATE_USD_PER_M</c>).
    ///     Falls back to GPT-4o published rates ($5 / $15 per million) when the variables are absent.
    ///     Returns null when both token counts are zero (provider did not return usage).
    /// </summary>
    private static decimal? EstimateGateCostUsd(int inputTokens, int outputTokens, string deploymentName)
    {
        if (inputTokens <= 0 && outputTokens <= 0)
            return null;

        _ = deploymentName; // reserved for per-deployment rate tables in a future pass

        decimal inputRatePerM = TryParseEnvDecimal("ARCHLUCID_REAL_LLM_INPUT_RATE_USD_PER_M", 5.00m);
        decimal outputRatePerM = TryParseEnvDecimal("ARCHLUCID_REAL_LLM_OUTPUT_RATE_USD_PER_M", 15.00m);

        return inputTokens * inputRatePerM / 1_000_000m
             + outputTokens * outputRatePerM / 1_000_000m;
    }

    private static decimal TryParseEnvDecimal(string variable, decimal fallback)
    {
        string? raw = Environment.GetEnvironmentVariable(variable);

        if (string.IsNullOrWhiteSpace(raw))
            return fallback;

        return decimal.TryParse(raw.Trim(), System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out decimal parsed)
            ? parsed
            : fallback;
    }

    /// <summary>
    ///     When <c>ARCHLUCID_REAL_LLM_RUN_METRICS_JSON</c> is set (absolute path), writes camelCase JSON for
    ///     <c>scripts/Invoke-RealLlmEvidenceGate.ps1</c>. No-op when unset.
    /// </summary>
    private static void TryWriteRealLlmRunMetricsJson(
        LiveAoaiTraceSpy traceSpy,
        DecisionMergeResult merge,
        IReadOnlyList<AgentResult> results,
        string deploymentName,
        bool evidenceRefsObserved,
        string liveEvidenceProfile)
    {
        string? path = Environment.GetEnvironmentVariable("ARCHLUCID_REAL_LLM_RUN_METRICS_JSON");

        if (string.IsNullOrWhiteSpace(path))
            return;

        int parseFailures = traceSpy.ParseOutcomeHistory.Count(static x => !x.ParseSucceeded);

        decimal? estimatedCostUsd = EstimateGateCostUsd(
            traceSpy.InputTokensTotal,
            traceSpy.OutputTokensTotal,
            deploymentName);

        Dictionary<string, object?> payload = new()
        {
            ["generatedUtc"] = DateTime.UtcNow.ToString("o"),
            ["deploymentName"] = deploymentName.Trim(),
            ["liveEvidenceProfile"] = liveEvidenceProfile,
            ["mergeSuccess"] = merge.Success,
            ["manifestServiceCount"] = merge.Manifest.Services.Count,
            ["decisionsCount"] = merge.Decisions.Count,
            ["totalClaims"] = results.Sum(static r => r.Claims.Count),
            ["totalFindings"] = results.Sum(static r => r.Findings.Count),
            ["topologyProposalItemCount"] = results.Sum(static r =>
                (r.ProposedChanges?.AddedServices.Count ?? 0)
                + (r.ProposedChanges?.AddedDatastores.Count ?? 0)
                + (r.ProposedChanges?.AddedRelationships.Count ?? 0)),
            ["parseAttempts"] = traceSpy.ParseOutcomeHistory.Count,
            ["parseFailures"] = parseFailures,
            ["inputTokensTotal"] = traceSpy.InputTokensTotal,
            ["outputTokensTotal"] = traceSpy.OutputTokensTotal,
            ["estimatedCostUsd"] = estimatedCostUsd,
            ["semanticScoreCaptured"] = false,
            ["evidenceRefsObserved"] = evidenceRefsObserved,
            ["traceRecorderInvocations"] = traceSpy.RawResponses.Count,
            ["durableSqlPersistenceExercised"] = false
        };

        JsonSerializerOptions options = new()
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        string json = JsonSerializer.Serialize(payload, options);
        Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(path))!);
        File.WriteAllText(path.Trim(), json);
    }

    private sealed class LiveAoaiTraceSpy : IAgentExecutionTraceRecorder
    {
        public List<string> RawResponses
        {
            get;
        } = [];

        public List<(bool ParseSucceeded, int? InputTokens, int? OutputTokens)> ParseOutcomeHistory
        {
            get;
        } = [];

        public int InputTokensTotal
        {
            get;
            private set;
        }

        public int OutputTokensTotal
        {
            get;
            private set;
        }

        public Task RecordAsync(
            string runId,
            string taskId,
            AgentType agentType,
            string systemPrompt,
            string userPrompt,
            string rawResponse,
            string? parsedResultJson,
            bool parseSucceeded,
            string? errorMessage,
            AgentPromptReproMetadata? promptRepro = null,
            int? inputTokenCount = null,
            int? outputTokenCount = null,
            int? reasoningTokenCount = null,
            string? modelDeploymentName = null,
            string? modelVersion = null,
            bool isSimulatorExecution = false,
            string? failureReasonCode = null,
            CancellationToken cancellationToken = default)
        {
            RawResponses.Add(rawResponse);
            ParseOutcomeHistory.Add((parseSucceeded, inputTokenCount, outputTokenCount));

            if (inputTokenCount is { } ip and > 0)
                InputTokensTotal += ip;

            if (outputTokenCount is { } op and > 0)
                OutputTokensTotal += op;

            return Task.CompletedTask;
        }
    }

    private sealed class FixedScopeProviderForLiveAoai : IScopeContextProvider
    {
        public ScopeContext GetCurrentScope()
        {
            return new ScopeContext
            {
                TenantId = ScopeIds.DefaultTenant,
                WorkspaceId = ScopeIds.DefaultWorkspace,
                ProjectId = ScopeIds.DefaultProject
            };
        }
    }

    private sealed class MixedModePromptMonitor(AgentPromptCatalogOptions value)
        : IOptionsMonitor<AgentPromptCatalogOptions>
    {
        public AgentPromptCatalogOptions CurrentValue
        {
            get;
        } = value;

        public AgentPromptCatalogOptions Get(string? name)
        {
            return CurrentValue;
        }

        public IDisposable? OnChange(Action<AgentPromptCatalogOptions, string?> listener)
        {
            return null;
        }
    }

    private sealed class FakeAuthorityRunOrchestratorForLiveAoai : IAuthorityRunOrchestrator
    {
        public Task<RunRecord> ExecuteAsync(
            ContextIngestionRequest request,
            CancellationToken cancellationToken = default,
            string? evidenceBundleIdForDeferredWork = null)
        {
            _ = cancellationToken;
            _ = evidenceBundleIdForDeferredWork;
            Guid runId = Guid.NewGuid();

            return Task.FromResult(new RunRecord
            {
                RunId = runId,
                ProjectId = request.ProjectId,
                Description = request.Description,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                FindingsSnapshotId = Guid.NewGuid(),
                GoldenManifestId = Guid.NewGuid(),
                DecisionTraceId = Guid.NewGuid(),
                ArtifactBundleId = Guid.NewGuid()
            });
        }

        /// <inheritdoc />
        public Task<RunRecord> CompleteQueuedAuthorityPipelineAsync(
            ContextIngestionRequest request,
            CancellationToken cancellationToken = default)
        {
            _ = cancellationToken;

            return Task.FromResult(new RunRecord
            {
                RunId = request.RunId,
                ProjectId = request.ProjectId,
                Description = request.Description,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                FindingsSnapshotId = Guid.NewGuid(),
                GoldenManifestId = Guid.NewGuid(),
                DecisionTraceId = Guid.NewGuid(),
                ArtifactBundleId = Guid.NewGuid()
            });
        }
    }
}
