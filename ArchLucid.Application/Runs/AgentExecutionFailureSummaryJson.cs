using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.Runs;

/// <summary>JSON helpers for persisting <see cref="AgentExecutionFailureSummary" /> on <c>dbo.Runs.LastFailureReason</c>.</summary>
public static class AgentExecutionFailureSummaryJson
{
    private const int SupportedSchemaVersion = 1;

    public static string Serialize(AgentExecutionFailureSummary summary)
    {
        ArgumentNullException.ThrowIfNull(summary);

        return JsonSerializer.Serialize(summary, ContractJson.Default);
    }

    public static AgentExecutionFailureSummary? TryDeserialize(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }

        string trimmed = json.TrimStart();

        if (!trimmed.StartsWith("{", StringComparison.Ordinal))
        {
            return null;
        }

        try
        {
            AgentExecutionFailureSummary? parsed =
                JsonSerializer.Deserialize<AgentExecutionFailureSummary>(json, ContractJson.Default);

            if (parsed is null || parsed.SchemaVersion != SupportedSchemaVersion)
            {
                return null;
            }

            return parsed;
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
