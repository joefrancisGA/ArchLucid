using System.Text.Json;

namespace ArchLucid.Contracts.Governance.Resolution;

/// <summary>JSON helpers for <see cref="ExecutedEffectiveGovernanceSnapshotDescriptor" /> on <c>dbo.Runs.GovernanceScopeJson</c>.</summary>
public static class ExecutedEffectiveGovernanceSnapshotJson
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    public static string Serialize(ExecutedEffectiveGovernanceSnapshotDescriptor snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        return JsonSerializer.Serialize(snapshot, SerializerOptions);
    }

    public static ExecutedEffectiveGovernanceSnapshotDescriptor? TryDeserialize(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        try
        {
            return JsonSerializer.Deserialize<ExecutedEffectiveGovernanceSnapshotDescriptor>(json, SerializerOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
