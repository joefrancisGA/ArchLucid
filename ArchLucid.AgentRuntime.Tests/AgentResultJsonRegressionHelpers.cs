using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime.Tests;

/// <summary>
///     Shared JSON options and hydration for agent wire regressions — matches
///     <see cref="AgentResultParser" /> (web defaults, case-insensitive names, string enums).
/// </summary>
internal static class AgentResultJsonRegressionHelpers
{
    /// <summary>Same shape as <c>AgentResultParser</c> private <c>JsonOptions</c>.</summary>
    public static JsonSerializerOptions ParserMatchingOptions { get; } = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() },
    };

    /// <summary>
    ///     Inserts a minimal <c>trace</c> object on every finding for
    ///     <see cref="ArchLucid.Core.GoldenCorpus.RealLlmOutputStructuralValidator" /> when absent (simulator/handler may
    ///     omit it on the CLR object; validator expects API wire shape).
    /// </summary>
    public static string WithExplainabilityTracesHydratedForContract(string agentResultJson)
    {
        JsonNode root = JsonNode.Parse(agentResultJson) ?? throw new InvalidOperationException("Result JSON is null.");

        if (root is not JsonObject obj)
            throw new InvalidOperationException("AgentResult JSON root must be an object.");

        if (obj["findings"] is not JsonArray findings)
            return agentResultJson;

        foreach (JsonNode? f in findings)
        {
            if (f is not JsonObject row)
                continue;

            if (row["trace"] is not null)
                continue;

            JsonObject trace = new()
            {
                ["sourceAgentExecutionTraceId"] = JsonValue.Create((string?)null),
                ["graphNodeIdsExamined"] = new JsonArray(),
                ["rulesApplied"] = new JsonArray(),
                ["decisionsTaken"] = new JsonArray(),
                ["alternativePathsConsidered"] = new JsonArray(),
                ["notes"] = new JsonArray(),
            };
            row["trace"] = trace;
        }

        return root.ToJsonString(ContractJson.Default);
    }
}
