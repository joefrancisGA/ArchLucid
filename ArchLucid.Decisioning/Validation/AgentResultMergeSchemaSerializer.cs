using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.Validation;

/// <summary>
///     Serializes <see cref="AgentResult" /> for merge-time JSON Schema validation using the same tolerant
///     converters as <see cref="ArchLucid.AgentRuntime.AgentResultParser" />.
/// </summary>
public static class AgentResultMergeSchemaSerializer
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        Converters =
        {
            new JsonStringEnumConverter(),
            new EvalCorpusFindingSeverityJsonConverter(),
            new ServiceTypeJsonConverter(),
            new RuntimePlatformJsonConverter(),
            new DatastoreTypeJsonConverter(),
            new RelationshipTypeJsonConverter(),
            new JsonStringEnumConverter<FindingConfidenceLevel>(allowIntegerValues: true),
            new AgentResultClaimListJsonConverter(),
            new AgentTopologyProposalJsonConverter()
        }
    };

    public static string Serialize(AgentResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        AgentResult normalized = AgentResultMergeNormalizer.Normalize(result);
        AgentResultSchemaWireDocument wire = AgentResultSchemaWireDocument.FromAgentResult(normalized);

        return JsonSerializer.Serialize(wire, JsonOptions);
    }
}
