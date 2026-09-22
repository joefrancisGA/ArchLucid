using System.Text.Json;

using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.RemediationInstances;

public static class RemediationPathNarrativeJson
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    public static string Serialize(RemediationPathNarrative narrative)
    {
        ArgumentNullException.ThrowIfNull(narrative);

        return JsonSerializer.Serialize(narrative, SerializerOptions);
    }

    public static RemediationPathNarrative? TryDeserialize(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<RemediationPathNarrative>(json, SerializerOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
