using ArchLucid.AgentRuntime.QuickScan;
using ArchLucid.AgentRuntime;
using ArchLucid.AgentSimulator.Services;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentSimulation;
using ArchLucid.Host.Composition.AzureOpenAI;
using ArchLucid.Retrieval.PolicyPacks;
using System.Text.Json.Serialization;
using System.Text.Json;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

internal static class FakeAgentCompletionPipelineRegistrar
{
    /// <summary>
    /// Ask/Explanation paths resolve <see cref="IAgentCompletionClient"/> even when
    /// <see cref="SimulatorExecutionTraceRecordingExecutor"/> wraps <see cref="DeterministicAgentSimulator"/> (no real agent handlers).
    /// </summary>
    internal static void RegisterFakeAgentCompletionClient(IServiceCollection services)
    {
        JsonSerializerOptions jsonOptions = new(JsonSerializerDefaults.Web)
        {
            PropertyNameCaseInsensitive = true,
            Converters = { new JsonStringEnumConverter() }
        };

        services.AddScoped<ScopedInnerAgentCompletionClient>(_ => new ScopedInnerAgentCompletionClient(
            new FakeAgentCompletionClient(
            (systemPrompt, userPrompt) =>
            {
                if (systemPrompt.Contains(QuickScanLlmPrompts.ClientRoutingMarker, StringComparison.OrdinalIgnoreCase))
                    return FakeQuickScanCompletionJson.Build(userPrompt);

                if (systemPrompt.Contains(PolicyPackExplainLlmPrompts.SimulatorRoutingMarker, StringComparison.Ordinal))
                {
                    return """
                           ## Purpose
                           Simulator stub — replace with a live LLM deployment for narrative summaries.

                           ## Key rules
                           - Advisory only; verify against the JSON in production.

                           ## Operational impact
                           None (offline completion).
                           """;
                }

                if (systemPrompt.Contains("senior enterprise architect", StringComparison.OrdinalIgnoreCase))
                {
                    return """
                           {"answer":"Stub grounded answer for offline Ask completions. Risk:\n\nEvidence supports the manifest decisions in scope.\n\nMitigation:\n\nReview referenced decisions before commit.\n\nValidation:\n\nRe-run after manifest changes.","referencedDecisions":[],"referencedFindings":[],"referencedArtifacts":[]}
                           """;
                }

                string runId = "RUN-001";
                string taskId = "TASK-TOPO-001";

                foreach (string line in userPrompt.Split('\n'))
                {
                    ReadOnlySpan<char> span = line.AsSpan().Trim();

                    if (span.StartsWith("RunId:", StringComparison.OrdinalIgnoreCase))

                        runId = span.Length > 6 ? span[6..].Trim().ToString() : runId;

                    else if (span.StartsWith("TaskId:", StringComparison.OrdinalIgnoreCase))

                        taskId = span.Length > 7 ? span[7..].Trim().ToString() : taskId;

                }

                ArchitectureRequest dummyRequest = new()
                {
                    SystemName = "Default",
                    Description = "Default request for fake topology response.",
                    Environment = "prod"
                };
                AgentResult result = FakeScenarioFactory.CreateTopologyResult(runId, taskId, dummyRequest);

                return JsonSerializer.Serialize(result, jsonOptions);
            })));

        AgentModelTierCompositionModule.RegisterPassThroughTierCompletionRouter(services);
        SchemaRemediationCompletionRegistrar.RegisterSchemaRemediationAgentCompletionClient(services, useAzureOpenAi: false);
        AgentModelTierCompositionModule.RegisterAgentCompletionClientFromTierRouter(services);
    }
}
