using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Deserializes the <c>JSON_QUERY</c> fragments selected by the rollup projection. Corrupt fragments fail loudly:
///     silently dropping claims or findings would understate a run's severity in compare and rollup views.
/// </summary>
internal static class AgentResultRollupJsonReader
{
    public static List<string> ReadClaims(string? claimsJson, string runId)
    {
        if (string.IsNullOrWhiteSpace(claimsJson))
            return [];

        try
        {
            // Route through AgentResult so AgentResultClaimListJsonConverter accepts legacy claim shapes.
            AgentResult? shell = JsonSerializer.Deserialize<AgentResult>(
                $"{{\"claims\":{claimsJson}}}",
                AgentResultJsonSerialization.DeserializeOptions);

            return shell?.Claims ?? [];
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException($"Failed to deserialize rollup claims for run '{runId}'.", ex);
        }
    }

    public static List<string> ReadStringList(string? json, string runId, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(json))
            return [];

        try
        {
            return JsonSerializer.Deserialize<List<string>>(
                json,
                AgentResultJsonSerialization.DeserializeOptions) ?? [];
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException($"Failed to deserialize rollup {fieldName} for run '{runId}'.", ex);
        }
    }

    public static List<ArchitectureFinding> ReadFindings(string? findingsJson, string runId)
    {
        if (string.IsNullOrWhiteSpace(findingsJson))
            return [];

        try
        {
            return JsonSerializer.Deserialize<List<ArchitectureFinding>>(
                findingsJson,
                AgentResultJsonSerialization.DeserializeOptions) ?? [];
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException($"Failed to deserialize rollup findings for run '{runId}'.", ex);
        }
    }

    /// <summary>Returns <see langword="null" /> when neither control list carries content, matching stored JSON.</summary>
    public static AgentTopologyProposal? ReadProposedChanges(
        string? requiredControlsJson,
        string? warningsJson,
        string runId)
    {
        List<string> requiredControls = ReadStringList(requiredControlsJson, runId, "requiredControls");
        List<string> warnings = ReadStringList(warningsJson, runId, "warnings");

        if (requiredControls.Count == 0 && warnings.Count == 0)
            return null;

        return new AgentTopologyProposal
        {
            RequiredControls = requiredControls,
            Warnings = warnings,
        };
    }
}
